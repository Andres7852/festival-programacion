import assert from "node:assert/strict";
import test from "node:test";
import { ArtistNotFoundError, GetShowsByArtist } from "../src/application/get-shows-by-artist.js";
import type { ShowsRepository } from "../src/domain/shows-repository.js";
import type { Show } from "../src/domain/show.js";

const activeShow: Show = {
  id: 1,
  artista_id: 1,
  escenario_id: 1,
  dia_id: 1,
  hora_inicio: "21:00",
  hora_fin: "22:30",
  state: "ACTIVE",
};

test("devuelve los shows activos del artista existente", async () => {
  const repository: ShowsRepository = {
    artistExists: async () => true,
    findActiveByArtistId: async () => [activeShow],
  };

  const shows = await new GetShowsByArtist(repository).execute(1);

  assert.deepEqual(shows, [activeShow]);
});

test("falla cuando el artista no existe", async () => {
  const repository: ShowsRepository = {
    artistExists: async () => false,
    findActiveByArtistId: async () => [],
  };

  await assert.rejects(
    new GetShowsByArtist(repository).execute(999999),
    ArtistNotFoundError,
  );
});