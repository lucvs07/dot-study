import { describe, expect, it } from "vitest";
import { createTestContext } from "./context";
import { createMediaService, createMemoryMediaStore, indexedDbMediaStore } from "./media";

describe("MediaService (mock)", () => {
  it("guarda o blob e devolve idb://", async () => {
    const media = createMediaService(createTestContext(), createMemoryMediaStore());
    const { url, durationSec } = await media.upload(new Blob(["abc"], { type: "audio/webm" }), "audio", 12.4);
    expect(url).toMatch(/^idb:\/\//);
    expect(durationSec).toBe(12);
  });

  it("recusa arquivo grande, longo ou de tipo errado", async () => {
    const media = createMediaService(createTestContext(), createMemoryMediaStore());
    const big = new Blob([new Uint8Array(10 * 1024 * 1024 + 1)], { type: "audio/webm" });
    await expect(media.upload(big, "audio", 10)).rejects.toMatchObject({ code: "MEDIA_TOO_LARGE" });
    await expect(media.upload(new Blob(["a"], { type: "video/webm" }), "video", 121)).rejects.toMatchObject({
      code: "MEDIA_TOO_LONG",
    });
    await expect(media.upload(new Blob(["a"], { type: "image/png" }), "video", 5)).rejects.toMatchObject({
      code: "MEDIA_UNSUPPORTED",
    });
  });

  it("IndexedDB guarda e lê de volta", async () => {
    const store = indexedDbMediaStore();
    await store.put("x1", new Blob(["oi"], { type: "audio/webm" }));
    const blob = await store.get("x1");
    expect(await blob!.text()).toBe("oi");
    expect(await store.get("nao")).toBeNull();
  });

  it("resolveUrl deixa URLs http intactas", async () => {
    const media = createMediaService(createTestContext(), createMemoryMediaStore());
    expect(await media.resolveUrl("https://x/y.mp4")).toBe("https://x/y.mp4");
  });
});
