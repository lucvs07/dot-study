import { describe, expect, it } from "vitest";
import { createAuthService } from "./auth";
import { createTestContext } from "./context";
import { createRankingService } from "./rankings";
import { createShopService } from "./shop";
import { DEMO_USER } from "./seed";

async function setup() {
  const ctx = createTestContext();
  await createAuthService(ctx).login({ email: DEMO_USER.email, password: DEMO_USER.password });
  return { ctx, rankings: createRankingService(ctx), shop: createShopService(ctx) };
}

describe("RankingService (mock)", () => {
  it("calcula o ranking de Matemática a partir do seed e marca o usuário atual", async () => {
    const { rankings } = await setup();
    const list = await rankings.bySubject(1);
    expect(list.slice(0, 3).map((e) => [e.user.name, e.score])).toEqual([
      ["Ana Clara M.", 510],
      ["Rafael Costa", 420],
      ["Carla Nunes", 360],
    ]);
    expect(list.find((e) => e.isMe)).toMatchObject({ user: { name: "Guilherme" }, score: 30 });
  });
});

describe("ShopService (mock)", () => {
  it("lista os 10 acessórios", async () => {
    const { shop } = await setup();
    expect(await shop.listAccessories()).toHaveLength(10);
  });

  it("compra debita, desbloqueia e registra transação", async () => {
    const { ctx, shop } = await setup();
    const user = await shop.purchase("bow");
    expect(user.coins).toBe(590);
    expect(user.unlockedAccessoryIds).toContain("bow");
    expect(ctx.db.read().transactions.at(-1)).toMatchObject({ amount: -250, reason: "purchase", refId: "bow" });
  });

  it("recusa já desbloqueado, saldo insuficiente e inexistente", async () => {
    const { shop } = await setup();
    await expect(shop.purchase("hat")).rejects.toMatchObject({ code: "ALREADY_OWNED" });
    await expect(shop.purchase("crown")).rejects.toMatchObject({ code: "INSUFFICIENT_COINS" });
    await expect(shop.purchase("nada")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("clique duplo: duas compras em paralelo debitam uma vez só", async () => {
    const ctx = createTestContext({ wait: () => new Promise((r) => setTimeout(r, 5)) });
    await createAuthService(ctx).login({ email: DEMO_USER.email, password: DEMO_USER.password });
    const shop = createShopService(ctx);
    const results = await Promise.allSettled([shop.purchase("bow"), shop.purchase("bow")]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(ctx.db.read().users.find((u) => u.id === "u_demo")!.coins).toBe(590);
  });
});
