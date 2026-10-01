import request from "supertest";
import { describe, expect, it } from "vitest";
import { loadEnv } from "../src/config/env";
import { AppError, STATUS_BY_CODE } from "../src/errors";
import { createTestContext } from "./helpers";

describe("API base", () => {
  it("GET /api/v1/health responde ok com o banco no ar", async () => {
    const { app } = createTestContext();
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("rota inexistente devolve erro no formato do contrato", async () => {
    const { app } = createTestContext();
    const res = await request(app).get("/api/v1/nao-existe");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: "NOT_FOUND", message: "Rota não encontrada." } });
  });

  it("JSON inválido vira VALIDATION", async () => {
    const { app } = createTestContext();
    const res = await request(app).post("/api/v1/health").set("Content-Type", "application/json").send("{x");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION");
  });

  it("CORS libera só a origem configurada", async () => {
    const { app } = createTestContext();
    const ok = await request(app).get("/api/v1/health").set("Origin", "http://127.0.0.1:5173");
    expect(ok.headers["access-control-allow-origin"]).toBe("http://127.0.0.1:5173");
    const other = await request(app).get("/api/v1/health").set("Origin", "https://malicioso.example");
    expect(other.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("AppError mapeia status por código", () => {
    expect(new AppError("EMAIL_TAKEN", "x").status).toBe(409);
    expect(STATUS_BY_CODE.MEDIA_TOO_LARGE).toBe(413);
  });

  it("config inválida explica o problema em pt-BR", () => {
    expect(() => loadEnv({ DATABASE_URL: "x", JWT_SECRET: "curto" })).toThrow(
      /JWT_SECRET precisa ter pelo menos 32 caracteres/,
    );
  });
});
