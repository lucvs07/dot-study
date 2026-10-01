import { z } from "zod";

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatório"),
    JWT_SECRET: z.string().min(32, "JWT_SECRET precisa ter pelo menos 32 caracteres"),
    JWT_EXPIRES_IN: z.string().default("7d"),
    WEB_ORIGIN: z.string().default("http://127.0.0.1:5173"),
    STORAGE_DRIVER: z.enum(["local", "cloudinary"]).default("local"),
    UPLOAD_DIR: z.string().default("./uploads"),
    CLOUDINARY_URL: z.string().optional(),
    AUTH_RATE_LIMIT: z.coerce.number().int().positive().default(20),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  })
  .superRefine((e, ctx) => {
    if (e.STORAGE_DRIVER === "cloudinary" && !e.CLOUDINARY_URL) {
      ctx.addIssue({
        code: "custom",
        path: ["CLOUDINARY_URL"],
        message: "CLOUDINARY_URL é obrigatório com STORAGE_DRIVER=cloudinary",
      });
    }
  });

export type Env = z.infer<typeof schema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = schema.safeParse(source);
  if (!result.success) {
    const lines = result.error.issues.map((i) => `- ${i.path.join(".")}: ${i.message}`);
    throw new Error(`Configuração inválida do backend:\n${lines.join("\n")}`);
  }
  return result.data;
}

export function webOrigins(env: Env): string[] {
  return env.WEB_ORIGIN.split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}
