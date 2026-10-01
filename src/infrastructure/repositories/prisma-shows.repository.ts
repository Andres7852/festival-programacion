import type { PrismaClient } from "../../../generated/prisma/client.js";
import type {
  CreateShowData,
  ShowFilters,
  ShowsRepository,
  UpdateShowData,
} from "../../domain/shows-repository.js";
import type { Show } from "../../domain/show.js";

// Solo las columnas del contrato (sin created_at / updated_at)
const SHOW_SELECT = {
  id: true,
  artista_id: true,
  escenario_id: true,
  dia_id: true,
  hora_inicio: true,
  hora_fin: true,
  state: true,
} as const;

// Las columnas id son INT de PostgreSQL: un número más grande no puede existir
const MAX_INT = 2147483647;
const outOfRange = (id: number) => id > MAX_INT;

export class PrismaShowsRepository implements ShowsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async artistExists(artistId: number) {
    if (outOfRange(artistId)) return false;
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

  async stageExists(stageId: number): Promise<boolean> {
    if (outOfRange(stageId)) return false;
    const stage = await this.prisma.escenarios.findUnique({ where: { id: stageId }, select: { id: true } });
    return stage !== null;
  }

  async dayExists(dayId: number): Promise<boolean> {
    if (outOfRange(dayId)) return false;
    const day = await this.prisma.dias.findUnique({ where: { id: dayId }, select: { id: true } });
    return day !== null;
  }

  async findById(id: number): Promise<Show | null> {
    if (outOfRange(id)) return null;
    return this.prisma.shows.findUnique({ where: { id }, select: SHOW_SELECT });
  }

  async findMany(filters: ShowFilters, skip: number, take: number): Promise<Show[]> {
    if (Object.values(filters).some(outOfRange)) return [];
    return this.prisma.shows.findMany({
      where: { ...filters, state: { not: "REMOVED" } },
      orderBy: { id: "asc" },
      skip,
      take,
      select: SHOW_SELECT,
    });
  }

  async count(filters: ShowFilters): Promise<number> {
    if (Object.values(filters).some(outOfRange)) return 0;
    return this.prisma.shows.count({ where: { ...filters, state: { not: "REMOVED" } } });
  }

  findActiveByStageAndDay(stageId: number, dayId: number): Promise<Show[]> {
    return this.prisma.shows.findMany({
      where: { escenario_id: stageId, dia_id: dayId, state: "ACTIVE" },
      select: SHOW_SELECT,
    });
  }

  findActiveByArtistAndDay(artistId: number, dayId: number): Promise<Show[]> {
    return this.prisma.shows.findMany({
      where: { artista_id: artistId, dia_id: dayId, state: "ACTIVE" },
      select: SHOW_SELECT,
    });
  }

  create(data: CreateShowData): Promise<Show> {
    return this.prisma.shows.create({ data, select: SHOW_SELECT });
  }

  update(id: number, data: UpdateShowData): Promise<Show> {
    return this.prisma.shows.update({
      where: { id },
      data: { ...data, updated_at: new Date() },
      select: SHOW_SELECT,
    });
  }

  async softDelete(id: number): Promise<void> {
    await this.prisma.shows.update({
      where: { id },
      data: { state: "REMOVED", updated_at: new Date() },
    });
  }
}