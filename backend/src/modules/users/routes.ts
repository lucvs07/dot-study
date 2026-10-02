import { Router } from "express";
import type { Deps } from "../../deps";
import { requireAuth, userIdOf } from "../../middleware/auth";
import { createUserService } from "./service";

export function createUsersRouter(deps: Deps): Router {
  const users = createUserService(deps);
  const router = Router();
  router.use(requireAuth(deps.env));
  router.patch("/me", async (req, res) => {
    res.json(await users.updateProfile(userIdOf(req), req.body));
  });
  router.patch("/me/dot", async (req, res) => {
    res.json(await users.updateDot(userIdOf(req), req.body));
  });
  router.get("/me/stats", async (req, res) => {
    res.json(await users.getStats(userIdOf(req), req.query));
  });
  return router;
}
