import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createLocalStorage } from "../src/storage/local";

describe("storage local", () => {
  it("move o arquivo temporário para a pasta de uploads e devolve /media/<nome>", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "dotstudy-up-"));
    const tmp = path.join(await mkdtemp(path.join(os.tmpdir(), "dotstudy-tmp-")), "f");
    await writeFile(tmp, "conteudo");
    const { url } = await createLocalStorage(dir).save({ tmpPath: tmp, ext: "webm", mimeType: "audio/webm" });
    expect(url).toMatch(/^\/media\/[0-9a-f-]{36}\.webm$/);
    expect(await readFile(path.join(dir, path.basename(url)), "utf8")).toBe("conteudo");
    expect(existsSync(tmp)).toBe(false);
  });
});

vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload: vi.fn(async () => ({ secure_url: "https://res.cloudinary.com/demo/video/upload/v1/dotstudy/abc.webm" })),
    },
  },
}));

describe("storage cloudinary", () => {
  it("envia como resource_type video na pasta dotstudy, apaga o temporário e devolve a URL segura", async () => {
    const { v2 } = await import("cloudinary");
    const { createCloudinaryStorage } = await import("../src/storage/cloudinary");
    const tmp = path.join(await mkdtemp(path.join(os.tmpdir(), "dotstudy-tmp-")), "f");
    await writeFile(tmp, "x");
    const { url } = await createCloudinaryStorage().save({ tmpPath: tmp, ext: "webm", mimeType: "audio/webm" });
    expect(url).toBe("https://res.cloudinary.com/demo/video/upload/v1/dotstudy/abc.webm");
    expect(v2.uploader.upload).toHaveBeenCalledWith(
      tmp,
      expect.objectContaining({ resource_type: "video", folder: "dotstudy" }),
    );
    expect(existsSync(tmp)).toBe(false);
  });
});
