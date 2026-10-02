import { describe, expect, it } from "vitest";
import { createAuthService } from "./auth";
import { createTestContext } from "./context";
import { createPostService } from "./posts";
import { createSessionService } from "./sessions";
import { DEMO_USER } from "./seed";

async function setup() {
  let now = Date.parse("2026-09-29T12:00:00.000Z");
  const ctx = createTestContext({ now: () => now });
  await createAuthService(ctx).login({ email: DEMO_USER.email, password: DEMO_USER.password });
  return {
    ctx,
    posts: createPostService(ctx),
    sessions: createSessionService(ctx),
    advance: (ms: number) => {
      now += ms;
    },
  };
}

describe("PostService (mock)", () => {
  it("lista o feed do mais novo para o mais antigo com contadores do seed", async () => {
    const { posts } = await setup();
    const page = await posts.list();
    expect(page.items.map((p) => p.id)).toEqual(["p1", "p2", "p3", "p4"]);
    expect(page.items[1]).toMatchObject({ likeCount: 89, likedByMe: true, savedByMe: true });
    expect(page.nextCursor).toBeNull();
  });

  it("filtra por assunto, tipo e salvos; pagina com cursor", async () => {
    const { posts } = await setup();
    expect((await posts.list({ subjectId: 5 })).items.map((p) => p.id)).toEqual(["p2"]);
    expect((await posts.list({ type: "audio" })).items.map((p) => p.id)).toEqual(["p3"]);
    expect((await posts.list({ savedOnly: true })).items.map((p) => p.id)).toEqual(["p2"]);
    const first = await posts.list({ limit: 2 });
    expect(first.items).toHaveLength(2);
    const second = await posts.list({ limit: 2, cursor: first.nextCursor });
    expect(second.items.map((p) => p.id)).toEqual(["p3", "p4"]);
  });

  it("publicar a partir da sessão concluída dá +30 uma única vez", async () => {
    const { posts, sessions, advance } = await setup();
    const s = await sessions.start({ mode: "challenge", subjectId: 1, focusMinutes: 25 });
    advance(25 * 60_000);
    await sessions.completeCycle(s.id);
    const first = await posts.create({ sessionId: s.id, type: "text", title: "Aprendi limites", content: "..." });
    expect(first.reward).toEqual({ coinsEarned: 30, balance: 880 });
    expect(first.post).toMatchObject({ subjectId: 1, likeCount: 0, author: { name: "Guilherme" } });
    advance(1000); // evita empate de createdAt na ordenação
    const second = await posts.create({ sessionId: s.id, type: "text", title: "De novo", content: "" });
    expect(second.reward).toBeNull();
    expect((await posts.list()).items[0].id).toBe(second.post.id);
  });

  it("publicar sem sessão ou de sessão sem ciclo concluído não dá recompensa", async () => {
    const { posts, sessions } = await setup();
    expect((await posts.create({ sessionId: null, type: "text", title: "Solto", content: "" })).reward).toBeNull();
    const s = await sessions.start({ mode: "challenge", subjectId: 1, focusMinutes: 25 });
    expect((await posts.create({ sessionId: s.id, type: "text", title: "Cedo", content: "" })).reward).toBeNull();
  });

  it("valida título e mídia", async () => {
    const { posts } = await setup();
    await expect(posts.create({ sessionId: null, type: "text", title: "ab", content: "" })).rejects.toMatchObject({
      code: "VALIDATION",
    });
    await expect(posts.create({ sessionId: null, type: "audio", title: "Áudio", content: "" })).rejects.toMatchObject({
      code: "VALIDATION",
    });
    await expect(
      posts.create({
        sessionId: null,
        type: "audio",
        title: "Áudio",
        content: "",
        mediaUrl: "idb://x",
        mediaDurationSec: 301,
      }),
    ).rejects.toMatchObject({ code: "MEDIA_TOO_LONG" });
  });

  it("curtir/descurtir e salvar/remover são idempotentes", async () => {
    const { posts } = await setup();
    expect((await posts.like("p1")).likeCount).toBe(48);
    expect((await posts.like("p1")).likeCount).toBe(48);
    expect((await posts.unlike("p1")).likeCount).toBe(47);
    expect((await posts.save("p1")).savedByMe).toBe(true);
    expect((await posts.unsave("p1")).savedByMe).toBe(false);
    await expect(posts.like("nao-existe")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("comentários com respostas aninhadas e contador", async () => {
    const { posts } = await setup();
    const c = await posts.addComment("p2", { content: "Ótimo post!" });
    await posts.addComment("p2", { content: "Concordo", parentId: c.id });
    const list = await posts.listComments("p2");
    const mine = list.find((x) => x.id === c.id)!;
    expect(mine.replies.map((r) => r.content)).toEqual(["Concordo"]);
    expect((await posts.get("p2")).commentCount).toBe(2);
    await expect(posts.addComment("p2", { content: "   " })).rejects.toMatchObject({ code: "VALIDATION" });
  });
});
