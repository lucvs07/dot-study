import type { Env } from "../config/env";
import type { StorageDriver } from "./driver";
import { createLocalStorage } from "./local";

export function createStorage(env: Env): StorageDriver {
  return createLocalStorage(env.UPLOAD_DIR);
}
