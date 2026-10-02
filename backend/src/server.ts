import { PrismaClient } from "@prisma/client";
import { createApp } from "./app";
import { loadEnv } from "./config/env";
import { createStorage } from "./storage";

const env = loadEnv();
const prisma = new PrismaClient();
const app = createApp({ env, prisma, now: () => new Date(), random: Math.random, storage: createStorage(env) });

const server = app.listen(env.PORT, () => {
  console.log(`dot.study API ouvindo em http://127.0.0.1:${env.PORT}/api/v1`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.close(() => void prisma.$disconnect().then(() => process.exit(0)));
  });
}
