import { describe, expect, it } from "vitest";
import { createAuthService } from "./auth";
import { createTestContext } from "./context";
import { createUserService } from "./users";
import { DEMO_USER } from "./seed";

async function loggedIn(now = Date.parse("2026-09-29T12:00:00.000Z")) {
  const ctx = createTestContext({ now: () => now });
  await createAuthService(ctx).login({ email: DEMO_USER.email, password: DEMO_USER.password });
  return { ctx, users: createUserService(ctx) };
}

describe("UserService (mock)", () => {
  it("exige login", async () => {
    await expect(createUserService(createTestContext()).getStats()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("atualiza nome", async () => {
    const { users } = await loggedIn();
    expect((await users.updateProfile({ name: "  Gui  " })).name).toBe("Gui");
  });

  it("trocar email ou senha exige a senha atual correta", async () => {
    const { users } = await loggedIn();
    await expect(users.updateProfile({ newPassword: "novasenha1" })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(users.updateProfile({ newPassword: "novasenha1", currentPassword: "errada" })).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
    });
    await expect(users.updateProfile({ email: "novo@x.com", currentPassword: "dotstudy123" })).resolves.toMatchObject({
      email: "novo@x.com",
    });
  });

  it("não troca para email já usado", async () => {
    const { users } = await loggedIn();
    await expect(
      users.updateProfile({ email: "ana@exemplo.dotstudy.app", currentPassword: "dotstudy123" }),
    ).rejects.toMatchObject({ code: "EMAIL_TAKEN" });
  });

  it("depois de trocar email e senha, o login antigo deixa de funcionar e o novo funciona", async () => {
    const { ctx, users } = await loggedIn();
    await users.updateProfile({ email: "novo@x.com", currentPassword: "dotstudy123", newPassword: "novasenha1" });
    const auth = createAuthService(ctx);
    await expect(auth.login({ email: DEMO_USER.email, password: DEMO_USER.password })).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
    });
    await expect(auth.login({ email: "novo@x.com", password: "novasenha1" })).resolves.toBeTruthy();
  });

  it("updateDot só aceita acessório desbloqueado (ou null)", async () => {
    const { users } = await loggedIn();
    await expect(users.updateDot({ activeAccessoryId: "crown" })).rejects.toMatchObject({ code: "NOT_OWNED" });
    expect(await users.updateDot({ activeAccessoryId: "hat", dotColor: "#A35BBF" })).toMatchObject({
      activeAccessoryId: "hat",
      dotColor: "#A35BBF",
    });
    expect((await users.updateDot({ activeAccessoryId: null })).activeAccessoryId).toBeNull();
  });

  it("getStats usa as sessões do seed", async () => {
    const { users } = await loggedIn();
    const stats = await users.getStats();
    expect(stats.completedCycles).toBe(12);
    expect(stats.totalMinutes).toBe(25 * 8 + 30 + 45 + 50 + 50);
    expect(stats.last7Days).toHaveLength(7);
    expect(stats.streakDays).toBeGreaterThanOrEqual(1);
  });
});
