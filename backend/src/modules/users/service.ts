import { calculateStreak, offsetDayKey } from "@dot-study/shared/rules";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Deps } from "../../deps";
import { AppError, isUniqueViolation } from "../../errors";
import { toUser, userInclude } from "../../serialize";
import { parse } from "../../validate";
import { emailSchema, nameSchema, passwordSchema } from "../auth/service";

const profileSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  currentPassword: z.string().optional(),
  newPassword: passwordSchema.optional(),
});
const dotSchema = z.object({
  dotColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Escolha uma cor válida.")
    .optional(),
  activeAccessoryId: z.string().nullable().optional(),
});
const statsQuery = z.object({
  tzOffset: z.coerce
    .number({ invalid_type_error: "Fuso horário inválido." })
    .int("Fuso horário inválido.")
    .min(-840, "Fuso horário inválido.")
    .max(840, "Fuso horário inválido.")
    .default(0),
});

export function createUserService(deps: Deps) {
  const { prisma } = deps;
  const load = async (userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: userInclude });
    if (!user) throw new AppError("UNAUTHORIZED", "Sua sessão expirou. Faça login de novo.");
    return user;
  };

  return {
    async updateProfile(userId: string, body: unknown) {
      const input = parse(profileSchema, body);
      const current = await load(userId);
      const nextEmail = input.email ?? current.email;
      const sensitive = nextEmail !== current.email || input.newPassword !== undefined;
      let passwordHash = current.passwordHash;
      if (sensitive) {
        if (!input.currentPassword) throw new AppError("VALIDATION", "Informe sua senha atual.");
        if (!(await bcrypt.compare(input.currentPassword, current.passwordHash))) {
          throw new AppError("INVALID_CREDENTIALS", "Senha atual incorreta.");
        }
        if (input.newPassword) passwordHash = await bcrypt.hash(input.newPassword, 10);
      }
      try {
        const user = await prisma.user.update({
          where: { id: userId },
          data: { name: input.name ?? current.name, email: nextEmail, passwordHash },
          include: userInclude,
        });
        return toUser(user);
      } catch (error) {
        if (isUniqueViolation(error)) throw new AppError("EMAIL_TAKEN", "Já existe uma conta com esse email.");
        throw error;
      }
    },

    async updateDot(userId: string, body: unknown) {
      const input = parse(dotSchema, body);
      const current = await load(userId);
      if (input.activeAccessoryId && !current.accessories.some((a) => a.accessoryId === input.activeAccessoryId)) {
        throw new AppError("NOT_OWNED", "Você ainda não desbloqueou esse acessório.");
      }
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          dotColor: input.dotColor ?? current.dotColor,
          activeAccessoryId:
            input.activeAccessoryId === undefined ? current.activeAccessoryId : input.activeAccessoryId,
        },
        include: userInclude,
      });
      return toUser(user);
    },

    async getStats(userId: string, query: unknown) {
      const { tzOffset } = parse(statsQuery, query);
      await load(userId);
      const sessions = await prisma.studySession.findMany({
        where: { userId, completedCycles: { gt: 0 } },
        select: { completedCycles: true, focusMinutes: true, lastCycleAt: true, startedAt: true },
      });
      const dayOf = (d: Date) => offsetDayKey(d, tzOffset);
      const nowMs = deps.now().getTime();
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const key = dayOf(new Date(nowMs - (6 - i) * 86_400_000));
        const minutes = sessions
          .filter((s) => dayOf(s.lastCycleAt ?? s.startedAt) === key)
          .reduce((sum, s) => sum + s.completedCycles * s.focusMinutes, 0);
        return { date: key, minutes };
      });
      return {
        streakDays: calculateStreak(
          sessions.map((s) => (s.lastCycleAt ?? s.startedAt).toISOString()),
          nowMs,
          dayOf,
        ),
        totalMinutes: sessions.reduce((sum, s) => sum + s.completedCycles * s.focusMinutes, 0),
        completedCycles: sessions.reduce((sum, s) => sum + s.completedCycles, 0),
        last7Days,
      };
    },
  };
}
