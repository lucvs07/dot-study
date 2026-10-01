import { COINS } from "@dot-study/shared/rules";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import type { Deps } from "../../deps";
import { AppError, isUniqueViolation } from "../../errors";
import { postInclude, toCommentTree, toPost } from "../../serialize";
import { parse } from "../../validate";

const listSchema = z.object({
  subjectId: z.coerce.number().int().optional(),
  type: z.enum(["text", "audio", "video"]).optional(),
  savedOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  cursor: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z\|[^|]+$/, "Cursor inválido.")
    .optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1, "O limite deve estar entre 1 e 50.")
    .max(50, "O limite deve estar entre 1 e 50.")
    .default(10),
});

const createSchema = z.object({
  sessionId: z.string().nullable(),
  type: z.enum(["text", "audio", "video"], { errorMap: () => ({ message: "Tipo de post inválido." }) }),
  title: z
    .string()
    .trim()
    .min(3, "O título precisa ter entre 3 e 120 caracteres.")
    .max(120, "O título precisa ter entre 3 e 120 caracteres."),
  content: z.string().max(20_000, "O texto passou do limite de 20 mil caracteres.").default(""),
  mediaUrl: z.string().nullable().optional(),
  mediaDurationSec: z.number().nullable().optional(),
});

const commentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Escreva um comentário de até 2000 caracteres.")
    .max(2000, "Escreva um comentário de até 2000 caracteres."),
  parentId: z.string().nullable().optional(),
});

export type MediaResolver = (
  tx: Prisma.TransactionClient,
  userId: string,
  input: z.infer<typeof createSchema>,
) => Promise<{ mediaId: string; mediaUrl: string; mediaDurationSec: number } | null>;

/** Nesta task só existem posts de texto; a Task 9 troca este resolver pelo que valida a mídia enviada. */
export const textOnlyMedia: MediaResolver = async (_tx, _userId, input) => {
  if (input.type === "text") return null;
  throw new AppError("VALIDATION", "Grave ou envie a mídia antes de publicar.");
};

export function createPostService(deps: Deps, resolveMedia: MediaResolver = textOnlyMedia) {
  const { prisma } = deps;
  const findPost = async (meId: string, id: string) => {
    const post = await prisma.post.findUnique({ where: { id }, include: postInclude(meId) });
    if (!post) throw new AppError("NOT_FOUND", "Post não encontrado.");
    return post;
  };

  return {
    async list(meId: string, query: unknown) {
      const f = parse(listSchema, query);
      const where: Prisma.PostWhereInput = {
        ...(f.subjectId !== undefined ? { subjectId: f.subjectId } : {}),
        ...(f.type ? { type: f.type } : {}),
        ...(f.savedOnly ? { saves: { some: { userId: meId } } } : {}),
      };
      if (f.cursor) {
        const [iso, id] = f.cursor.split("|");
        const at = new Date(iso);
        if (Number.isNaN(at.getTime())) throw new AppError("VALIDATION", "Cursor inválido.");
        where.OR = [{ createdAt: { lt: at } }, { createdAt: at, id: { lt: id } }];
      }
      const rows = await prisma.post.findMany({
        where,
        include: postInclude(meId),
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: f.limit + 1,
      });
      const items = rows.slice(0, f.limit).map(toPost);
      const last = items.at(-1);
      return { items, nextCursor: rows.length > f.limit && last ? `${last.createdAt}|${last.id}` : null };
    },

    async get(meId: string, id: string) {
      return toPost(await findPost(meId, id));
    },

    async create(meId: string, body: unknown) {
      const input = parse(createSchema, body);
      const now = deps.now();
      return prisma.$transaction(async (tx) => {
        const session = input.sessionId
          ? await tx.studySession.findFirst({ where: { id: input.sessionId, userId: meId } })
          : null;
        if (input.sessionId && !session) throw new AppError("NOT_FOUND", "Sessão não encontrada.");
        const media = await resolveMedia(tx, meId, input);
        const post = await tx.post
          .create({
            data: {
              authorId: meId,
              sessionId: session?.id ?? null,
              subjectId: session?.subjectId ?? null,
              type: input.type,
              title: input.title,
              content: input.content.trim(),
              mediaId: media?.mediaId ?? null,
              mediaUrl: media?.mediaUrl ?? null,
              mediaDurationSec: media?.mediaDurationSec ?? null,
              createdAt: now,
            },
          })
          .catch((err) => {
            if (isUniqueViolation(err)) throw new AppError("VALIDATION", "Essa mídia já foi publicada.");
            throw err;
          });
        let reward = null;
        if (session && session.completedCycles > 0) {
          // update condicional: só a primeira publicação da sessão leva a recompensa
          const claimed = await tx.studySession.updateMany({
            where: { id: session.id, rewardedPostId: null },
            data: { rewardedPostId: post.id },
          });
          if (claimed.count === 1) {
            const user = await tx.user.update({ where: { id: meId }, data: { coins: { increment: COINS.post } } });
            await tx.coinTransaction.create({
              data: { userId: meId, amount: COINS.post, reason: "post", refId: post.id, createdAt: now },
            });
            reward = { coinsEarned: COINS.post, balance: user.coins };
          }
        }
        const full = await tx.post.findUniqueOrThrow({ where: { id: post.id }, include: postInclude(meId) });
        return { post: toPost(full), reward };
      });
    },

    async toggle(meId: string, id: string, list: "like" | "save", on: boolean) {
      await findPost(meId, id);
      const key = { userId_postId: { userId: meId, postId: id } };
      if (list === "like") {
        if (on) await prisma.like.upsert({ where: key, create: { userId: meId, postId: id }, update: {} });
        else await prisma.like.deleteMany({ where: { userId: meId, postId: id } });
      } else {
        if (on) await prisma.save.upsert({ where: key, create: { userId: meId, postId: id }, update: {} });
        else await prisma.save.deleteMany({ where: { userId: meId, postId: id } });
      }
      return toPost(await findPost(meId, id));
    },

    async listComments(meId: string, postId: string) {
      await findPost(meId, postId);
      const rows = await prisma.comment.findMany({
        where: { postId },
        include: { author: true },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      });
      return toCommentTree(rows);
    },

    async addComment(meId: string, postId: string, body: unknown) {
      const input = parse(commentSchema, body);
      await findPost(meId, postId);
      if (input.parentId && !(await prisma.comment.findFirst({ where: { id: input.parentId, postId } }))) {
        throw new AppError("NOT_FOUND", "Comentário não encontrado.");
      }
      const row = await prisma.comment.create({
        data: {
          postId,
          authorId: meId,
          parentId: input.parentId ?? null,
          content: input.content,
          createdAt: deps.now(),
        },
        include: { author: true },
      });
      return toCommentTree([row])[0];
    },
  };
}
