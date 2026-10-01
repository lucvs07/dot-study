import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { webOrigins } from "./config/env";
import type { Deps } from "./deps";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { createAuthRouter } from "./modules/auth/routes";
import { createSessionsRouter } from "./modules/sessions/routes";
import { createSubjectsRouter } from "./modules/subjects/routes";
import { createUsersRouter } from "./modules/users/routes";

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
  api.use("/auth", createAuthRouter(deps));
  api.use("/users", createUsersRouter(deps));
  api.use("/subjects", createSubjectsRouter(deps));
  api.use("/sessions", createSessionsRouter(deps));
  // ROTAS — as Tasks 7–9 montam aqui.

  app.use("/api/v1", api);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
