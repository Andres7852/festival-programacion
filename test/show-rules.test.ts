import assert from "node:assert/strict";
import test from "node:test";
import { CreateShow } from "../src/application/use-cases/create-show.js";
import { UpdateShow } from "../src/application/use-cases/update-show.js";
import { schedulesOverlap } from "../src/application/rules/show-rules.js";
import { ConflictError, NotFoundError, ValidationError } from "../src/domain/errors/domain-errors.js";
import { FakeShowsRepository, bombaEstereo } from "./fake-shows-repository.js";

test("schedulesOverlap: franjas que se cruzan y franjas que solo se tocan", () => {
  assert.equal(schedulesOverlap("21:00", "22:30", "22:00", "23:00"), true);
  assert.equal(schedulesOverlap("21:00", "22:30", "21:30", "22:00"), true); // una dentro de la otra
  assert.equal(schedulesOverlap("21:00", "22:30", "22:30", "23:00"), false); // empieza cuando termina la otra
  assert.equal(schedulesOverlap("21:00", "22:30", "19:00", "21:00"), false);
});

test("Regla 1: mismo escenario y día con horario cruzado → 409", async () => {
  const repo = new FakeShowsRepository([bombaEstereo()]);
  await assert.rejects(
    new CreateShow(repo).execute({ artista_id: 7, escenario_id: 1, dia_id: 1, hora_inicio: "21:30", hora_fin: "22:00" }),
    ConflictError,
  );
});

test("Regla 1: un show que empieza justo cuando termina otro sí se crea", async () => {
  const repo = new FakeShowsRepository([bombaEstereo()]);
  const show = await new CreateShow(repo).execute({ artista_id: 7, escenario_id: 1, dia_id: 1, hora_inicio: "22:30", hora_fin: "23:00" });
  assert.equal(show.hora_inicio, "22:30");
});

test("Regla 2: un artista no toca dos veces el mismo día → 409", async () => {
  const repo = new FakeShowsRepository([bombaEstereo()]);
  await assert.rejects(
    new CreateShow(repo).execute({ artista_id: 1, escenario_id: 4, dia_id: 1, hora_inicio: "12:00", hora_fin: "13:00" }),
    ConflictError,
  );
});

test("Regla 3: el PATCH no se compara consigo mismo", async () => {
  const repo = new FakeShowsRepository([bombaEstereo()]);
  const show = await new UpdateShow(repo).execute(1, { hora_fin: "23:00" });
  assert.equal(show.hora_fin, "23:00");
});

test("Regla 3: el PATCH sí choca con otro show del mismo escenario", async () => {
  const repo = new FakeShowsRepository([
    bombaEstereo(),
    { id: 2, artista_id: 2, escenario_id: 1, dia_id: 1, hora_inicio: "19:00", hora_fin: "20:00", state: "ACTIVE" },
  ]);
  await assert.rejects(new UpdateShow(repo).execute(2, { hora_fin: "21:30" }), ConflictError);
});

test("Validaciones: formato de hora, orden de horas y campos no editables → 400", async () => {
  const repo = new FakeShowsRepository([bombaEstereo()]);
  const create = new CreateShow(repo);
  const base = { artista_id: 7, escenario_id: 4, dia_id: 3 };
  await assert.rejects(create.execute({ ...base, hora_inicio: "9:00", hora_fin: "10:00" }), ValidationError);
  await assert.rejects(create.execute({ ...base, hora_inicio: "25:00", hora_fin: "26:00" }), ValidationError);
  await assert.rejects(create.execute({ ...base, hora_inicio: "20:00", hora_fin: "19:00" }), ValidationError);
  await assert.rejects(create.execute({ ...base, dia_id: "3", hora_inicio: "20:00", hora_fin: "21:00" }), ValidationError);
  await assert.rejects(new UpdateShow(repo).execute(1, { state: "REMOVED" }), ValidationError);
});

test("Orden de errores: 400 antes que 404 y 404 antes que 409", async () => {
  const repo = new FakeShowsRepository([bombaEstereo()]);
  const create = new CreateShow(repo);
  // artista inexistente + hora inválida → gana el 400
  await assert.rejects(create.execute({ artista_id: 999, escenario_id: 1, dia_id: 1, hora_inicio: "9:00", hora_fin: "10:00" }), ValidationError);
  // artista inexistente + cruce de horario → gana el 404
  await assert.rejects(create.execute({ artista_id: 999, escenario_id: 1, dia_id: 1, hora_inicio: "21:30", hora_fin: "22:00" }), NotFoundError);
});