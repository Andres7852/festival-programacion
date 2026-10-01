import express from "express";
import cors from "cors";
import type { ShowsRepository } from "../../domain/shows-repository.js";
import { ListShows } from "../../application/use-cases/list-shows.js";
import { GetShowById } from "../../application/use-cases/get-show-by-id.js";
import { GetShowsByArtist } from "../../application/use-cases/get-shows-by-artist.js";
import { CreateShow } from "../../application/use-cases/create-show.js";
import { UpdateShow } from "../../application/use-cases/update-show.js";
import { DeleteShow } from "../../application/use-cases/delete-show.js";
import { ShowsController } from "./shows.controller.js";
import { createShowsRouter } from "./shows.routes.js";
import { errorHandler, notFoundHandler } from "./error-handler.js";

export function createApp(showsRepository: ShowsRepository) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const controller = new ShowsController({
    listShows: new ListShows(showsRepository),
    getShowById: new GetShowById(showsRepository),
    getShowsByArtist: new GetShowsByArtist(showsRepository),
    createShow: new CreateShow(showsRepository),
    updateShow: new UpdateShow(showsRepository),
    deleteShow: new DeleteShow(showsRepository),
  });

  app.use("/api/shows", createShowsRouter(controller));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}