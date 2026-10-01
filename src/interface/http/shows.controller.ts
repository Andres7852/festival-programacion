import type { Request, Response } from "express";
import type { ListShows } from "../../application/use-cases/list-shows.js";
import type { GetShowById } from "../../application/use-cases/get-show-by-id.js";
import type { GetShowsByArtist } from "../../application/use-cases/get-shows-by-artist.js";
import type { CreateShow } from "../../application/use-cases/create-show.js";
import type { UpdateShow } from "../../application/use-cases/update-show.js";
import type { DeleteShow } from "../../application/use-cases/delete-show.js";

export interface ShowsUseCases {
  listShows: ListShows;
  getShowById: GetShowById;
  getShowsByArtist: GetShowsByArtist;
  createShow: CreateShow;
  updateShow: UpdateShow;
  deleteShow: DeleteShow;
}

// Convierte el texto de la URL a número; "abc" queda NaN y el caso de uso responde 400
const toNumber = (value: unknown) => (value === undefined ? undefined : Number(value));

/**
 * Controlador delgado: recibe la petición, delega al caso de uso y responde.
 * Los errores los convierte en JSON el middleware error-handler.
 */
export class ShowsController {
  constructor(private readonly useCases: ShowsUseCases) {}

  list = async (req: Request, res: Response) => {
    const result = await this.useCases.listShows.execute({
      page: toNumber(req.query.page),
      limit: toNumber(req.query.limit),
      dia_id: toNumber(req.query.dia_id),
      escenario_id: toNumber(req.query.escenario_id),
      artista_id: toNumber(req.query.artista_id),
    });
    res.status(200).json(result);
  };

  getById = async (req: Request, res: Response) => {
    const show = await this.useCases.getShowById.execute(Number(req.params.id));
    res.status(200).json({ data: show });
  };

  listByArtist = async (req: Request, res: Response) => {
    const shows = await this.useCases.getShowsByArtist.execute(Number(req.params.artistaId));
    res.status(200).json({ data: shows });
  };

  create = async (req: Request, res: Response) => {
    const show = await this.useCases.createShow.execute(req.body);
    res.status(201).json({ data: show });
  };

  update = async (req: Request, res: Response) => {
    const show = await this.useCases.updateShow.execute(Number(req.params.id), req.body);
    res.status(200).json({ data: show });
  };

  remove = async (req: Request, res: Response) => {
    await this.useCases.deleteShow.execute(Number(req.params.id));
    res.status(200).json({ message: "Show eliminado correctamente" });
  };
}