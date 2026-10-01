import assert from "node:assert/strict";
import test from "node:test";
import { ListShows } from "../src/application/use-cases/list-shows.js";
import { ValidationError } from "../src/domain/errors/domain-errors.js";
import { FakeShowsRepository } from "./fake-shows-repository.js";
import type { Show } from "../src/domain/show.js";

const sampleShows: Show[] = [
  { id: 1, artista_id: 1, escenario_id: 1, dia_id: 1, hora_inicio: "14:00", hora_fin: "15:00", state: "ACTIVE" },
  { id: 2, artista_id: 2, escenario_id: 1, dia_id: 1, hora_inicio: "15:30", hora_fin: "16:30", state: "ACTIVE" },
  { id: 3, artista_id: 3, escenario_id: 2, dia_id: 1, hora_inicio: "17:00", hora_fin: "18:00", state: "ACTIVE" },
  { id: 4, artista_id: 7, escenario_id: 1, dia_id: 2, hora_inicio: "19:00", hora_fin: "20:00", state: "ACTIVE" },
  { id: 5, artista_id: 1, escenario_id: 2, dia_id: 2, hora_inicio: "21:00", hora_fin: "22:00", state: "REMOVED" },
];

test("ListShows: paginacion por defecto usa page=1 y limit=10 y excluye REMOVED", async () => {
  const repo = new FakeShowsRepository([...sampleShows]);
  const useCase = new ListShows(repo);

  const result = await useCase.execute({});

  assert.equal(result.pagination.currentPage, 1);
  assert.equal(result.pagination.limit, 10);
  assert.equal(result.pagination.total, 4);
  assert.equal(result.pagination.totalPages, 1);
  assert.equal(result.data.length, 4);
  assert.ok(result.data.every((s) => s.state !== "REMOVED"));
});

test("ListShows: paginacion personalizada con limit=2 devuelve 2 registros y calcula paginas", async () => {
  const repo = new FakeShowsRepository([...sampleShows]);
  const useCase = new ListShows(repo);

  const pag1 = await useCase.execute({ page: 1, limit: 2 });
  assert.equal(pag1.pagination.currentPage, 1);
  assert.equal(pag1.pagination.limit, 2);
  assert.equal(pag1.pagination.total, 4);
  assert.equal(pag1.pagination.totalPages, 2);
  assert.equal(pag1.data.length, 2);
  assert.equal(pag1.data[0].id, 1);
  assert.equal(pag1.data[1].id, 2);

  const pag2 = await useCase.execute({ page: 2, limit: 2 });
  assert.equal(pag2.pagination.currentPage, 2);
  assert.equal(pag2.data.length, 2);
  assert.equal(pag2.data[0].id, 3);
  assert.equal(pag2.data[1].id, 4);
});

test("ListShows: filtro por dia_id devuelve solo shows de ese dia", async () => {
  const repo = new FakeShowsRepository([...sampleShows]);
  const useCase = new ListShows(repo);

  const result = await useCase.execute({ dia_id: 1 });
  assert.equal(result.data.length, 3);
  assert.ok(result.data.every((s) => s.dia_id === 1));
});

test("ListShows: filtros combinados por dia_id y escenario_id", async () => {
  const repo = new FakeShowsRepository([...sampleShows]);
  const useCase = new ListShows(repo);

  const result = await useCase.execute({ dia_id: 1, escenario_id: 1 });
  assert.equal(result.data.length, 2);
  assert.ok(result.data.every((s) => s.dia_id === 1 && s.escenario_id === 1));
});

test("ListShows: validaciones de paginacion y filtros lanzan ValidationError", async () => {
  const repo = new FakeShowsRepository([...sampleShows]);
  const useCase = new ListShows(repo);

  await assert.rejects(useCase.execute({ page: 0 }), ValidationError);
  await assert.rejects(useCase.execute({ page: -1 }), ValidationError);
  await assert.rejects(useCase.execute({ limit: 0 }), ValidationError);
  await assert.rejects(useCase.execute({ limit: 51 }), ValidationError);
  await assert.rejects(useCase.execute({ dia_id: 0 }), ValidationError);
  await assert.rejects(useCase.execute({ dia_id: -2 }), ValidationError);
  await assert.rejects(useCase.execute({ escenario_id: -1 }), ValidationError);
  await assert.rejects(useCase.execute({ artista_id: -1 }), ValidationError);
});
