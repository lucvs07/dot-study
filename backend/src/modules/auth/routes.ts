import { Router } from "express";
import rateLimit from "express-rate-limit";
import type { Deps } from "../../deps";
import { requireAuth, userIdOf } from "../../middleware/auth";
import { createAuthService } from "./service";

export function createAuthRouter(deps: Deps): Router {
  const auth = createAuthService(deps);
  const limiterOptions = {
    windowMs: 15 * 60_000,
    limit: deps.env.AUTH_RATE_LIMIT,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (_req, res) => {
      res
        .status(429)
        .json({ error: { code: "VALIDATION", message: "Muitas tentativas. Aguarde alguns minutos e tente de novo." } });
    },
  } satisfies Parameters<typeof rateLimit>[0];
  const registerLimiter = rateLimit(limiterOptions);
  // no login só tentativas que falham contam (quem acerta a senha não fica bloqueado)
  const loginLimiter = rateLimit({ ...limiterOptions, skipSuccessfulRequests: true });
  const router = Router();
  router.post("/register", registerLimiter, async (req, res) => {
    res.status(201).json(await auth.register(req.body));
  });
  router.post("/login", loginLimiter, async (req, res) => {
    res.json(await auth.login(req.body));
  });
  router.get("/me", requireAuth(deps.env), async (req, res) => {
    res.json(await auth.me(userIdOf(req)));
  });
  return router;
}
