import { ACCESSORIES } from "@dot-study/shared/catalog";
import { z } from "zod";
import type { Deps } from "../../deps";
import { AppError, isUniqueViolation } from "../../errors";
import { toUser, userInclude } from "../../serialize";
import { parse } from "../../validate";

const purchaseSchema = z.object({
  accessoryId: z.string({ required_error: "Escolha um acessório." }).min(1, "Escolha um acessório."),
});
const catalogOrder = new Map(ACCESSORIES.map((a, i) => [a.id, i]));

export function createShopService(deps: Deps) {
  const { prisma } = deps;
  return {
    async list() {
      const rows = await prisma.accessory.findMany();
      return rows
        .map((a) => ({ id: a.id, name: a.name, cost: a.cost }))
        .sort((a, b) => (catalogOrder.get(a.id) ?? 99) - (catalogOrder.get(b.id) ?? 99));
    },

    async purchase(userId: string, body: unknown) {
      const { accessoryId } = parse(purchaseSchema, body);
      const item = await prisma.accessory.findUnique({ where: { id: accessoryId } });
      if (!item) throw new AppError("NOT_FOUND", "Acessório não encontrado.");
      const now = deps.now();
      try {
        const user = await prisma.$transaction(async (tx) => {
          if (await tx.userAccessory.findUnique({ where: { userId_accessoryId: { userId, accessoryId } } })) {
            throw new AppError("ALREADY_OWNED", "Você já tem esse acessório.");
          }
          // a chave primária (userId, accessoryId) impede o segundo desbloqueio simultâneo
          await tx.userAccessory.create({ data: { userId, accessoryId, unlockedAt: now } });
          const debited = await tx.user.updateMany({
            where: { id: userId, coins: { gte: item.cost } },
            data: { coins: { decrement: item.cost } },
          });
          if (debited.count === 0) throw new AppError("INSUFFICIENT_COINS", "Moedas insuficientes.");
          await tx.coinTransaction.create({
            data: { userId, amount: -item.cost, reason: "purchase", refId: item.id, createdAt: now },
          });
          return tx.user.findUniqueOrThrow({ where: { id: userId }, include: userInclude });
        });
        return toUser(user);
      } catch (error) {
        if (isUniqueViolation(error)) throw new AppError("ALREADY_OWNED", "Você já tem esse acessório.");
        throw error;
      }
    },
  };
}
