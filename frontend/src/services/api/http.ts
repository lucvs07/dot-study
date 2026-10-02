import { ServiceError, type ServiceErrorCode } from "@/services/contracts";
import type { TokenStore } from "./tokens";

export const UNAUTHORIZED_EVENT = "dotstudy:unauthorized";

const KNOWN_CODES: ReadonlySet<string> = new Set<ServiceErrorCode>([
  "INVALID_CREDENTIALS",
  "EMAIL_TAKEN",
  "VALIDATION",
  "UNAUTHORIZED",
  "NOT_FOUND",
  "INSUFFICIENT_COINS",
  "ALREADY_OWNED",
  "NOT_OWNED",
  "CYCLE_TOO_SOON",
  "SESSION_CLOSED",
  "MEDIA_TOO_LARGE",
  "MEDIA_TOO_LONG",
  "MEDIA_UNSUPPORTED",
  "NETWORK",
]);

type Method = "GET" | "POST" | "PATCH" | "DELETE";
type Query = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  body?: unknown;
  query?: Query;
  form?: FormData;
}

export interface HttpClient {
  baseUrl: string;
  tokens: TokenStore;
  request<T>(method: Method, path: string, opts?: RequestOptions): Promise<T>;
}

type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;

function queryString(query: Query | undefined): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null) params.set(k, String(v));
  const s = params.toString();
  return s ? `?${s}` : "";
}

export function createHttpClient({
  baseUrl,
  tokens,
  fetchFn = (input, init) => globalThis.fetch(input, init),
  onUnauthorized = () => window.dispatchEvent(new Event(UNAUTHORIZED_EVENT)),
}: {
  baseUrl: string;
  tokens: TokenStore;
  fetchFn?: FetchFn;
  onUnauthorized?: () => void;
}): HttpClient {
  const base = baseUrl.replace(/\/+$/, "");
  return {
    baseUrl: base,
    tokens,
    async request<T>(method: Method, path: string, opts: RequestOptions = {}) {
      const headers: Record<string, string> = { Accept: "application/json" };
      const token = tokens.get();
      if (token) headers["Authorization"] = `Bearer ${token}`;
      let body: BodyInit | undefined;
      if (opts.form) body = opts.form;
      else if (opts.body !== undefined) {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(opts.body);
      }
      let res: Response;
      try {
        res = await fetchFn(`${base}/api/v1${path}${queryString(opts.query)}`, { method, headers, body });
      } catch {
        throw new ServiceError(
          "NETWORK",
          "Não foi possível falar com o servidor. Verifique sua conexão e tente de novo.",
        );
      }
      const data: unknown = res.status === 204 ? null : await res.json().catch(() => null);
      if (!res.ok) {
        const err = (data as { error?: { code?: unknown; message?: unknown } } | null)?.error;
        // Só UNAUTHORIZED significa token inválido/expirado. Outros 401 (ex.: senha atual errada em
        // Ajustes, INVALID_CREDENTIALS) não podem derrubar a sessão.
        if (res.status === 401 && token && err?.code === "UNAUTHORIZED") {
          tokens.set(null);
          onUnauthorized();
        }
        if (err && typeof err.code === "string" && KNOWN_CODES.has(err.code)) {
          throw new ServiceError(
            err.code as ServiceErrorCode,
            typeof err.message === "string" ? err.message : "Algo deu errado.",
          );
        }
        throw new ServiceError("NETWORK", "O servidor respondeu com um erro inesperado. Tente de novo.");
      }
      return data as T;
    },
  };
}
