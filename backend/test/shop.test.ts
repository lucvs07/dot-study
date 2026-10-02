import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { seedDemo } from "../src/seed/demo";
import { createTestContext, getTestPrisma, loginAs, resetDb } from "./helpers";

describe("shop", () => {
  beforeEach(async () => {
    await resetDb();
    await seedDemo(getTestPrisma(), new Date("2026-09-29T12:00:00.000Z"));
  });

  it("lista os 10 acessórios na ordem do catálogo", async () => {
    const { app } = createTestContext();
    const { token } = await loginAs(app);
    const res = await request(app).get("/api/v1/shop/accessories").set("Authorization", `Bearer ${token}`);
    expect(res.body).toHaveLength(10);
    expect(res.body[0]).toEqual({ id: "hat", name: "Chapéu de Formatura", cost: 500 });
  });

  it("compra debita, desbloqueia e registra a transação", async () => {
    const { app, prisma } = createTestContext();
    const { token } = await loginAs(app);
    const res = await request(app)
      .post("/api/v1/shop/purchase")
      .set("Authorization", `Bearer ${token}`)
      .send({ accessoryId: "bow" });
    expect(res.status).toBe(200);
    expect(res.body.coins).toBe(590);
    expect(res.body.unlockedAccessoryIds).toContain("bow");
    expect(await prisma.coinTransaction.findFirst({ where: { userId: "u_demo", reason: "purchase" } })).toMatchObject({
      amount: -250,
      refId: "bow",
    });
  });

  it("recusa já desbloqueado, saldo insuficiente e inexistente", async () => {
    const { app } = createTestContext();
    const { token } = await loginAs(app);
    const buy = async (accessoryId: string) =>
      (await request(app).post("/api/v1/shop/purchase").set("Authorization", `Bearer ${token}`).send({ accessoryId }))
        .body.error;
    expect(await buy("hat")).toEqual({ code: "ALREADY_OWNED", message: "Você já tem esse acessório." });
    expect(await buy("crown")).toEqual({ code: "INSUFFICIENT_COINS", message: "Moedas insuficientes." });
    expect((await buy("nada")).code).toBe("NOT_FOUND");
  });

  it("clique duplo / duas abas: compras simultâneas debitam uma vez só", async () => {
    const { app, prisma } = createTestContext();
    const { token } = await loginAs(app);
    const buy = () =>
      request(app).post("/api/v1/shop/purchase").set("Authorization", `Bearer ${token}`).send({ accessoryId: "bow" });
    const results = await Promise.all([buy(), buy(), buy()]);
    expect(results.filter((r) => r.status === 200)).toHaveLength(1);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: "u_demo" } })).coins).toBe(590);
    expect(await prisma.coinTransaction.count({ where: { userId: "u_demo", reason: "purchase" } })).toBe(1);
  });
});
