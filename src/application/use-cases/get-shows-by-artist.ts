import type { ShowsRepository } from "../../domain/shows-repository.js";
import { NotFoundError, ValidationError } from "../../domain/errors/domain-errors.js";

export class ArtistNotFoundError extends NotFoundError {}

export class GetShowsByArtist {
  constructor(private readonly showsRepository: ShowsRepository) {}

  async execute(artistId: number) {
    if (!Number.isInteger(artistId) || artistId < 1) {
      throw new ValidationError("artistaId debe ser un entero positivo");
    }

    if (!(await this.showsRepository.artistExists(artistId))) {
      throw new ArtistNotFoundError("Artista no encontrado");
    }

    return this.showsRepository.findActiveByArtistId(artistId);
  }
}