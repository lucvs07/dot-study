import { open, unlink } from "node:fs/promises";
import { MEDIA_LIMITS } from "@dot-study/shared/contracts";
import { z } from "zod";
import type { Deps } from "../../deps";
import { AppError } from "../../errors";
import { ALLOWED, EXTENSION, sniffContainer } from "../../storage/sniff";
import { parse } from "../../validate";
import type { MediaResolver } from "../posts/service";

const fieldsSchema = z.object({
  kind: z.enum(["audio", "video"], { errorMap: () => ({ message: "Tipo de mídia inválido." }) }),
  durationSec: z.coerce.number({ invalid_type_error: "Duração inválida." }).positive("Duração inválida."),
});

async function readHead(filePath: string): Promise<Buffer> {
  const fh = await open(filePath, "r");
  try {
    const buf = Buffer.alloc(16);
    const { bytesRead } = await fh.read(buf, 0, 16, 0);
    return buf.subarray(0, bytesRead);
  } finally {
    await fh.close();
  }
}

export function createUploadService(deps: Deps) {
  return {
    async upload(userId: string, file: Express.Multer.File | undefined, body: unknown) {
      if (!file) throw new AppError("VALIDATION", "Envie um arquivo de áudio ou vídeo.");
      let stored = false;
      try {
        const { kind, durationSec } = parse(fieldsSchema, body);
        const limits = MEDIA_LIMITS[kind];
        if (!file.mimetype.startsWith(`${kind}/`))
          throw new AppError("MEDIA_UNSUPPORTED", "Formato de arquivo não suportado.");
        const container = sniffContainer(await readHead(file.path));
        if (!container || !ALLOWED[kind].includes(container))
          throw new AppError("MEDIA_UNSUPPORTED", "Formato de arquivo não suportado.");
        if (file.size > limits.maxBytes)
          throw new AppError("MEDIA_TOO_LARGE", `O arquivo passou de ${limits.maxBytes / 1024 / 1024} MB.`);
        if (durationSec > limits.maxSeconds)
          throw new AppError("MEDIA_TOO_LONG", `A gravação passou de ${limits.maxSeconds / 60} minutos.`);
        const { url } = await deps.storage.save({
          tmpPath: file.path,
          ext: EXTENSION[container],
          mimeType: file.mimetype,
        });
        stored = true;
        const rounded = Math.max(1, Math.round(durationSec));
        await deps.prisma.media.create({
          data: { ownerId: userId, url, kind, durationSec: rounded, sizeBytes: file.size, createdAt: deps.now() },
        });
        return { url, durationSec: rounded };
      } finally {
        if (!stored) await unlink(file.path).catch(() => undefined);
      }
    },
  };
}

export const ownedMediaResolver: MediaResolver = async (tx, userId, input) => {
  if (input.type === "text") return null;
  const media = input.mediaUrl
    ? await tx.media.findFirst({ where: { url: input.mediaUrl, ownerId: userId, kind: input.type, post: null } })
    : null;
  if (!media) throw new AppError("VALIDATION", "Grave ou envie a mídia antes de publicar.");
  return { mediaId: media.id, mediaUrl: media.url, mediaDurationSec: media.durationSec };
};
