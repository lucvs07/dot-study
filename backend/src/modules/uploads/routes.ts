import os from "node:os";
import path from "node:path";
import { MEDIA_LIMITS } from "@dot-study/shared/contracts";
import { Router, type ErrorRequestHandler, type Request, type Response } from "express";
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
  const multerErrors: ErrorRequestHandler = (err, _req, _res, next) => {
    if (err instanceof multer.MulterError) {
      next(
        err.code === "LIMIT_FILE_SIZE"
          ? new AppError("MEDIA_TOO_LARGE", `O arquivo passou de ${MEDIA_LIMITS.video.maxBytes / 1024 / 1024} MB.`)
          : new AppError("VALIDATION", "Envio de arquivo inválido."),
      );
      return;
    }
    next(err);
  };
  const router = Router();
  router.post("/", requireAuth(deps.env), upload.single("file"), multerErrors, async (req: Request, res: Response) => {
    res.status(201).json(await service.upload(userIdOf(req), req.file, req.body));
  });
  return router;
}
