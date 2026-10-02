import { ServiceError, type ShopService } from "@/services/contracts";
import { addCoins, requireUser, toUser, type MockContext } from "./context";
import { ACCESSORIES } from "./seed";

export function createShopService(ctx: MockContext): ShopService {
  return {
    async listAccessories() {
      await ctx.wait();
      return structuredClone(ACCESSORIES);
    },
    async purchase(accessoryId) {
      await ctx.wait();
      return ctx.db.write((draft) => {
        const user = requireUser(draft);
        const item = ACCESSORIES.find((a) => a.id === accessoryId);
        if (!item) throw new ServiceError("NOT_FOUND", "Acessório não encontrado.");
        if (user.unlockedAccessoryIds.includes(item.id))
          throw new ServiceError("ALREADY_OWNED", "Você já tem esse acessório.");
        if (user.coins < item.cost) throw new ServiceError("INSUFFICIENT_COINS", "Moedas insuficientes.");
        user.unlockedAccessoryIds.push(item.id);
        addCoins(draft, user.id, -item.cost, "purchase", item.id, new Date(ctx.now()).toISOString());
        return toUser(user);
      });
    },
  };
}
