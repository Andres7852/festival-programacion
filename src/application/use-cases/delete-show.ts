import type { ShowsRepository } from "../../domain/shows-repository.js";
import { NotFoundError } from "../../domain/errors/domain-errors.js";
import { ensureValidId } from "../validators/show-validators.js";

export class DeleteShow {
  constructor(private readonly showsRepository: ShowsRepository) {}

  /** Borrado lógico: state pasa a 'REMOVED'. Borrar dos veces → 404. */
  async execute(id: number): Promise<void> {
    ensureValidId(id);

    const show = await this.showsRepository.findById(id);
    if (!show || show.state === "REMOVED") {
      throw new NotFoundError(`El show ${id} no existe`);
    }

    await this.showsRepository.softDelete(id);
  }
}