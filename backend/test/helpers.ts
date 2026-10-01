import { PrismaClient } from "@prisma/client";
import { afterAll } from "vitest";
import { createApp } from "../src/app";
import { loadEnv, type Env } from "../src/config/env";
import type { Deps } from "../src/deps";
import { seedCatalog } from "../src/seed/catalog";
import type { StorageDriver } from "../src/storage/driver";
import { createLocalStorage } from "../src/storage/local";

let prisma: PrismaClient | null = null;

export function getTestPrisma(): PrismaClient {
  prisma ??= new PrismaClient();
  return prisma;
}

afterAll(async () => {
  await prisma?.$disconnect();
  prisma = null;
});

const TABLES = [
  "Like",
  "Save",
  "Comment",
  "Post",
  "Media",
  "CoinTransaction",
  "UserAccessory",
  "StudySession",
  "User",
  "Theme",
  "Subject",
  "Accessory",
];

export async function resetDb(): Promise<void> {
  const list = TABLES.map((t) => `"${t}"`).join(", ");
  await getTestPrisma().$executeRawUnsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
  await seedCatalog(getTestPrisma());
}

export interface TestClock {
  current: Date;
  advance(ms: number): void;
}

export function createTestContext(opts: { storage?: StorageDriver; random?: () => number; env?: Partial<Env> } = {}) {
  const env = { ...loadEnv(process.env), ...opts.env };
  const clock: TestClock = {
    current: new Date("2026-09-29T12:00:00.000Z"),
    advance(ms) {
      this.current = new Date(this.current.getTime() + ms);
    },
  };
  const deps: Deps = {
    env,
    prisma: getTestPrisma(),
    now: () => clock.current,
    random: opts.random ?? (() => 0),
    storage: opts.storage ?? createLocalStorage(env.UPLOAD_DIR),
  };
  return { app: createApp(deps), deps, clock, prisma: deps.prisma };
}
