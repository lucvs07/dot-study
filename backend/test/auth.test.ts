import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { seedDemo } from "../src/seed/demo";
import { createTestContext, getTestPrisma, loginAs, resetDb } from "./helpers";

describe("auth", () => {
  beforeEach(async () => {
    await resetDb();
    await seedDemo(getTestPrisma(), new Date("2026-09-29T12:00:00.000Z"));
  });

  it("cadastro cria usuário com 250 moedas, registra a transação e devolve token", async () => {
    const { app, prisma } = createTestContext();
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ name: " Nova Pessoa ", email: " Nova@Teste.com ", password: "segredo12" });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      name: "Nova Pessoa",
      email: "nova@teste.com",
      coins: 250,
      unlockedAccessoryIds: [],
      activeAccessoryId: null,
    });
    expect(typeof res.body.token).toBe("string");
    expect(await prisma.coinTransaction.findMany({ where: { userId: res.body.user.id } })).toEqual([
      expect.objectContaining({ amount: 250, reason: "welcome" }),
    ]);
  });

  it("email existente em qualquer caixa dá 409 EMAIL_TAKEN", async () => {
    const { app } = createTestContext();
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ name: "Outra", email: "DEMO@dotstudy.app", password: "segredo12" });
    expect(res.status).toBe(409);
    expect(res.body.error).toEqual({ code: "EMAIL_TAKEN", message: "Já existe uma conta com esse email." });
  });

  it("valida nome, email e senha com mensagens em pt-BR", async () => {
    const { app } = createTestContext();
    const bad = async (body: object) => (await request(app).post("/api/v1/auth/register").send(body)).body.error;
    expect(await bad({ name: "A", email: "a@b.com", password: "segredo12" })).toEqual({
      code: "VALIDATION",
      message: "Informe seu nome (mínimo 2 letras).",
    });
    expect(await bad({ name: "Ana", email: "sem-arroba", password: "segredo12" })).toEqual({
      code: "VALIDATION",
      message: "Informe um email válido.",
    });
    expect(await bad({ name: "Ana", email: "a@b.com", password: "123" })).toEqual({
      code: "VALIDATION",
      message: "A senha precisa ter pelo menos 8 caracteres.",
    });
  });

  it("login do demo ignora caixa/espaços e /auth/me devolve o usuário", async () => {
    const { app } = createTestContext();
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "  DEMO@dotstudy.APP ", password: "dotstudy123" });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      id: "u_demo",
      name: "Guilherme",
      coins: 840,
      unlockedAccessoryIds: ["hat", "glasses"],
    });
    const me = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${res.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.email).toBe("demo@dotstudy.app");
    expect(me.body).not.toHaveProperty("passwordHash");
  });

  it("senha errada dá 401 INVALID_CREDENTIALS", async () => {
    const { app } = createTestContext();
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "demo@dotstudy.app", password: "errada123" });
    expect(res.status).toBe(401);
    expect(res.body.error).toEqual({ code: "INVALID_CREDENTIALS", message: "Email ou senha incorretos." });
  });

  it("sem token, token inválido ou expirado → 401 UNAUTHORIZED", async () => {
    const { app, deps } = createTestContext();
    expect((await request(app).get("/api/v1/auth/me")).body.error.code).toBe("UNAUTHORIZED");
    expect((await request(app).get("/api/v1/auth/me").set("Authorization", "Bearer lixo")).status).toBe(401);
    const expired = jwt.sign({}, deps.env.JWT_SECRET, { subject: "u_demo", expiresIn: -10 });
    const res = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toEqual({ code: "UNAUTHORIZED", message: "Sua sessão expirou. Faça login de novo." });
  });

  it("token de usuário apagado → 401", async () => {
    const { app, prisma } = createTestContext();
    const { token } = await loginAs(app);
    await prisma.user.delete({ where: { id: "u_demo" } });
    expect((await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`)).status).toBe(401);
  });

  it("rate limit em /auth devolve 429 em pt-BR", async () => {
    const { app } = createTestContext({ env: { AUTH_RATE_LIMIT: 2 } });
    for (let i = 0; i < 2; i++)
      await request(app).post("/api/v1/auth/login").send({ email: "x@y.com", password: "12345678" });
    const res = await request(app).post("/api/v1/auth/login").send({ email: "x@y.com", password: "12345678" });
    expect(res.status).toBe(429);
    expect(res.body.error).toEqual({
      code: "VALIDATION",
      message: "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
    });
  });
});
