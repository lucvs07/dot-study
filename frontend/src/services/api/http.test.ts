import { describe, expect, it, vi } from "vitest";
import { ServiceError } from "@/services/contracts";
import { createHttpClient } from "./http";
import { memoryTokenStore } from "./tokens";

const json = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));

describe("createHttpClient", () => {
  it("monta URL com /api/v1, query, JSON e Authorization", async () => {
    const tokens = memoryTokenStore();
    tokens.set("tok");
    const fetchFn = vi.fn((..._args: unknown[]) => json(200, { ok: true }));
    const http = createHttpClient({ baseUrl: "http://api.test", tokens, fetchFn });
    await http.request("POST", "/posts", { body: { a: 1 }, query: { limit: 2, savedOnly: true, cursor: null } });
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://api.test/api/v1/posts?limit=2&savedOnly=true");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ a: 1 }));
    expect((init.headers as Record<string, string>)["Authorization"]).toBe("Bearer tok");
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
  });

  it("baseUrl vazio usa caminho relativo (mesma origem, Docker)", async () => {
    const fetchFn = vi.fn((..._args: unknown[]) => json(200, {}));
    await createHttpClient({ baseUrl: "", tokens: memoryTokenStore(), fetchFn }).request("GET", "/health");
    expect(fetchFn.mock.calls[0][0]).toBe("/api/v1/health");
  });

  it("erro da API vira ServiceError com o mesmo code e mensagem", async () => {
    const http = createHttpClient({
      baseUrl: "",
      tokens: memoryTokenStore(),
      fetchFn: () => json(409, { error: { code: "EMAIL_TAKEN", message: "Já existe uma conta com esse email." } }),
    });
    await expect(http.request("POST", "/auth/register")).rejects.toEqual(
      new ServiceError("EMAIL_TAKEN", "Já existe uma conta com esse email."),
    );
  });

  it("falha de rede ou resposta estranha vira NETWORK em pt-BR", async () => {
    const down = createHttpClient({
      baseUrl: "",
      tokens: memoryTokenStore(),
      fetchFn: () => Promise.reject(new TypeError("Failed to fetch")),
    });
    await expect(down.request("GET", "/health")).rejects.toMatchObject({
      code: "NETWORK",
      message: "Não foi possível falar com o servidor. Verifique sua conexão e tente de novo.",
    });
    const html = createHttpClient({
      baseUrl: "",
      tokens: memoryTokenStore(),
      fetchFn: () => Promise.resolve(new Response("<html>502</html>", { status: 502 })),
    });
    await expect(html.request("GET", "/health")).rejects.toMatchObject({
      code: "NETWORK",
      message: "O servidor respondeu com um erro inesperado. Tente de novo.",
    });
  });

  it("401 com token salvo apaga o token e avisa (sessão expirada)", async () => {
    const tokens = memoryTokenStore();
    tokens.set("velho");
    const onUnauthorized = vi.fn();
    const http = createHttpClient({
      baseUrl: "",
      tokens,
      onUnauthorized,
      fetchFn: () => json(401, { error: { code: "UNAUTHORIZED", message: "Sua sessão expirou. Faça login de novo." } }),
    });
    await expect(http.request("GET", "/auth/me")).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(tokens.get()).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("401 de login errado (sem token) não dispara o aviso", async () => {
    const onUnauthorized = vi.fn();
    const http = createHttpClient({
      baseUrl: "",
      tokens: memoryTokenStore(),
      onUnauthorized,
      fetchFn: () => json(401, { error: { code: "INVALID_CREDENTIALS", message: "Email ou senha incorretos." } }),
    });
    await expect(http.request("POST", "/auth/login")).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("multipart não define Content-Type (o navegador põe o boundary)", async () => {
    const fetchFn = vi.fn((..._args: unknown[]) => json(201, {}));
    const form = new FormData();
    form.append("kind", "audio");
    await createHttpClient({ baseUrl: "", tokens: memoryTokenStore(), fetchFn }).request("POST", "/uploads", { form });
    const init = fetchFn.mock.calls[0][1] as RequestInit;
    expect(init.body).toBe(form);
    expect((init.headers as Record<string, string>)["Content-Type"]).toBeUndefined();
  });
});
