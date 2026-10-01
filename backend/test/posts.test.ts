import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { seedDemo } from "../src/seed/demo";
import { createTestContext, getTestPrisma, loginAs, resetDb } from "./helpers";

async function setup() {
  await resetDb();
  await seedDemo(getTestPrisma(), new Date("2026-09-29T12:00:00.000Z"));
  const ctx = createTestContext();
  const { token } = await loginAs(ctx.app);
  const auth = (r: request.Test) => r.set("Authorization", `Bearer ${token}`);
  const api = {
    get: (p: string) => auth(request(ctx.app).get(`/api/v1${p}`)),
    post: (p: string, b?: object) => auth(request(ctx.app).post(`/api/v1${p}`)).send(b),
    del: (p: string) => auth(request(ctx.app).delete(`/api/v1${p}`)),
  };
  return { ...ctx, api };
}

describe("posts", () => {
  beforeEach(resetDb);

  it("feed do mais novo para o mais antigo com contadores do seed", async () => {
    const { api } = await setup();
    const page = (await api.get("/posts")).body;
    expect(page.items.map((p: { id: string }) => p.id)).toEqual(["p1", "p2", "p3", "p4"]);
    expect(page.items[1]).toMatchObject({
      likeCount: 89,
      likedByMe: true,
      savedByMe: true,
      author: { name: "Pedro Lima" },
    });
    expect(page.items[0]).toMatchObject({ commentCount: 4, subjectId: 1, type: "text" });
    expect(page.nextCursor).toBeNull();
  });

  it("filtros e paginação por cursor", async () => {
    const { api } = await setup();
    expect((await api.get("/posts?subjectId=5")).body.items.map((p: { id: string }) => p.id)).toEqual(["p2"]);
    expect((await api.get("/posts?type=audio")).body.items.map((p: { id: string }) => p.id)).toEqual(["p3"]);
    expect((await api.get("/posts?savedOnly=true")).body.items.map((p: { id: string }) => p.id)).toEqual(["p2"]);
    const first = (await api.get("/posts?limit=2")).body;
    expect(first.items).toHaveLength(2);
    const second = (await api.get(`/posts?limit=2&cursor=${encodeURIComponent(first.nextCursor)}`)).body;
    expect(second.items.map((p: { id: string }) => p.id)).toEqual(["p3", "p4"]);
    expect(second.nextCursor).toBeNull();
    expect((await api.get("/posts?limit=0")).body.error.code).toBe("VALIDATION");
  });

  it("publicar da sessão concluída dá +30 uma vez; sem ciclo ou sem sessão não dá", async () => {
    const { api, clock } = await setup();
    const s = (await api.post("/sessions", { mode: "challenge", subjectId: 1, focusMinutes: 25 })).body;
    const early = (await api.post("/posts", { sessionId: s.id, type: "text", title: "Cedo demais", content: "" })).body;
    expect(early.reward).toBeNull();
    clock.advance(25 * 60_000);
    await api.post(`/sessions/${s.id}/cycles`);
    clock.advance(1000);
    const first = await api.post("/posts", {
      sessionId: s.id,
      type: "text",
      title: "Aprendi limites",
      content: "texto",
    });
    expect(first.status).toBe(201);
    // "Cedo demais" não levou a recompensa porque a sessão não tinha ciclo; esta leva
    expect(first.body.reward).toEqual({ coinsEarned: 30, balance: 880 });
    expect(first.body.post).toMatchObject({ subjectId: 1, likeCount: 0, author: { id: "u_demo" } });
    clock.advance(1000);
    expect(
      (await api.post("/posts", { sessionId: s.id, type: "text", title: "De novo", content: "" })).body.reward,
    ).toBeNull();
    expect(
      (await api.post("/posts", { sessionId: null, type: "text", title: "Solto", content: "" })).body.reward,
    ).toBeNull();
    expect((await api.get("/posts")).body.items[0].title).toBe("Solto");
  });

  it("duas publicações simultâneas da mesma sessão recompensam uma vez", async () => {
    const { api, clock, prisma } = await setup();
    const s = (await api.post("/sessions", { mode: "challenge", subjectId: 1, focusMinutes: 25 })).body;
    clock.advance(25 * 60_000);
    await api.post(`/sessions/${s.id}/cycles`);
    const [a, b] = await Promise.all([
      api.post("/posts", { sessionId: s.id, type: "text", title: "Post A", content: "" }),
      api.post("/posts", { sessionId: s.id, type: "text", title: "Post B", content: "" }),
    ]);
    expect([a.body.reward, b.body.reward].filter(Boolean)).toHaveLength(1);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: "u_demo" } })).coins).toBe(880);
  });

  it("filtro e cursor inválidos dão 400 VALIDATION em pt-BR (nunca 500 nem inglês)", async () => {
    const { api } = await setup();
    const bad = await api.get("/posts?subjectId=abc");
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe("VALIDATION");
    expect(bad.body.error.message).toBe('O campo "subjectId" tem um valor inválido.');
    const cursor = await api.get(`/posts?cursor=${encodeURIComponent("2026-13-45T99:99:99.000Z|p1")}`);
    expect(cursor.status).toBe(400);
    expect(cursor.body.error).toEqual({ code: "VALIDATION", message: "Cursor inválido." });
  });

  it("valida título, conteúdo e sessão de outro usuário", async () => {
    const { api } = await setup();
    expect((await api.post("/posts", { sessionId: null, type: "text", title: "ab", content: "" })).body.error).toEqual({
      code: "VALIDATION",
      message: "O título precisa ter entre 3 e 120 caracteres.",
    });
    expect(
      (await api.post("/posts", { sessionId: "seed_u_ana_1", type: "text", title: "Roubando", content: "" })).body.error
        .code,
    ).toBe("NOT_FOUND");
    expect(
      (await api.post("/posts", { sessionId: null, type: "audio", title: "Áudio", content: "" })).body.error,
    ).toEqual({ code: "VALIDATION", message: "Grave ou envie a mídia antes de publicar." });
  });

  it("curtir/salvar idempotentes; post inexistente 404", async () => {
    const { api } = await setup();
    expect((await api.post("/posts/p1/like")).body.likeCount).toBe(48);
    expect((await api.post("/posts/p1/like")).body.likeCount).toBe(48);
    expect((await api.del("/posts/p1/like")).body.likeCount).toBe(47);
    expect((await api.post("/posts/p1/save")).body.savedByMe).toBe(true);
    expect((await api.del("/posts/p1/save")).body.savedByMe).toBe(false);
    expect((await api.post("/posts/nada/like")).status).toBe(404);
  });

  it("comentários em árvore e validação", async () => {
    const { api } = await setup();
    const tree = (await api.get("/posts/p1/comments")).body;
    expect(tree).toHaveLength(2);
    expect(tree.find((c: { id: string }) => c.id === "c1").replies.map((r: { id: string }) => r.id)).toEqual(["c11"]);
    const c = (await api.post("/posts/p2/comments", { content: "Ótimo post!" })).body;
    await api.post("/posts/p2/comments", { content: "Concordo", parentId: c.id });
    const list = (await api.get("/posts/p2/comments")).body;
    expect(list[0].replies[0].content).toBe("Concordo");
    expect((await api.get("/posts/p2")).body.commentCount).toBe(2);
    expect((await api.post("/posts/p2/comments", { content: "   " })).body.error.code).toBe("VALIDATION");
    expect((await api.post("/posts/p2/comments", { content: "x", parentId: "c1" })).body.error.code).toBe("NOT_FOUND");
  });
});
