import { COINS, canCompleteCycle } from "@dot-study/shared/rules";
import { z } from "zod";
import type { Deps } from "../../deps";
import { AppError } from "../../errors";
import { toSession } from "../../serialize";
import { parse } from "../../validate";
import { pickIndex } from "../subjects/service";

const minutes = (label: string, min: number, max: number) =>
  z
    .number({
      invalid_type_error: `${label} deve estar entre ${min} e ${max}.`,
      required_error: `${label} deve estar entre ${min} e ${max}.`,
    })
    .int(`${label} deve estar entre ${min} e ${max}.`)
    .min(min, `${label} deve estar entre ${min} e ${max}.`)
    .max(max, `${label} deve estar entre ${min} e ${max}.`);

const startSchema = z.discriminatedUnion(
  "mode",
  [
    z.object({
      mode: z.literal("challenge"),
      subjectId: z.union([z.number().int(), z.literal("random")]),
      focusMinutes: minutes("O tempo de foco", 1, 120),
    }),
    z.object({
      mode: z.literal("free"),
      label: z.string().max(80, "O rótulo pode ter no máximo 80 caracteres.").nullable(),
      focusMinutes: minutes("O tempo de foco", 1, 120),
      breakMinutes: minutes("A pausa", 1, 60),
      plannedCycles: minutes("O número de ciclos", 1, 12),
    }),
  ],
  { errorMap: () => ({ message: "Modo de sessão inválido." }) },
);

const updateSchema = z.object({
  notes: z.string().max(5000, "As anotações passaram de 5 mil caracteres.").optional(),
  status: z.enum(["completed", "abandoned"]).optional(),
});

export function createSessionService(deps: Deps) {
  const { prisma } = deps;
  const findMine = async (userId: string, id: string) => {
    const s = await prisma.studySession.findFirst({ where: { id, userId } });
    if (!s) throw new AppError("NOT_FOUND", "Sessão não encontrada.");
    return s;
  };

  return {
    async start(userId: string, body: unknown) {
      const input = parse(startSchema, body);
      const now = deps.now();
      let subjectId: number | null = null;
      let themeId: number | null = null;
      if (input.mode === "challenge") {
        const subjects = await prisma.subject.findMany({
          orderBy: { id: "asc" },
          include: { themes: { orderBy: { id: "asc" } } },
        });
        const subject =
          input.subjectId === "random"
            ? subjects[pickIndex(deps.random, subjects.length)]
            : subjects.find((s) => s.id === input.subjectId);
        if (!subject) throw new AppError("NOT_FOUND", "Assunto não encontrado.");
        subjectId = subject.id;
        themeId = subject.themes[pickIndex(deps.random, subject.themes.length)].id;
      }
      const created = await prisma.$transaction(async (tx) => {
        await tx.studySession.updateMany({
          where: { userId, status: "in_progress" },
          data: { status: "abandoned", finishedAt: now },
        });
        return tx.studySession.create({
          data: {
            userId,
            mode: input.mode,
            subjectId,
            themeId,
            label: input.mode === "free" ? input.label?.trim() || null : null,
            focusMinutes: input.focusMinutes,
            breakMinutes: input.mode === "free" ? input.breakMinutes : 0,
            plannedCycles: input.mode === "free" ? input.plannedCycles : 1,
            startedAt: now,
          },
        });
      });
      return toSession(created);
    },

    async completeCycle(userId: string, id: string) {
      const now = deps.now();
      return prisma.$transaction(async (tx) => {
        const s = await tx.studySession.findFirst({ where: { id, userId } });
        if (!s) throw new AppError("NOT_FOUND", "Sessão não encontrada.");
        const check = canCompleteCycle(toSession(s), now.getTime());
        if (!check.ok) {
          throw new AppError(
            check.reason,
            check.reason === "CYCLE_TOO_SOON" ? "Esse ciclo ainda não terminou." : "Essa sessão já foi encerrada.",
          );
        }
        const finished = s.completedCycles + 1 === s.plannedCycles;
        // update condicional: se outra requisição já concluiu este ciclo, count = 0
        const updated = await tx.studySession.updateMany({
          where: { id: s.id, status: "in_progress", completedCycles: s.completedCycles },
          data: {
            completedCycles: { increment: 1 },
            lastCycleAt: now,
            ...(finished ? { status: "completed", finishedAt: now } : {}),
          },
        });
        if (updated.count === 0) throw new AppError("SESSION_CLOSED", "Esse ciclo já foi registrado.");
        const user = await tx.user.update({ where: { id: userId }, data: { coins: { increment: COINS.cycle } } });
        await tx.coinTransaction.create({
          data: { userId, amount: COINS.cycle, reason: "cycle", refId: s.id, createdAt: now },
        });
        const fresh = await tx.studySession.findUniqueOrThrow({ where: { id: s.id } });
        return { session: toSession(fresh), reward: { coinsEarned: COINS.cycle, balance: user.coins } };
      });
    },

    async update(userId: string, id: string, body: unknown) {
      const input = parse(updateSchema, body);
      const s = await findMine(userId, id);
      const data: { notes?: string; status?: "completed" | "abandoned"; finishedAt?: Date } = {};
      if (input.notes !== undefined) data.notes = input.notes;
      if (input.status && s.status === "in_progress") {
        data.status = input.status;
        data.finishedAt = deps.now();
      }
      return toSession(await prisma.studySession.update({ where: { id: s.id }, data }));
    },

    async list(userId: string) {
      const rows = await prisma.studySession.findMany({ where: { userId } });
      return rows
        .map(toSession)
        .sort((a, b) => (b.lastCycleAt ?? b.startedAt).localeCompare(a.lastCycleAt ?? a.startedAt));
    },
  };
}
