import express from "express";
import { ArtistNotFoundError, GetShowsByArtist } from "../../application/get-shows-by-artist.js";
import type { ShowsRepository } from "../../domain/shows-repository.js";

export function createApp(showsRepository: ShowsRepository) {
  const app = express();
  const getShowsByArtist = new GetShowsByArtist(showsRepository);

  app.get("/api/shows/artista/:artistaId", async (request, response) => {
    const rawArtistId = request.params.artistaId;
    const artistId = Number(rawArtistId);

    if (!/^[1-9]\d*$/.test(rawArtistId) || !Number.isSafeInteger(artistId)) {
      response.status(400).json({ error: "artistaId debe ser un entero positivo" });
      return;
    }

    try {
      const shows = await getShowsByArtist.execute(artistId);
      response.status(200).json({ data: shows });
    } catch (error) {
      if (error instanceof ArtistNotFoundError) {
        response.status(404).json({ error: error.message });
        return;
      }

      response.status(500).json({ error: "Error interno del servidor" });
    }
  });

  return app;
}