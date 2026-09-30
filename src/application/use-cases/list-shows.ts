import type { ShowsRepository, ShowFilters } from "../../domain/shows-repository.js";
import type { Show } from "../../domain/show.js";
import { ValidationError } from "../../domain/errors/domain-errors.js";

export interface ListShowsInput {
  page?: number;
  limit?: number;
  dia_id?: number;
  escenario_id?: number;
  artista_id?: number;
}

export interface ListShowsResult {
  pagination: {
    total: number;
    currentPage: number;
    limit: number;
    totalPages: number;
  };
  data: Show[];
}

export class ListShows {
  constructor(private readonly showsRepository: ShowsRepository) {}

  async execute(input: ListShowsInput): Promise<ListShowsResult> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 10;

    if (!Number.isInteger(page) || page < 1) {
      throw new ValidationError("page debe ser un entero positivo");
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      throw new ValidationError("limit debe ser un entero entre 1 y 50");
    }

    const filters: ShowFilters = {};
    if (input.dia_id !== undefined) filters.dia_id = input.dia_id;
    if (input.escenario_id !== undefined) filters.escenario_id = input.escenario_id;
    if (input.artista_id !== undefined) filters.artista_id = input.artista_id;

    const skip = (page - 1) * limit;
    const [total, data] = await Promise.all([
      this.showsRepository.count(filters),
      this.showsRepository.findMany(filters, skip, limit),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      pagination: {
        total,
        currentPage: page,
        limit,
        totalPages,
      },
      data,
    };
  }
}