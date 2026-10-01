import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { webOrigins } from "./config/env";
import type { Deps } from "./deps";
import { errorHandler, notFoundHandler } from "./middleware/error";

export function createApp(deps: Deps): express.Express {
  const { env } = deps;
  const app = express();
  app.disable("x-powered-by");
  if (env.NODE_ENV === "production") app.set("trust proxy", 1);
  app.use(pinoHttp({ level: env.LOG_LEVEL }));
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: webOrigins(env) }));
  app.use(express.json({ limit: "100kb" }));

  if (env.STORAGE_DRIVER === "local") {
    app.use("/media", express.static(env.UPLOAD_DIR, { maxAge: "7d", fallthrough: false, index: false }));
  }

  const api = express.Router();
  api.get("/health", async (_req, res) => {
    await deps.prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok" });
  });
  // ROTAS — as Tasks 4–9 montam aqui: api.use("/auth", createAuthRouter(deps)), etc.

  app.use("/api/v1", api);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
