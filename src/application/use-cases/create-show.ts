import type { ShowsRepository } from "../../domain/shows-repository.js";
import type { Show } from "../../domain/show.js";
import { validateCreateShow } from "../validators/show-validators.js";
import { ensureBusinessRules, ensureReferencesExist } from "../rules/show-rules.js";

export class CreateShow {
  constructor(private readonly showsRepository: ShowsRepository) {}

  async execute(body: unknown): Promise<Show> {
    // 1. 400: campos obligatorios, tipos y formatos
    const data = validateCreateShow(body);
    // 2. 404: artista, escenario y día deben existir
    await ensureReferencesExist(this.showsRepository, data);
    // 3. 409: reglas de negocio
    await ensureBusinessRules(this.showsRepository, data);

    return this.showsRepository.create(data);
  }
}