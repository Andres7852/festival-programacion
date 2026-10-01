import type { CreateShowData, ShowFilters, ShowsRepository, UpdateShowData } from "../src/domain/shows-repository.js";
import type { Show } from "../src/domain/show.js";

/** Repositorio en memoria: permite probar los casos de uso sin base de datos. */
export class FakeShowsRepository implements ShowsRepository {
  private nextId: number;

  constructor(
    public shows: Show[] = [],
    private readonly artistIds = [1, 2, 3, 7, 11],
    private readonly stageIds = [1, 2, 3, 4],
    private readonly dayIds = [1, 2, 3, 4],
  ) {
    this.nextId = Math.max(0, ...shows.map((s) => s.id)) + 1;
  }

  async artistExists(id: number) { return this.artistIds.includes(id); }
  async stageExists(id: number) { return this.stageIds.includes(id); }
  async dayExists(id: number) { return this.dayIds.includes(id); }

  async findById(id: number) { return this.shows.find((s) => s.id === id) ?? null; }

  private filter(filters: ShowFilters) {
    return this.shows.filter(
      (s) =>
        s.state !== "REMOVED" &&
        (filters.dia_id === undefined || s.dia_id === filters.dia_id) &&
        (filters.escenario_id === undefined || s.escenario_id === filters.escenario_id) &&
        (filters.artista_id === undefined || s.artista_id === filters.artista_id),
    );
  }

  async findMany(filters: ShowFilters, skip: number, take: number) {
    return this.filter(filters).sort((a, b) => a.id - b.id).slice(skip, skip + take);
  }
  async count(filters: ShowFilters) { return this.filter(filters).length; }

  async findActiveByArtistId(artistId: number) {
    return this.shows
      .filter((s) => s.artista_id === artistId && s.state === "ACTIVE")
      .sort((a, b) => a.dia_id - b.dia_id || a.hora_inicio.localeCompare(b.hora_inicio));
  }
  async findActiveByStageAndDay(stageId: number, dayId: number) {
    return this.shows.filter((s) => s.escenario_id === stageId && s.dia_id === dayId && s.state === "ACTIVE");
  }
  async findActiveByArtistAndDay(artistId: number, dayId: number) {
    return this.shows.filter((s) => s.artista_id === artistId && s.dia_id === dayId && s.state === "ACTIVE");
  }

  async create(data: CreateShowData) {
    const show: Show = { id: this.nextId++, ...data, state: "ACTIVE" };
    this.shows.push(show);
    return show;
  }
  async update(id: number, data: UpdateShowData) {
    const show = this.shows.find((s) => s.id === id)!;
    Object.assign(show, data);
    return show;
  }
  async softDelete(id: number) {
    const show = this.shows.find((s) => s.id === id)!;
    show.state = "REMOVED";
  }
}

export const bombaEstereo = (): Show => ({
  id: 1, artista_id: 1, escenario_id: 1, dia_id: 1, hora_inicio: "21:00", hora_fin: "22:30", state: "ACTIVE",
});