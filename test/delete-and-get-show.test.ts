import assert from "node:assert/strict";
import test from "node:test";
import { GetShowById } from "../src/application/use-cases/get-show-by-id.js";
import { DeleteShow } from "../src/application/use-cases/delete-show.js";
import { NotFoundError, ValidationError } from "../src/domain/errors/domain-errors.js";
import { FakeShowsRepository, bombaEstereo } from "./fake-shows-repository.js";

test("GetShowById: devuelve el show cuando existe y esta activo", async () => {
  const repo = new FakeShowsRepository([bombaEstereo()]);
  const useCase = new GetShowById(repo);

  const show = await useCase.execute(1);
  assert.equal(show.id, 1);
  assert.equal(show.artista_id, 1);
  assert.equal(show.hora_inicio, "21:00");
});

test("GetShowById: lanza NotFoundError si no existe o fue borrado", async () => {
  const repo = new FakeShowsRepository([
    bombaEstereo(),
    { id: 2, artista_id: 2, escenario_id: 1, dia_id: 1, hora_inicio: "18:00", hora_fin: "19:00", state: "REMOVED" },
  ]);
  const useCase = new GetShowById(repo);

  await assert.rejects(useCase.execute(999999), NotFoundError);
  await assert.rejects(useCase.execute(2), NotFoundError);
});

test("GetShowById: lanza ValidationError si el id no es un entero positivo", async () => {
  const repo = new FakeShowsRepository([bombaEstereo()]);
  const useCase = new GetShowById(repo);

  await assert.rejects(useCase.execute(0), ValidationError);
  await assert.rejects(useCase.execute(-1), ValidationError);
  await assert.rejects(useCase.execute(1.5), ValidationError);
  await assert.rejects(useCase.execute(Number("abc")), ValidationError);
});

test("DeleteShow: realiza borrado logico cambiando state a REMOVED", async () => {
  const repo = new FakeShowsRepository([bombaEstereo()]);
  const deleteUseCase = new DeleteShow(repo);

  await deleteUseCase.execute(1);

  const deleted = await repo.findById(1);
  assert.equal(deleted?.state, "REMOVED");
});

test("DeleteShow: borrar dos veces el mismo registro responde NotFoundError (404)", async () => {
  const repo = new FakeShowsRepository([bombaEstereo()]);
  const deleteUseCase = new DeleteShow(repo);

  await deleteUseCase.execute(1);
  await assert.rejects(deleteUseCase.execute(1), NotFoundError);
});

test("DeleteShow: lanzar NotFoundError si el id no existe", async () => {
  const repo = new FakeShowsRepository([bombaEstereo()]);
  const deleteUseCase = new DeleteShow(repo);

  await assert.rejects(deleteUseCase.execute(999999), NotFoundError);
});

test("DeleteShow: lanzar ValidationError si el id es invalido", async () => {
  const repo = new FakeShowsRepository([bombaEstereo()]);
  const deleteUseCase = new DeleteShow(repo);

  await assert.rejects(deleteUseCase.execute(0), ValidationError);
  await assert.rejects(deleteUseCase.execute(-5), ValidationError);
  await assert.rejects(deleteUseCase.execute(Number("abc")), ValidationError);
});
