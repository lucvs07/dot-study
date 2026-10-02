import { Router } from "express";
import type { Deps } from "../../deps";
import { AppError } from "../../errors";
import { requireAuth, userIdOf } from "../../middleware/auth";
import { createRankingService } from "./service";

export function createRankingsRouter(deps: Deps): Router {
  const rankings = createRankingService(deps);
  const router = Router();
  router.use(requireAuth(deps.env));
  router.get("/:subjectId", async (req, res) => {
    const id = Number(req.params.subjectId);
    if (!Number.isInteger(id)) throw new AppError("NOT_FOUND", "Assunto não encontrado.");
    res.json(await rankings.bySubject(userIdOf(req), id));
  });
  return router;
}
