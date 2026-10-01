import { ConflictError, NotFoundError } from "../../domain/errors/domain-errors.js";
import type { CreateShowData, ShowsRepository } from "../../domain/shows-repository.js";

/**
 * Dos franjas se cruzan si cada una empieza antes de que la otra termine.
 * Ejemplo: 21:00–22:30 y 22:00–23:00 se cruzan ("21:00" < "23:00" y "22:00" < "22:30").
 * 21:00–22:30 y 22:30–23:00 NO se cruzan, porque "22:30" < "22:30" es falso.
 */
export function schedulesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  return startA < endB && startB < endA;
}

/** 404 si el artista, el escenario o el día referenciados no existen. */
export async function ensureReferencesExist(repository: ShowsRepository, show: CreateShowData): Promise<void> {
  const [artistExists, stageExists, dayExists] = await Promise.all([
    repository.artistExists(show.artista_id),
    repository.stageExists(show.escenario_id),
    repository.dayExists(show.dia_id),
  ]);

  if (!artistExists) throw new NotFoundError(`El artista ${show.artista_id} no existe`);
  if (!stageExists) throw new NotFoundError(`El escenario ${show.escenario_id} no existe`);
  if (!dayExists) throw new NotFoundError(`El día ${show.dia_id} no existe`);
}

/**
 * Reglas de negocio del módulo (409).
 * excludeShowId se usa en el PATCH para que el show no se compare consigo mismo.
 */
export async function ensureBusinessRules(
  repository: ShowsRepository,
  show: CreateShowData,
  excludeShowId?: number,
): Promise<void> {
  // Regla 1: un escenario no puede tener dos shows cruzados el mismo día
  const stageShows = await repository.findActiveByStageAndDay(show.escenario_id, show.dia_id);
  const overlapping = stageShows.find(
    (other) =>
      other.id !== excludeShowId &&
      schedulesOverlap(show.hora_inicio, show.hora_fin, other.hora_inicio, other.hora_fin),
  );
  if (overlapping) {
    throw new ConflictError(
      `El escenario ${show.escenario_id} ya tiene el show ${overlapping.id} de ${overlapping.hora_inicio} a ${overlapping.hora_fin} ese día`,
    );
  }

  // Regla 2: un artista no toca dos veces el mismo día
  const artistShows = await repository.findActiveByArtistAndDay(show.artista_id, show.dia_id);
  const sameDay = artistShows.find((other) => other.id !== excludeShowId);
  if (sameDay) {
    throw new ConflictError(`El artista ${show.artista_id} ya toca ese día (show ${sameDay.id})`);
  }
}