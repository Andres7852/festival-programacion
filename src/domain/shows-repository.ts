import type { Show } from "./show.js";

export interface ShowFilters {
  dia_id?: number;
  escenario_id?: number;
  artista_id?: number;
}

export interface CreateShowData {
  artista_id: number;
  escenario_id: number;
  dia_id: number;
  hora_inicio: string;
  hora_fin: string;
}

export interface UpdateShowData {
  artista_id?: number;
  escenario_id?: number;
  dia_id?: number;
  hora_inicio?: string;
  hora_fin?: string;
}

export interface ShowsRepository {
  // Verificaciones de existencia foránea
  artistExists(artistId: number): Promise<boolean>;
  stageExists(stageId: number): Promise<boolean>;
  dayExists(dayId: number): Promise<boolean>;

  // Consultas de shows
  findById(id: number): Promise<Show | null>;
  findActiveByArtistId(artistId: number): Promise<Show[]>;
  findMany(filters: ShowFilters, skip: number, take: number): Promise<Show[]>;
  count(filters: ShowFilters): Promise<number>;

  // Consultas para las reglas de negocio (la decisión se toma en application/rules)
  findActiveByStageAndDay(stageId: number, dayId: number): Promise<Show[]>;
  findActiveByArtistAndDay(artistId: number, dayId: number): Promise<Show[]>;

  // Mutaciones
  create(data: CreateShowData): Promise<Show>;
  update(id: number, data: UpdateShowData): Promise<Show>;
  softDelete(id: number): Promise<void>;
}