import { Router } from "express";
import type { Deps } from "../../deps";
import { requireAuth, userIdOf } from "../../middleware/auth";
import { createShopService } from "./service";

export function createShopRouter(deps: Deps): Router {
  const shop = createShopService(deps);
  const router = Router();
  router.use(requireAuth(deps.env));
  router.get("/accessories", async (_req, res) => {
    res.json(await shop.list());
  });
  router.post("/purchase", async (req, res) => {
    res.json(await shop.purchase(userIdOf(req), req.body));
  });
  return router;
}
