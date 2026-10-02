import { describe, expect, it } from "vitest";

describe("ambiente de testes", () => {
  it("tem crypto.subtle, randomUUID e structuredClone", async () => {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("x"));
    expect(digest.byteLength).toBe(32);
    expect(crypto.randomUUID()).toMatch(/-/);
    expect(structuredClone({ a: [1] })).toEqual({ a: [1] });
  });

  it("guarda e lê Blob no IndexedDB falso", async () => {
    const db: IDBDatabase = await new Promise((resolve, reject) => {
      const req = indexedDB.open(`smoke-${Math.random()}`, 1);
      req.onupgradeneeded = () => req.result.createObjectStore("b");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    await new Promise((resolve, reject) => {
      const req = db
        .transaction("b", "readwrite")
        .objectStore("b")
        .put(new Blob(["oi"], { type: "audio/webm" }), "k");
      req.onsuccess = resolve;
      req.onerror = () => reject(req.error);
    });
    const got: Blob = await new Promise((resolve, reject) => {
      const req = db.transaction("b").objectStore("b").get("k");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    expect(got.type).toBe("audio/webm");
    expect(await got.text()).toBe("oi");
  });
});
