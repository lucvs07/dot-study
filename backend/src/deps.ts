import type { PrismaClient } from "@prisma/client";
import type { Env } from "./config/env";
import type { StorageDriver } from "./storage/driver";

export interface Deps {
  env: Env;
  prisma: PrismaClient;
  now: () => Date;
  random: () => number;
  storage: StorageDriver;
}
