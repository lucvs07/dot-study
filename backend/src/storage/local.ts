import { randomUUID } from "node:crypto";
import { copyFile, mkdir, rename, unlink } from "node:fs/promises";
import path from "node:path";
import type { StorageDriver } from "./driver";

export function createLocalStorage(dir: string): StorageDriver {
  return {
    async save({ tmpPath, ext }) {
      await mkdir(dir, { recursive: true });
      const name = `${randomUUID()}.${ext}`;
      const target = path.join(dir, name);
      try {
        await rename(tmpPath, target);
      } catch {
        // tmp em outro disco/volume: copia e apaga
        await copyFile(tmpPath, target);
        await unlink(tmpPath);
      }
      return { url: `/media/${name}` };
    },
  };
}
