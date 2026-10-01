import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { seedDemo } from "../src/seed/demo";
import { createTestContext, getTestPrisma, loginAs, resetDb } from "./helpers";

describe("users", () => {
  beforeEach(async () => {
    await resetDb();
    await seedDemo(getTestPrisma(), new Date("2026-09-29T12:00:00.000Z"));
  });

  it("PATCH /users/me troca o nome", async () => {
    const { app } = createTestContext();
    const { token } = await loginAs(app);
    const res = await request(app)
      .patch("/api/v1/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "  Gui  " });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Gui");
  });

  it("trocar email/senha exige a senha atual correta", async () => {
    const { app } = createTestContext();
    const { token } = await loginAs(app);
    const patch = (body: object) =>
      request(app).patch("/api/v1/users/me").set("Authorization", `Bearer ${token}`).send(body);
    expect((await patch({ newPassword: "novasenha1" })).body.error).toEqual({
      code: "VALIDATION",
      message: "Informe sua senha atual.",
    });
    expect((await patch({ newPassword: "novasenha1", currentPassword: "errada" })).body.error).toEqual({
      code: "INVALID_CREDENTIALS",
      message: "Senha atual incorreta.",
    });
    expect((await patch({ email: "ana@exemplo.dotstudy.app", currentPassword: "dotstudy123" })).body.error.code).toBe(
      "EMAIL_TAKEN",
    );
    const ok = await patch({ email: "Novo@X.com", currentPassword: "dotstudy123", newPassword: "novasenha1" });
    expect(ok.body.email).toBe("novo@x.com");
    await expect(loginAs(app)).rejects.toThrow();
    await expect(loginAs(app, "novo@x.com", "novasenha1")).resolves.toBeTruthy();
  });

  it("PATCH /users/me/dot só aceita acessório desbloqueado e cor hex", async () => {
    const { app } = createTestContext();
    const { token } = await loginAs(app);
    const patch = (body: object) =>
      request(app).patch("/api/v1/users/me/dot").set("Authorization", `Bearer ${token}`).send(body);
    expect((await patch({ activeAccessoryId: "crown" })).body.error).toEqual({
      code: "NOT_OWNED",
      message: "Você ainda não desbloqueou esse acessório.",
    });
    expect((await patch({ dotColor: "vermelho" })).body.error.code).toBe("VALIDATION");
    expect((await patch({ activeAccessoryId: "hat", dotColor: "#A35BBF" })).body).toMatchObject({
      activeAccessoryId: "hat",
      dotColor: "#A35BBF",
    });
    expect((await patch({ activeAccessoryId: null })).body.activeAccessoryId).toBeNull();
  });

  it("GET /users/me/stats soma as sessões do demo", async () => {
    const { app } = createTestContext();
    const { token } = await loginAs(app);
    const res = await request(app).get("/api/v1/users/me/stats?tzOffset=0").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ completedCycles: 12, totalMinutes: 375 });
    expect(res.body.last7Days).toHaveLength(7);
    expect(res.body.last7Days.at(-1).date).toBe("2026-09-29");
    expect(res.body.streakDays).toBeGreaterThanOrEqual(1);
  });

  it("estatísticas respeitam o fuso: 22h de SP (01h UTC do dia seguinte) conta no dia local", async () => {
    const { app, prisma, clock } = createTestContext();
    const reg = await request(app)
      .post("/api/v1/auth/register")
      .send({ name: "Fuso", email: "fuso@x.com", password: "segredo12" });
    const token = reg.body.token;
    clock.current = new Date("2026-09-30T01:30:00.000Z"); // 22h30 de 29/09 em SP
    await prisma.studySession.create({
      data: {
        userId: reg.body.user.id,
        mode: "free",
        focusMinutes: 25,
        breakMinutes: 5,
        plannedCycles: 1,
        completedCycles: 1,
        status: "completed",
        startedAt: new Date("2026-09-30T00:35:00.000Z"),
        lastCycleAt: new Date("2026-09-30T01:00:00.000Z"),
        finishedAt: new Date("2026-09-30T01:00:00.000Z"),
      },
    });
    const sp = await request(app).get("/api/v1/users/me/stats?tzOffset=180").set("Authorization", `Bearer ${token}`);
    expect(sp.body.last7Days.at(-1)).toEqual({ date: "2026-09-29", minutes: 25 });
    expect(sp.body.streakDays).toBe(1);
    const utc = await request(app).get("/api/v1/users/me/stats?tzOffset=0").set("Authorization", `Bearer ${token}`);
    expect(utc.body.last7Days.at(-1)).toEqual({ date: "2026-09-30", minutes: 25 });
  });

  it("tzOffset inválido vira VALIDATION", async () => {
    const { app } = createTestContext();
    const { token } = await loginAs(app);
    const res = await request(app).get("/api/v1/users/me/stats?tzOffset=abc").set("Authorization", `Bearer ${token}`);
    expect(res.body.error.code).toBe("VALIDATION");
  });
});
