import { ValidationError } from "../../domain/errors/domain-errors.js";
import type { CreateShowData, UpdateShowData } from "../../domain/shows-repository.js";

export const EDITABLE_FIELDS = ["artista_id", "escenario_id", "dia_id", "hora_inicio", "hora_fin"] as const;
const ID_FIELDS = ["artista_id", "escenario_id", "dia_id"] as const;
const HOUR_FIELDS = ["hora_inicio", "hora_fin"] as const;

// HH:MM en 24 horas con cero inicial: 00:00 a 23:59
const HOUR_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

export function isValidHour(value: unknown): value is string {
  return typeof value === "string" && HOUR_REGEX.test(value);
}

/** Mismo criterio que usa GetShowById: el id de la ruta debe ser entero positivo. */
export function ensureValidId(id: number, name = "id"): void {
  if (!isPositiveInteger(id)) {
    throw new ValidationError(`${name} debe ser un entero positivo`);
  }
}

function ensureObject(body: unknown): Record<string, unknown> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ValidationError("El cuerpo de la petición debe ser un objeto JSON");
  }
  return body as Record<string, unknown>;
}

function validateIdField(field: string, value: unknown): number {
  if (value === undefined || value === null) {
    throw new ValidationError(`${field} es obligatorio`);
  }
  if (!isPositiveInteger(value)) {
    throw new ValidationError(`${field} debe ser un número entero positivo`);
  }
  return value;
}

function validateHourField(field: string, value: unknown): string {
  if (value === undefined || value === null) {
    throw new ValidationError(`${field} es obligatorio`);
  }
  if (!isValidHour(value)) {
    throw new ValidationError(`${field} debe tener formato HH:MM de 24 horas (por ejemplo 09:00)`);
  }
  return value;
}

export function ensureEndAfterStart(horaInicio: string, horaFin: string): void {
  // Con el formato HH:MM con cero inicial, comparar textos equivale a comparar horas.
  if (horaFin <= horaInicio) {
    throw new ValidationError("hora_fin debe ser posterior a hora_inicio");
  }
}

/** Valida el cuerpo del POST. Los campos que no son del contrato (id, state...) se ignoran. */
export function validateCreateShow(body: unknown): CreateShowData {
  const data = ensureObject(body);

  const show: CreateShowData = {
    artista_id: validateIdField("artista_id", data.artista_id),
    escenario_id: validateIdField("escenario_id", data.escenario_id),
    dia_id: validateIdField("dia_id", data.dia_id),
    hora_inicio: validateHourField("hora_inicio", data.hora_inicio),
    hora_fin: validateHourField("hora_fin", data.hora_fin),
  };

  ensureEndAfterStart(show.hora_inicio, show.hora_fin);
  return show;
}

/** Valida el cuerpo del PATCH: solo campos editables y con el tipo correcto. */
export function validateUpdateShow(body: unknown): UpdateShowData {
  const data = ensureObject(body);
  const editable: readonly string[] = EDITABLE_FIELDS;

  for (const key of Object.keys(data)) {
    if (!editable.includes(key)) {
      throw new ValidationError(`El campo ${key} no se puede editar`);
    }
  }

  const changes: UpdateShowData = {};
  for (const field of ID_FIELDS) {
    if (field in data) changes[field] = validateIdField(field, data[field]);
  }
  for (const field of HOUR_FIELDS) {
    if (field in data) changes[field] = validateHourField(field, data[field]);
  }
  return changes;
}