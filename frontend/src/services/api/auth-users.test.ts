import { describe, expect, it, vi } from "vitest";
import { createApiAuthService } from "./auth";
import { createHttpClient } from "./http";
import { memoryTokenStore } from "./tokens";
import { createApiSubjectService } from "./subjects";
import { createApiUserService } from "./users";

const user = {
  id: "u1",
  name: "Ana",
  email: "a@b.com",
  coins: 250,
  dotColor: "#22CFD5",
  activeAccessoryId: null,
  unlockedAccessoryIds: [],
  createdAt: "2026-09-29T12:00:00.000Z",
};
const json = (status: number, body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status }));

function setup(handler: (url: string, init?: RequestInit) => Promise<Response>) {
  const tokens = memoryTokenStore();
  const fetchFn = vi.fn(handler);
  const http = createHttpClient({ baseUrl: "http://api", tokens, fetchFn, onUnauthorized: () => {} });
  return {
    tokens,
    fetchFn,
    auth: createApiAuthService(http),
    users: createApiUserService(http),
    subjects: createApiSubjectService(http),
  };
}

describe("serviços api: auth/usuário/assuntos", () => {
  it("login guarda o token e devolve o usuário; logout apaga", async () => {
    const { auth, tokens, fetchFn } = setup(() => json(200, { token: "jwt", user }));
    expect(await auth.login({ email: "a@b.com", password: "segredo12" })).toEqual(user);
    expect(tokens.get()).toBe("jwt");
    expect(fetchFn.mock.calls[0][0]).toBe("http://api/api/v1/auth/login");
    await auth.logout();
    expect(tokens.get()).toBeNull();
  });

  it("me(): sem token não chama a API; token expirado devolve null", async () => {
    const { auth, tokens, fetchFn } = setup(() =>
      json(401, { error: { code: "UNAUTHORIZED", message: "Sua sessão expirou. Faça login de novo." } }),
    );
    expect(await auth.me()).toBeNull();
    expect(fetchFn).not.toHaveBeenCalled();
    tokens.set("velho");
    expect(await auth.me()).toBeNull();
    expect(tokens.get()).toBeNull();
  });

  it("getStats envia o fuso do navegador", async () => {
    const { users, fetchFn, tokens } = setup(() =>
      json(200, { streakDays: 1, totalMinutes: 25, completedCycles: 1, last7Days: [] }),
    );
    tokens.set("jwt");
    await users.getStats();
    expect(fetchFn.mock.calls[0][0]).toBe(
      `http://api/api/v1/users/me/stats?tzOffset=${new Date().getTimezoneOffset()}`,
    );
  });

  it("updateDot e updateProfile usam PATCH", async () => {
    const { users, fetchFn, tokens } = setup(() => json(200, user));
    tokens.set("jwt");
    await users.updateDot({ activeAccessoryId: null });
    await users.updateProfile({ name: "Bia" });
    expect(fetchFn.mock.calls.map((c) => [(c[1] as RequestInit).method, c[0]])).toEqual([
      ["PATCH", "http://api/api/v1/users/me/dot"],
      ["PATCH", "http://api/api/v1/users/me"],
    ]);
  });

  it("assuntos e tema aleatório", async () => {
    const { subjects, fetchFn, tokens } = setup((url) =>
      json(200, url.endsWith("/random-theme") ? { id: 201, title: "Mecânica Clássica", subjectId: 2 } : []),
    );
    tokens.set("jwt");
    await subjects.list();
    expect((await subjects.randomTheme(2)).title).toBe("Mecânica Clássica");
    expect(fetchFn.mock.calls[1][0]).toBe("http://api/api/v1/subjects/2/random-theme");
  });
});
