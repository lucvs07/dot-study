import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
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
