import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { seedDemo } from "../src/seed/demo";
import { createTestContext, getTestPrisma, loginAs, resetDb } from "./helpers";

async function setup(random = () => 0.99) {
  await resetDb();
  await seedDemo(getTestPrisma(), new Date("2026-09-29T12:00:00.000Z"));
  const ctx = createTestContext({ random });
  const { token } = await loginAs(ctx.app);
  const api = {
    get: (p: string) => request(ctx.app).get(`/api/v1${p}`).set("Authorization", `Bearer ${token}`),
    post: (p: string, b?: object) =>
      request(ctx.app).post(`/api/v1${p}`).set("Authorization", `Bearer ${token}`).send(b),
    patch: (p: string, b: object) =>
      request(ctx.app).patch(`/api/v1${p}`).set("Authorization", `Bearer ${token}`).send(b),
  };
  return { ...ctx, api };
}

describe("subjects", () => {
  beforeEach(resetDb);
  it("lista 5 assuntos com 6 temas e sorteia tema", async () => {
    const { api } = await setup(() => 0);
    const list = await api.get("/subjects");
    expect(list.body).toHaveLength(5);
    expect(list.body[0]).toMatchObject({ id: 1, name: "Matemática", icon: "sigma" });
    expect(list.body[0].themes).toHaveLength(6);
    expect((await api.get("/subjects/2/random-theme")).body).toMatchObject({
      subjectId: 2,
      title: "Mecânica Clássica",
    });
    expect((await api.get("/subjects/99/random-theme")).body.error.code).toBe("NOT_FOUND");
  });
});

describe("sessions", () => {
  it("desafio aleatório sorteia assunto 5 e tema 506 com random 0.99", async () => {
    const { api } = await setup();
    const res = await api.post("/sessions", { mode: "challenge", subjectId: "random", focusMinutes: 25 });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      mode: "challenge",
      subjectId: 5,
      themeId: 506,
      plannedCycles: 1,
      breakMinutes: 0,
      status: "in_progress",
      startedAt: "2026-09-29T12:00:00.000Z",
    });
  });

  it("valida entrada", async () => {
    const { api } = await setup();
    expect((await api.post("/sessions", { mode: "challenge", subjectId: 1, focusMinutes: 0 })).body.error.code).toBe(
      "VALIDATION",
    );
    expect(
      (await api.post("/sessions", { mode: "free", label: null, focusMinutes: 25, breakMinutes: 5, plannedCycles: 13 }))
        .body.error.code,
    ).toBe("VALIDATION");
    expect((await api.post("/sessions", { mode: "outro" })).body.error.code).toBe("VALIDATION");
  });

  it("ciclo cedo demais → 409 CYCLE_TOO_SOON; no tempo → +10 e sessão concluída", async () => {
    const { api, clock, prisma } = await setup();
    const s = (await api.post("/sessions", { mode: "challenge", subjectId: 1, focusMinutes: 25 })).body;
    clock.advance(60_000);
    const early = await api.post(`/sessions/${s.id}/cycles`);
    expect(early.status).toBe(409);
    expect(early.body.error).toEqual({ code: "CYCLE_TOO_SOON", message: "Esse ciclo ainda não terminou." });
    clock.advance(21.5 * 60_000); // 22min30s = 90% de 25min
    const ok = await api.post(`/sessions/${s.id}/cycles`);
    expect(ok.status).toBe(200);
    expect(ok.body.reward).toEqual({ coinsEarned: 10, balance: 850 });
    expect(ok.body.session).toMatchObject({ completedCycles: 1, status: "completed" });
    expect(await prisma.coinTransaction.findFirst({ where: { refId: s.id } })).toMatchObject({
      amount: 10,
      reason: "cycle",
    });
    expect((await api.post(`/sessions/${s.id}/cycles`)).body.error.code).toBe("SESSION_CLOSED");
  });

  it("duas conclusões simultâneas do mesmo ciclo pagam uma vez só", async () => {
    const { api, clock, prisma } = await setup();
    const s = (
      await api.post("/sessions", { mode: "free", label: null, focusMinutes: 10, breakMinutes: 2, plannedCycles: 3 })
    ).body;
    clock.advance(10 * 60_000);
    const results = await Promise.all([api.post(`/sessions/${s.id}/cycles`), api.post(`/sessions/${s.id}/cycles`)]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: "u_demo" } })).coins).toBe(850);
    expect((await prisma.studySession.findUniqueOrThrow({ where: { id: s.id } })).completedCycles).toBe(1);
  });

  it("iniciar outra sessão abandona a anterior (recarregou a página)", async () => {
    const { api, clock } = await setup();
    const old = (await api.post("/sessions", { mode: "challenge", subjectId: 1, focusMinutes: 25 })).body;
    await api.post("/sessions", { mode: "challenge", subjectId: 2, focusMinutes: 25 });
    clock.advance(30 * 60_000);
    expect((await api.post(`/sessions/${old.id}/cycles`)).body.error.code).toBe("SESSION_CLOSED");
    expect((await api.get("/sessions")).body.find((x: { id: string }) => x.id === old.id).status).toBe("abandoned");
  });

  it("anotações, finalizar e isolamento entre usuários", async () => {
    const { api, app } = await setup();
    const s = (await api.post("/sessions", { mode: "challenge", subjectId: 1, focusMinutes: 25 })).body;
    expect((await api.patch(`/sessions/${s.id}`, { notes: "limites e derivadas" })).body.notes).toBe(
      "limites e derivadas",
    );
    expect((await api.patch(`/sessions/${s.id}`, { status: "abandoned" })).body.status).toBe("abandoned");
    expect((await api.patch("/sessions/seed_u_ana_1", { notes: "x" })).body.error.code).toBe("NOT_FOUND");
    const other = await request(app)
      .post("/api/v1/auth/register")
      .send({ name: "Outra", email: "o@x.com", password: "segredo12" });
    const res = await request(app)
      .post(`/api/v1/sessions/${s.id}/cycles`)
      .set("Authorization", `Bearer ${other.body.token}`);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("GET /sessions devolve só as minhas, mais recentes primeiro", async () => {
    const { api } = await setup();
    const list = (await api.get("/sessions")).body;
    expect(list.every((s: { userId: string }) => s.userId === "u_demo")).toBe(true);
    expect(list[0].id).toBe("h1");
  });
});
