import { Router } from "express";
import type { Deps } from "../../deps";
import { AppError } from "../../errors";
import { requireAuth } from "../../middleware/auth";
import { createSubjectService } from "./service";

export function createSubjectsRouter(deps: Deps): Router {
  const subjects = createSubjectService(deps);
  const router = Router();
  router.use(requireAuth(deps.env));
  router.get("/", async (_req, res) => {
    res.json(await subjects.list());
  });
  router.get("/:id/random-theme", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new AppError("NOT_FOUND", "Assunto não encontrado.");
    res.json(await subjects.randomTheme(id));
  });
  return router;
}
