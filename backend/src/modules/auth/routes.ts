import { Router } from "express";
import rateLimit from "express-rate-limit";
import type { Deps } from "../../deps";
import { requireAuth, userIdOf } from "../../middleware/auth";
import { createAuthService } from "./service";

export function createAuthRouter(deps: Deps): Router {
  const auth = createAuthService(deps);
  const limiter = rateLimit({
    windowMs: 15 * 60_000,
    limit: deps.env.AUTH_RATE_LIMIT,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (_req, res) => {
      res
        .status(429)
        .json({ error: { code: "VALIDATION", message: "Muitas tentativas. Aguarde alguns minutos e tente de novo." } });
    },
  });
  const router = Router();
  router.post("/register", limiter, async (req, res) => {
    res.status(201).json(await auth.register(req.body));
  });
  router.post("/login", limiter, async (req, res) => {
    res.json(await auth.login(req.body));
  });
  router.get("/me", requireAuth(deps.env), async (req, res) => {
    res.json(await auth.me(userIdOf(req)));
  });
  return router;
}
