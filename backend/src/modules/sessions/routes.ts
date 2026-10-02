import { Router } from "express";
import type { Deps } from "../../deps";
import { requireAuth, userIdOf } from "../../middleware/auth";
import { createSessionService } from "./service";

export function createSessionsRouter(deps: Deps): Router {
  const sessions = createSessionService(deps);
  const router = Router();
  router.use(requireAuth(deps.env));
  router.post("/", async (req, res) => {
    res.status(201).json(await sessions.start(userIdOf(req), req.body));
  });
  router.get("/", async (req, res) => {
    res.json(await sessions.list(userIdOf(req)));
  });
  router.post("/:id/cycles", async (req, res) => {
    res.json(await sessions.completeCycle(userIdOf(req), req.params.id));
  });
  router.patch("/:id", async (req, res) => {
    res.json(await sessions.update(userIdOf(req), req.params.id, req.body));
  });
  return router;
}
