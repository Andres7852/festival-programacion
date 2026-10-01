import type { ShowsRepository } from "../domain/shows-repository.js";

export class ArtistNotFoundError extends Error {}

export class GetShowsByArtist {
  constructor(private readonly showsRepository: ShowsRepository) {}

  async execute(artistId: number) {
    if (!(await this.showsRepository.artistExists(artistId))) {
      throw new ArtistNotFoundError("Artista no encontrado");
    }

    return this.showsRepository.findActiveByArtistId(artistId);
  }
}