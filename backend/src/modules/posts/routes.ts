import { Router } from "express";
import type { Deps } from "../../deps";
import { requireAuth, userIdOf } from "../../middleware/auth";
import { createPostService, type MediaResolver } from "./service";

export function createPostsRouter(deps: Deps, resolveMedia?: MediaResolver): Router {
  const posts = createPostService(deps, resolveMedia);
  const router = Router();
  router.use(requireAuth(deps.env));
  router.get("/", async (req, res) => {
    res.json(await posts.list(userIdOf(req), req.query));
  });
  router.post("/", async (req, res) => {
    res.status(201).json(await posts.create(userIdOf(req), req.body));
  });
  router.get("/:id", async (req, res) => {
    res.json(await posts.get(userIdOf(req), req.params.id));
  });
  router.post("/:id/like", async (req, res) => {
    res.json(await posts.toggle(userIdOf(req), req.params.id, "like", true));
  });
  router.delete("/:id/like", async (req, res) => {
    res.json(await posts.toggle(userIdOf(req), req.params.id, "like", false));
  });
  router.post("/:id/save", async (req, res) => {
    res.json(await posts.toggle(userIdOf(req), req.params.id, "save", true));
  });
  router.delete("/:id/save", async (req, res) => {
    res.json(await posts.toggle(userIdOf(req), req.params.id, "save", false));
  });
  router.get("/:id/comments", async (req, res) => {
    res.json(await posts.listComments(userIdOf(req), req.params.id));
  });
  router.post("/:id/comments", async (req, res) => {
    res.status(201).json(await posts.addComment(userIdOf(req), req.params.id, req.body));
  });
  return router;
}
