import { PrismaClient } from "@prisma/client";
import { loadEnv } from "./config/env";
import { seedCatalog } from "./seed/catalog";
import { seedDemo } from "./seed/demo";

loadEnv(); // falha cedo com mensagem clara se faltar configuração
const prisma = new PrismaClient();
try {
  await seedCatalog(prisma);
  const { created } = await seedDemo(prisma, new Date());
  console.log(
    created ? "Seed: dados de demonstração criados." : "Seed: dados de demonstração já existiam, nada a fazer.",
  );
} finally {
  await prisma.$disconnect();
}
