import { unlink } from "node:fs/promises";
import { v2 as cloudinary } from "cloudinary";
import type { StorageDriver } from "./driver";

/** Lê as credenciais de CLOUDINARY_URL (variável de ambiente lida pelo próprio SDK). */
export function createCloudinaryStorage(): StorageDriver {
  cloudinary.config({ secure: true });
  return {
    async save({ tmpPath }) {
      try {
        // áudio e vídeo usam resource_type "video" no Cloudinary
        const result = await cloudinary.uploader.upload(tmpPath, { resource_type: "video", folder: "dotstudy" });
        return { url: result.secure_url };
      } finally {
        await unlink(tmpPath).catch(() => undefined);
      }
    },
  };
}
