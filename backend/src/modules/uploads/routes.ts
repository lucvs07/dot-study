import os from "node:os";
import path from "node:path";
import { MEDIA_LIMITS } from "@dot-study/shared/contracts";
import { Router, type ErrorRequestHandler, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import type { Deps } from "../../deps";
import { AppError } from "../../errors";
import { requireAuth, userIdOf } from "../../middleware/auth";
import { createUploadService } from "./service";

export function createUploadsRouter(deps: Deps): Router {
  const service = createUploadService(deps);
  const upload = multer({
    dest: path.join(os.tmpdir(), "dotstudy-uploads"),
    limits: { fileSize: MEDIA_LIMITS.video.maxBytes, files: 1, fields: 5 },
  });
  const limiter = rateLimit({
    windowMs: 15 * 60_000,
    limit: deps.env.UPLOAD_RATE_LIMIT,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (_req, res) => {
      res
        .status(429)
        .json({ error: { code: "VALIDATION", message: "Muitos envios. Aguarde alguns minutos e tente de novo." } });
    },
  });
  const multerErrors: ErrorRequestHandler = (err, req, _res, next) => {
    if (err instanceof AppError) {
      next(err);
      return;
    }
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      next(new AppError("MEDIA_TOO_LARGE", `O arquivo passou de ${MEDIA_LIMITS.video.maxBytes / 1024 / 1024} MB.`));
      return;
    }
    // demais erros do multer/busboy (ex.: multipart malformado ou truncado) são culpa do envio
    req.log?.warn({ err }, "upload inválido");
    next(new AppError("VALIDATION", "Envio de arquivo inválido."));
  };
  const router = Router();
  router.post(
    "/",
    requireAuth(deps.env),
    limiter,
    upload.single("file"),
    multerErrors,
    async (req: Request, res: Response) => {
      res.status(201).json(await service.upload(userIdOf(req), req.file, req.body));
    },
  );
  return router;
}
