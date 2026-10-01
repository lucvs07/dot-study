import type { Author, User } from "@dot-study/shared/contracts";
import type { Prisma } from "@prisma/client";

export const userInclude = {
  accessories: { select: { accessoryId: true }, orderBy: { unlockedAt: "asc" } },
} satisfies Prisma.UserInclude;

export type UserRecord = Prisma.UserGetPayload<{ include: typeof userInclude }>;

export function toUser(u: UserRecord): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    coins: u.coins,
    dotColor: u.dotColor,
    activeAccessoryId: u.activeAccessoryId,
    unlockedAccessoryIds: u.accessories.map((a) => a.accessoryId),
    createdAt: u.createdAt.toISOString(),
  };
}

export function toAuthor(u: { id: string; name: string; dotColor: string; activeAccessoryId: string | null }): Author {
  return { id: u.id, name: u.name, dotColor: u.dotColor, activeAccessoryId: u.activeAccessoryId };
}
