import type { ShowsRepository } from "../../domain/shows-repository.js";
import type { Show } from "../../domain/show.js";
import { NotFoundError, ValidationError } from "../../domain/errors/domain-errors.js";

export class GetShowById {
  constructor(private readonly showsRepository: ShowsRepository) {}

  async execute(id: number): Promise<Show> {
    if (!Number.isInteger(id) || id < 1) {
      throw new ValidationError("id debe ser un entero positivo");
    }

    const show = await this.showsRepository.findById(id);
    if (!show || show.state === "REMOVED") {
      throw new NotFoundError("Show no encontrado");
    }

    return show;
  }
}