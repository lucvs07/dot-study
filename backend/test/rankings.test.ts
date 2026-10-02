import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { seedDemo } from "../src/seed/demo";
import { createTestContext, getTestPrisma, loginAs, resetDb } from "./helpers";

describe("rankings", () => {
  beforeEach(async () => {
    await resetDb();
    await seedDemo(getTestPrisma(), new Date("2026-09-29T12:00:00.000Z"));
  });

  it("Matemática: Ana 510, Rafael 420, Carla 360; demo marcado com isMe e 30 pontos", async () => {
    const { app } = createTestContext();
    const { token } = await loginAs(app);
    const res = await request(app).get("/api/v1/rankings/1").set("Authorization", `Bearer ${token}`);
    expect(res.body.slice(0, 3).map((e: { user: { name: string }; score: number }) => [e.user.name, e.score])).toEqual([
      ["Ana Clara M.", 510],
      ["Rafael Costa", 420],
      ["Carla Nunes", 360],
    ]);
    expect(res.body.find((e: { isMe: boolean }) => e.isMe)).toMatchObject({ user: { name: "Guilherme" }, score: 30 });
  });

  it("3 posts da mesma sessão com ciclo somam +30 uma vez; sessão sem ciclo não pontua", async () => {
    const { app, clock } = createTestContext();
    const { token } = await loginAs(app);
    const auth = { Authorization: `Bearer ${token}` };
    const score = async () =>
      (await request(app).get("/api/v1/rankings/1").set(auth)).body.find((e: { isMe: boolean }) => e.isMe)?.score ?? 0;
    const post = (sessionId: string) =>
      request(app).post("/api/v1/posts").set(auth).send({ sessionId, type: "text", title: "Resumo", content: "x" });

    const before = await score();
    const noCycle = (
      await request(app).post("/api/v1/sessions").set(auth).send({ mode: "challenge", subjectId: 1, focusMinutes: 25 })
    ).body;
    for (let i = 0; i < 3; i++) expect((await post(noCycle.id)).status).toBe(201);
    expect(await score()).toBe(before);

    const s = (
      await request(app).post("/api/v1/sessions").set(auth).send({ mode: "challenge", subjectId: 1, focusMinutes: 25 })
    ).body;
    clock.advance(25 * 60_000);
    expect((await request(app).post(`/api/v1/sessions/${s.id}/cycles`).set(auth)).status).toBe(200);
    for (let i = 0; i < 3; i++) expect((await post(s.id)).status).toBe(201);
    expect(await score()).toBe(before + 10 + 30);
  });

  it("assunto inexistente devolve lista vazia; id inválido 404", async () => {
    const { app } = createTestContext();
    const { token } = await loginAs(app);
    expect((await request(app).get("/api/v1/rankings/99").set("Authorization", `Bearer ${token}`)).body).toEqual([]);
    expect((await request(app).get("/api/v1/rankings/abc").set("Authorization", `Bearer ${token}`)).status).toBe(404);
  });
});
