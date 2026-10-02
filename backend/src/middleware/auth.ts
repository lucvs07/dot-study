import type { Request, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import type { Env } from "../config/env";
import { AppError } from "../errors";

declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
  }
}

export function signToken(env: Env, userId: string): string {
  return jwt.sign({}, env.JWT_SECRET, {
    subject: userId,
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    algorithm: "HS256",
  });
}

export function requireAuth(env: Env): RequestHandler {
  return (req, _res, next) => {
    const header = req.headers.authorization ?? "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) throw new AppError("UNAUTHORIZED", "Faça login para continuar.");
    try {
      const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
      if (typeof payload === "string" || !payload.sub) throw new Error("sem sub");
      req.userId = payload.sub;
      next();
    } catch {
      throw new AppError("UNAUTHORIZED", "Sua sessão expirou. Faça login de novo.");
    }
  };
}

export function userIdOf(req: Request): string {
  if (!req.userId) throw new AppError("UNAUTHORIZED", "Faça login para continuar.");
  return req.userId;
}
