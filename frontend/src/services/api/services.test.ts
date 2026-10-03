import { describe, expect, it, vi } from "vitest";
import { createApiServices } from "./index";
import { memoryTokenStore } from "./tokens";

const json = (status: number, body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status }));

function setup(body: unknown = {}) {
  const tokens = memoryTokenStore();
  tokens.set("jwt");
  const fetchFn = vi.fn((..._args: unknown[]) => json(200, body));
  const services = createApiServices({ baseUrl: "http://api", tokens, fetchFn });
  const calls = () =>
    fetchFn.mock.calls.map((c) => [(c[1] as RequestInit).method, c[0] as string, (c[1] as RequestInit).body]);
  return { services, fetchFn, calls };
}

describe("serviços api: sessões, posts, ranking, loja, mídia", () => {
  it("sessões mapeiam para as rotas do contrato", async () => {
    const { services, calls } = setup();
    await services.sessions.start({ mode: "challenge", subjectId: "random", focusMinutes: 25 });
    await services.sessions.completeCycle("s1");
    await services.sessions.updateNotes("s1", "notas");
    await services.sessions.finish("s1", "abandoned");
    await services.sessions.list();
    expect(calls()).toEqual([
      [
        "POST",
        "http://api/api/v1/sessions",
        JSON.stringify({ mode: "challenge", subjectId: "random", focusMinutes: 25 }),
      ],
      ["POST", "http://api/api/v1/sessions/s1/cycles", undefined],
      ["PATCH", "http://api/api/v1/sessions/s1", JSON.stringify({ notes: "notas" })],
      ["PATCH", "http://api/api/v1/sessions/s1", JSON.stringify({ status: "abandoned" })],
      ["GET", "http://api/api/v1/sessions", undefined],
    ]);
  });

  it("posts: filtros viram query, curtir/salvar usam POST e DELETE", async () => {
    const { services, calls } = setup({ items: [], nextCursor: null });
    await services.posts.list({ subjectId: 1, savedOnly: true, cursor: "2026-09-29T12:00:00.000Z|p1", limit: 10 });
    await services.posts.like("p1");
    await services.posts.unlike("p1");
    await services.posts.save("p1");
    await services.posts.unsave("p1");
    await services.posts.addComment("p1", { content: "oi", parentId: null });
    expect(calls().map(([m, u]) => `${m} ${u}`)).toEqual([
      "GET http://api/api/v1/posts?subjectId=1&savedOnly=true&cursor=2026-09-29T12%3A00%3A00.000Z%7Cp1&limit=10",
      "POST http://api/api/v1/posts/p1/like",
      "DELETE http://api/api/v1/posts/p1/like",
      "POST http://api/api/v1/posts/p1/save",
      "DELETE http://api/api/v1/posts/p1/save",
      "POST http://api/api/v1/posts/p1/comments",
    ]);
  });

  it("ranking e loja", async () => {
    const { services, calls } = setup([]);
    await services.rankings.bySubject(3);
    await services.shop.listAccessories();
    await services.shop.purchase("bow");
    expect(calls()).toEqual([
      ["GET", "http://api/api/v1/rankings/3", undefined],
      ["GET", "http://api/api/v1/shop/accessories", undefined],
      ["POST", "http://api/api/v1/shop/purchase", JSON.stringify({ accessoryId: "bow" })],
    ]);
  });

  it("mídia: upload multipart com nome e tipo; resolveUrl prefixa a API em caminhos relativos", async () => {
    const { services, fetchFn } = setup({ url: "/media/x.webm", durationSec: 3 });
    const res = await services.media.upload(new Blob(["a"], { type: "audio/webm;codecs=opus" }), "audio", 3.2);
    expect(res).toEqual({ url: "/media/x.webm", durationSec: 3 });
    const form = (fetchFn.mock.calls[0][1] as RequestInit).body as FormData;
    expect(form.get("kind")).toBe("audio");
    expect(form.get("durationSec")).toBe("3.2");
    expect((form.get("file") as File).name).toBe("gravacao.webm");
    expect(await services.media.resolveUrl("/media/x.webm")).toBe("http://api/media/x.webm");
    expect(await services.media.resolveUrl("https://res.cloudinary.com/a.webm")).toBe(
      "https://res.cloudinary.com/a.webm",
    );
  });

  it("mídia: envia o tipo sem parâmetros (o multer não lê codecs=vp9,opus e trocaria por text/plain)", async () => {
    const { services, fetchFn } = setup({ url: "/media/v.webm", durationSec: 5 });
    await services.media.upload(new Blob(["v"], { type: "video/webm;codecs=vp9,opus" }), "video", 5);
    const file = ((fetchFn.mock.calls[0][1] as RequestInit).body as FormData).get("file") as File;
    expect(file.type).toBe("video/webm");
    expect(file.name).toBe("gravacao.webm");
  });

  it("não expõe resetDemoData (só existe no mock)", () => {
    expect("resetDemoData" in setup().services).toBe(false);
  });
});
