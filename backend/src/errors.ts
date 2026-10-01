import type { ServiceErrorCode } from "@dot-study/shared/contracts";

export const STATUS_BY_CODE: Record<ServiceErrorCode, number> = {
  VALIDATION: 400,
  INVALID_CREDENTIALS: 401,
  UNAUTHORIZED: 401,
  NOT_OWNED: 403,
  NOT_FOUND: 404,
  EMAIL_TAKEN: 409,
  ALREADY_OWNED: 409,
  INSUFFICIENT_COINS: 409,
  CYCLE_TOO_SOON: 409,
  SESSION_CLOSED: 409,
  MEDIA_TOO_LARGE: 413,
  MEDIA_UNSUPPORTED: 415,
  MEDIA_TOO_LONG: 422,
  NETWORK: 503,
};

export class AppError extends Error {
  constructor(
    public readonly code: ServiceErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }

  get status(): number {
    return STATUS_BY_CODE[this.code];
  }
}

/** Violação de chave única do Prisma (P2002). */
export function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002";
}
