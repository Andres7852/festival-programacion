import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import type { AddressInfo } from "node:net";
import type { ShowsRepository } from "../src/domain/shows-repository.js";
import type { Show } from "../src/domain/show.js";
import { createApp } from "../src/presentation/http/create-app.js";

const activeShow: Show = {
  id: 1,
  artista_id: 1,
  escenario_id: 1,
  dia_id: 1,
  hora_inicio: "21:00",
  hora_fin: "22:30",
  state: "ACTIVE",
};

test("GET shows por artista responde con datos y valida el id", async () => {
  const repository: ShowsRepository = {
    artistExists: async (artistId) => artistId === 1,
    findActiveByArtistId: async () => [activeShow],
  };
  const server = createApp(repository).listen(0);
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const success = await fetch(`${baseUrl}/api/shows/artista/1`);
    assert.equal(success.status, 200);
    assert.deepEqual(await success.json(), { data: [activeShow] });

    const missing = await fetch(`${baseUrl}/api/shows/artista/999999`);
    assert.equal(missing.status, 404);
    assert.equal(typeof (await missing.json()).error, "string");

    const invalid = await fetch(`${baseUrl}/api/shows/artista/abc`);
    assert.equal(invalid.status, 400);
    assert.equal(typeof (await invalid.json()).error, "string");
  } finally {
    server.close();
    await once(server, "close");
  }
});