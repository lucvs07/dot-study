import { execSync } from "node:child_process";
import path from "node:path";

export default function setup() {
  const root = path.resolve(import.meta.dirname, "../..");
  process.loadEnvFile(path.join(root, ".env.test"));
  try {
    execSync("npx prisma migrate deploy", { cwd: root, env: process.env, stdio: "pipe" });
  } catch (error) {
    const detail = (error as { stderr?: Buffer }).stderr?.toString() ?? String(error);
    throw new Error(
      `Banco de teste indisponível em ${process.env.DATABASE_URL}.\n` +
        `Suba com: npm run db:test:up -w backend\n\n${detail}`,
    );
  }
}
