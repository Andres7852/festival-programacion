import type { NextFunction, Request, Response } from "express";
import { ConflictError, NotFoundError, ValidationError } from "../../domain/errors/domain-errors.js";

/** Ruta inexistente → 404 con { error } */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

/** Convierte cualquier error en { "error": "mensaje" }, nunca con stack trace. */
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ValidationError) {
    res.status(400).json({ error: error.message });
    return;
  }
  if (error instanceof NotFoundError) {
    res.status(404).json({ error: error.message });
    return;
  }
  if (error instanceof ConflictError) {
    res.status(409).json({ error: error.message });
    return;
  }
  // JSON mal formado en el cuerpo (lo lanza express.json())
  if (typeof error === "object" && error !== null && (error as { type?: string }).type === "entity.parse.failed") {
    res.status(400).json({ error: "El cuerpo de la petición no es un JSON válido" });
    return;
  }

  console.error(error);
  res.status(500).json({ error: "Error interno del servidor" });
}