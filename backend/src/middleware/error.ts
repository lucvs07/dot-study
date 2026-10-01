import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError } from "../errors";

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Rota não encontrada." } });
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  if ((err as { type?: string })?.type === "entity.parse.failed") {
    res.status(400).json({ error: { code: "VALIDATION", message: "JSON inválido." } });
    return;
  }
  if ((err as { type?: string })?.type === "entity.too.large") {
    res.status(413).json({ error: { code: "VALIDATION", message: "Requisição grande demais." } });
    return;
  }
  req.log?.error({ err }, "erro inesperado");
  res
    .status(500)
    .json({ error: { code: "NETWORK", message: "Erro interno do servidor. Tente de novo em instantes." } });
};
