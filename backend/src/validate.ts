import type { z } from "zod";
import { AppError } from "./errors";

export function parse<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) throw new AppError("VALIDATION", result.error.issues[0]?.message ?? "Dados inválidos.");
  return result.data;
}
