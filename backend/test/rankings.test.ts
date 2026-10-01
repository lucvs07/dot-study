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

  it("assunto inexistente devolve lista vazia; id inválido 404", async () => {
    const { app } = createTestContext();
    const { token } = await loginAs(app);
    expect((await request(app).get("/api/v1/rankings/99").set("Authorization", `Bearer ${token}`)).body).toEqual([]);
    expect((await request(app).get("/api/v1/rankings/abc").set("Authorization", `Bearer ${token}`)).status).toBe(404);
  });
});
