import type { Env } from "../config/env";
import { createCloudinaryStorage } from "./cloudinary";
import type { StorageDriver } from "./driver";
import { createLocalStorage } from "./local";

export function createStorage(env: Env): StorageDriver {
  return env.STORAGE_DRIVER === "cloudinary" ? createCloudinaryStorage() : createLocalStorage(env.UPLOAD_DIR);
}
