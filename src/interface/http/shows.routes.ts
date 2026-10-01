import { Router } from "express";
import type { ShowsController } from "./shows.controller.js";

export function createShowsRouter(controller: ShowsController): Router {
  const router = Router();

  router.get("/", controller.list);
  router.get("/artista/:artistaId", controller.listByArtist);
  router.get("/:id", controller.getById);
  router.post("/", controller.create);
  router.patch("/:id", controller.update);
  router.delete("/:id", controller.remove);

  return router;
}