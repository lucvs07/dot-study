import { existsSync, readdirSync, unlinkSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { seedDemo } from "../src/seed/demo";
import { sniffContainer } from "../src/storage/sniff";
import { createTestContext, getTestPrisma, loginAs, resetDb } from "./helpers";

const WEBM = Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.alloc(2048, 1)]);
const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from("ftypisom"), Buffer.alloc(2048, 2)]);
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(512)]);
const tmpDir = path.join(os.tmpdir(), "dotstudy-uploads");
const tmpCount = () => (existsSync(tmpDir) ? readdirSync(tmpDir).length : 0);
// Esvazia o diretório de temporários do multer entre os testes, para que as
// asserções de "0 arquivos restantes" sejam significativas (e não apenas
// "diretório inexistente").
const emptyTmpDir = () => {
  if (!existsSync(tmpDir)) return;
  for (const name of readdirSync(tmpDir)) unlinkSync(path.join(tmpDir, name));
};

async function setup() {
  await resetDb();
  await seedDemo(getTestPrisma(), new Date("2026-09-29T12:00:00.000Z"));
  const ctx = createTestContext();
  const { token } = await loginAs(ctx.app);
  const upload = (buf: Buffer, opts: { kind: string; durationSec: string; mime: string; name?: string }) =>
    request(ctx.app)
      .post("/api/v1/uploads")
      .set("Authorization", `Bearer ${token}`)
      .field("kind", opts.kind)
      .field("durationSec", opts.durationSec)
      .attach("file", buf, { filename: opts.name ?? "gravacao.webm", contentType: opts.mime });
  const post = (b: object) => request(ctx.app).post("/api/v1/posts").set("Authorization", `Bearer ${token}`).send(b);
  return { ...ctx, token, upload, post };
}

describe("sniffContainer", () => {
  it("reconhece webm, mp4, ogg, mpeg e wav; rejeita png", () => {
    expect(sniffContainer(WEBM)).toBe("webm");
    expect(sniffContainer(MP4)).toBe("mp4");
    expect(sniffContainer(Buffer.from("OggS\0\0\0\0"))).toBe("ogg");
    expect(sniffContainer(Buffer.from("ID3\x04\0\0\0\0"))).toBe("mpeg");
    expect(sniffContainer(Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WAVE")]))).toBe("wav");
    expect(sniffContainer(PNG)).toBeNull();
  });
});

describe("uploads", () => {
  beforeEach(async () => {
    await resetDb();
    emptyTmpDir();
  });

  it("envia áudio, devolve /media/... servido pela API e publica o post com ele", async () => {
    const { upload, post, app } = await setup();
    const res = await upload(WEBM, { kind: "audio", durationSec: "12.4", mime: "audio/webm;codecs=opus" });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ url: expect.stringMatching(/^\/media\/.+\.webm$/), durationSec: 12 });
    expect((await request(app).get(res.body.url)).status).toBe(200);
    const created = await post({
      sessionId: null,
      type: "audio",
      title: "Meu áudio",
      content: "",
      mediaUrl: res.body.url,
      mediaDurationSec: 999,
    });
    expect(created.status).toBe(201);
    expect(created.body.post).toMatchObject({ type: "audio", mediaUrl: res.body.url, mediaDurationSec: 12 }); // duração vem do upload, não do cliente
  });

  it("rejeita MIME falso pela assinatura do arquivo", async () => {
    const { upload } = await setup();
    const res = await upload(PNG, { kind: "video", durationSec: "5", mime: "video/webm", name: "falso.webm" });
    expect(res.status).toBe(415);
    expect(res.body.error).toEqual({ code: "MEDIA_UNSUPPORTED", message: "Formato de arquivo não suportado." });
    // O diretório precisa existir (multer já gravou o temporário ao processar o upload);
    // só assim "0 arquivos" prova que o serviço apagou o temporário, e não que a pasta nunca existiu.
    expect(existsSync(tmpDir)).toBe(true);
    expect(tmpCount()).toBe(0);
  });

  it("rejeita áudio > 10 MB, duração acima do limite e kind inválido", async () => {
    const { upload } = await setup();
    const big = Buffer.concat([WEBM, Buffer.alloc(10 * 1024 * 1024)]);
    const r1 = await upload(big, { kind: "audio", durationSec: "10", mime: "audio/webm" });
    expect(r1.status).toBe(413);
    expect(r1.body.error.code).toBe("MEDIA_TOO_LARGE");
    const r2 = await upload(MP4, { kind: "video", durationSec: "121", mime: "video/mp4", name: "v.mp4" });
    expect(r2.body.error).toEqual({ code: "MEDIA_TOO_LONG", message: "A gravação passou de 2 minutos." });
    expect((await upload(WEBM, { kind: "imagem", durationSec: "1", mime: "audio/webm" })).body.error.code).toBe(
      "VALIDATION",
    );
    expect(existsSync(tmpDir)).toBe(true);
    expect(tmpCount()).toBe(0);
  });

  it("arquivo acima de 50 MB é cortado pelo multer com MEDIA_TOO_LARGE", async () => {
    const { upload } = await setup();
    const huge = Buffer.concat([MP4, Buffer.alloc(50 * 1024 * 1024)]);
    const res = await upload(huge, { kind: "video", durationSec: "10", mime: "video/mp4", name: "v.mp4" });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe("MEDIA_TOO_LARGE");
    // O próprio multer apaga o arquivo parcial quando estoura LIMIT_FILE_SIZE.
    expect(existsSync(tmpDir)).toBe(true);
    expect(tmpCount()).toBe(0);
  });

  it("post de mídia só aceita upload do próprio usuário, do mesmo tipo e não reutilizado", async () => {
    const { upload, post, app } = await setup();
    const audio = (await upload(WEBM, { kind: "audio", durationSec: "3", mime: "audio/webm" })).body;
    expect(
      (await post({ sessionId: null, type: "video", title: "Tipo errado", content: "", mediaUrl: audio.url })).body
        .error.code,
    ).toBe("VALIDATION");
    expect(
      (
        await post({
          sessionId: null,
          type: "audio",
          title: "Inventada",
          content: "",
          mediaUrl: "/media/nao-existe.webm",
        })
      ).body.error.code,
    ).toBe("VALIDATION");
    expect(
      (await post({ sessionId: null, type: "audio", title: "Primeiro", content: "", mediaUrl: audio.url })).status,
    ).toBe(201);
    expect(
      (await post({ sessionId: null, type: "audio", title: "Reuso", content: "", mediaUrl: audio.url })).body.error
        .code,
    ).toBe("VALIDATION");
    const other = await request(app)
      .post("/api/v1/auth/register")
      .send({ name: "Outra", email: "o@x.com", password: "segredo12" });
    const audio2 = (await upload(WEBM, { kind: "audio", durationSec: "3", mime: "audio/webm" })).body;
    const steal = await request(app)
      .post("/api/v1/posts")
      .set("Authorization", `Bearer ${other.body.token}`)
      .send({ sessionId: null, type: "audio", title: "Roubo", content: "", mediaUrl: audio2.url });
    expect(steal.body.error.code).toBe("VALIDATION");
  });

  it("duas publicações simultâneas com a mesma mídia: uma vence, a outra vira VALIDATION (nunca 500)", async () => {
    const { upload, post } = await setup();
    const audio = (await upload(WEBM, { kind: "audio", durationSec: "3", mime: "audio/webm" })).body;
    // O resolver e o @@unique de Post.mediaId disputam a mesma corrida: tanto faz qual dos dois barra
    // a segunda publicação, desde que ela vire um VALIDATION em pt-BR e nunca um 500.
    const [a, b] = await Promise.all([
      post({ sessionId: null, type: "audio", title: "Primeira", content: "", mediaUrl: audio.url }),
      post({ sessionId: null, type: "audio", title: "Segunda", content: "", mediaUrl: audio.url }),
    ]);
    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([201, 400]);
    const loser = a.status === 201 ? b : a;
    expect(loser.body.error.code).toBe("VALIDATION");
  });

  it("exige login", async () => {
    const { app } = await setup();
    expect((await request(app).post("/api/v1/uploads")).status).toBe(401);
  });
});
