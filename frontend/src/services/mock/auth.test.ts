import { describe, expect, it } from "vitest";
import { createAuthService } from "./auth";
import { createTestContext } from "./context";
import { DEMO_PASSWORD_HASH, DEMO_USER, hashPassword } from "./seed";

describe("AuthService (mock)", () => {
  it("hash da senha demo bate com o seed", async () => {
    expect(await hashPassword(DEMO_USER.email, DEMO_USER.password)).toBe(DEMO_PASSWORD_HASH);
  });

  it("login do usuário demo", async () => {
    const auth = createAuthService(createTestContext());
    const user = await auth.login({ email: DEMO_USER.email, password: DEMO_USER.password });
    expect(user.name).toBe("Guilherme");
    expect(await auth.me()).toEqual(user);
  });

  it("login ignora maiúsculas e espaços no email", async () => {
    const auth = createAuthService(createTestContext());
    await expect(auth.login({ email: "  DEMO@dotstudy.APP ", password: "dotstudy123" })).resolves.toMatchObject({
      name: "Guilherme",
    });
  });

  it("senha errada dá INVALID_CREDENTIALS", async () => {
    const auth = createAuthService(createTestContext());
    await expect(auth.login({ email: DEMO_USER.email, password: "x" })).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
    });
  });

  it("cadastro cria usuário com 250 moedas de boas-vindas e já loga", async () => {
    const ctx = createTestContext();
    const auth = createAuthService(ctx);
    const user = await auth.register({ name: "Nova Pessoa", email: " Nova@Teste.com ", password: "segredo12" });
    expect(user).toMatchObject({ name: "Nova Pessoa", email: "nova@teste.com", coins: 250, unlockedAccessoryIds: [] });
    expect(ctx.db.read().transactions).toEqual([
      expect.objectContaining({ userId: user.id, amount: 250, reason: "welcome" }),
    ]);
    expect((await auth.me())?.id).toBe(user.id);
  });

  it("cadastro com email existente (qualquer caixa) dá EMAIL_TAKEN", async () => {
    const auth = createAuthService(createTestContext());
    await expect(auth.register({ name: "X", email: "Demo@DotStudy.app", password: "segredo12" })).rejects.toMatchObject(
      { code: "EMAIL_TAKEN" },
    );
  });

  it("valida nome, email e senha", async () => {
    const auth = createAuthService(createTestContext());
    await expect(auth.register({ name: " ", email: "a@b.com", password: "segredo12" })).rejects.toMatchObject({
      code: "VALIDATION",
    });
    await expect(auth.register({ name: "A", email: "sem-arroba", password: "segredo12" })).rejects.toMatchObject({
      code: "VALIDATION",
    });
    await expect(auth.register({ name: "A", email: "a@b.com", password: "123" })).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });

  it("logout limpa a sessão", async () => {
    const auth = createAuthService(createTestContext());
    await auth.login({ email: DEMO_USER.email, password: DEMO_USER.password });
    await auth.logout();
    expect(await auth.me()).toBeNull();
  });
});
