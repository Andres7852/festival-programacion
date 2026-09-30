import type { PrismaClient } from "../../../generated/prisma/client.js";
import type { ShowsRepository } from "../../domain/shows-repository.js";
import type { Show } from "../../domain/show.js";

export class PrismaShowsRepository implements ShowsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async artistExists(artistId: number) {
    const artist = await this.prisma.artistas.findUnique({
      where: { id: artistId },
      select: { id: true },
    });

    return artist !== null;
  }

  findActiveByArtistId(artistId: number): Promise<Show[]> {
    return this.prisma.shows.findMany({
      where: { artista_id: artistId, state: "ACTIVE" },
      orderBy: [{ dia_id: "asc" }, { hora_inicio: "asc" }],
      select: {
        id: true,
        artista_id: true,
        escenario_id: true,
        dia_id: true,
        hora_inicio: true,
        hora_fin: true,
        state: true,
      },
    });
  }
}