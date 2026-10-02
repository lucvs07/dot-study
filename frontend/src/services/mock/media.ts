import { MEDIA_LIMITS, ServiceError, type MediaService } from "@/services/contracts";
import type { MockContext } from "./context";
import { newId } from "./latency";

export interface MediaStore {
  put(id: string, blob: Blob): Promise<void>;
  get(id: string): Promise<Blob | null>;
}

export function createMemoryMediaStore(): MediaStore {
  const map = new Map<string, Blob>();
  return { put: async (id, blob) => void map.set(id, blob), get: async (id) => map.get(id) ?? null };
}

const DB_NAME = "dotstudy-media";
const STORE = "blobs";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function indexedDbMediaStore(): MediaStore {
  const run = <T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) =>
    openDb().then(
      (db) =>
        new Promise<T>((resolve, reject) => {
          const req = fn(db.transaction(STORE, mode).objectStore(STORE));
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        }),
    );
  return {
    put: async (id, blob) => void (await run("readwrite", (s) => s.put(blob, id))),
    get: async (id) => (await run<Blob | undefined>("readonly", (s) => s.get(id))) ?? null,
  };
}

export function createMediaService(ctx: MockContext, store: MediaStore): MediaService {
  const objectUrls = new Map<string, string>();
  return {
    async upload(blob, kind, durationSec) {
      await ctx.wait();
      const limits = MEDIA_LIMITS[kind];
      if (!blob.type.startsWith(`${kind}/`))
        throw new ServiceError("MEDIA_UNSUPPORTED", "Formato de arquivo não suportado.");
      if (blob.size > limits.maxBytes)
        throw new ServiceError("MEDIA_TOO_LARGE", `O arquivo passou de ${limits.maxBytes / 1024 / 1024} MB.`);
      if (durationSec > limits.maxSeconds)
        throw new ServiceError("MEDIA_TOO_LONG", `A gravação passou de ${limits.maxSeconds / 60} minutos.`);
      const id = newId("m");
      await store.put(id, blob);
      return { url: `idb://${id}`, durationSec: Math.round(durationSec) };
    },
    async resolveUrl(url) {
      if (!url.startsWith("idb://")) return url;
      const cached = objectUrls.get(url);
      if (cached) return cached;
      const blob = await store.get(url.slice("idb://".length));
      if (!blob) throw new ServiceError("NOT_FOUND", "Mídia não encontrada neste navegador.");
      const objectUrl = URL.createObjectURL(blob);
      objectUrls.set(url, objectUrl);
      return objectUrl;
    },
  };
}
