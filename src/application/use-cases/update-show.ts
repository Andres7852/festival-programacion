import type { CreateShowData, ShowsRepository } from "../../domain/shows-repository.js";
import type { Show } from "../../domain/show.js";
import { NotFoundError, ValidationError } from "../../domain/errors/domain-errors.js";
import { ensureEndAfterStart, ensureValidId, validateUpdateShow } from "../validators/show-validators.js";
import { ensureBusinessRules, ensureReferencesExist } from "../rules/show-rules.js";

export class UpdateShow {
  constructor(private readonly showsRepository: ShowsRepository) {}

  async execute(id: number, body: unknown): Promise<Show> {
    // 1. 400: id válido, solo campos editables y con formato correcto
    ensureValidId(id);
    const changes = validateUpdateShow(body);

    // 2. 404: el show debe existir y no estar borrado
    const current = await this.showsRepository.findById(id);
    if (!current || current.state === "REMOVED") {
      throw new NotFoundError(`El show ${id} no existe`);
    }

    if (Object.keys(changes).length === 0) {
      throw new ValidationError("Debe enviar al menos un campo editable");
    }

    // 3. Se combinan los datos actuales con los nuevos y se vuelve a validar todo
    const merged: CreateShowData = {
      artista_id: changes.artista_id ?? current.artista_id,
      escenario_id: changes.escenario_id ?? current.escenario_id,
      dia_id: changes.dia_id ?? current.dia_id,
      hora_inicio: changes.hora_inicio ?? current.hora_inicio,
      hora_fin: changes.hora_fin ?? current.hora_fin,
    };

    ensureEndAfterStart(merged.hora_inicio, merged.hora_fin);
    await ensureReferencesExist(this.showsRepository, merged);
    // 409, sin compararse consigo mismo
    await ensureBusinessRules(this.showsRepository, merged, id);

    return this.showsRepository.update(id, changes);
  }
}