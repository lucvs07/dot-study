import { type Author, ServiceError, type User, type CoinReason, type ID } from "@/services/contracts";
import { MockDb, type DbState, type UserRecord } from "./db";
import { createMemoryStorage } from "./storage";
import { newId } from "./latency";
import { buildSeed } from "./seed";

export interface MockContext {
  db: MockDb;
  now: () => number;
  random: () => number;
  wait: () => Promise<void>;
}

/** Contexto de teste: banco em memória com seed gerado no MESMO relógio do contexto. */
export function createTestContext(overrides: Partial<MockContext> = {}): MockContext {
  const now = overrides.now ?? (() => Date.parse("2026-09-29T12:00:00.000Z"));
  return {
    db: overrides.db ?? new MockDb(createMemoryStorage(), () => buildSeed(now())),
    now,
    random: overrides.random ?? (() => 0),
    wait: overrides.wait ?? (async () => {}),
  };
}

export function findCurrentUser(state: DbState): UserRecord | null {
  return state.users.find((u) => u.id === state.currentUserId) ?? null;
}

export function requireUser(state: DbState): UserRecord {
  const user = findCurrentUser(state);
  if (!user) throw new ServiceError("UNAUTHORIZED", "Faça login para continuar.");
  return user;
}

export function toUser({ passwordHash: _hash, ...user }: UserRecord): User {
  return structuredClone(user);
}

export function toAuthor(u: UserRecord): Author {
  return { id: u.id, name: u.name, dotColor: u.dotColor, activeAccessoryId: u.activeAccessoryId };
}

export function addCoins(
  draft: DbState,
  userId: ID,
  amount: number,
  reason: CoinReason,
  refId: ID | null,
  nowIso: string,
): number {
  const user = draft.users.find((u) => u.id === userId)!;
  user.coins += amount;
  draft.transactions.push({ id: newId("tx"), userId, amount, reason, refId, createdAt: nowIso });
  return user.coins;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
