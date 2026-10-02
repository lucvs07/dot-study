import { ServiceError, type UserService } from "@/services/contracts";
import { calculateStreak, localDayKey, sessionMinutes } from "@/domain/rules";
import { normalizeEmail, requireUser, toUser, type MockContext } from "./context";
import { validateCredentials } from "./auth";
import { hashPassword } from "./seed";

export function createUserService(ctx: MockContext): UserService {
  return {
    async updateProfile({ name, email, currentPassword, newPassword }) {
      await ctx.wait();
      const current = requireUser(ctx.db.read());
      const nextEmail = email !== undefined ? normalizeEmail(email) : current.email;
      const sensitive = nextEmail !== current.email || newPassword !== undefined;
      if (name !== undefined) validateCredentials(name, nextEmail, undefined);
      if (sensitive) {
        validateCredentials(undefined, nextEmail, newPassword);
        if (!currentPassword) throw new ServiceError("VALIDATION", "Informe sua senha atual.");
        if ((await hashPassword(current.email, currentPassword)) !== current.passwordHash) {
          throw new ServiceError("INVALID_CREDENTIALS", "Senha atual incorreta.");
        }
      }
      const nextHash = sensitive
        ? await hashPassword(nextEmail, newPassword ?? currentPassword!)
        : current.passwordHash;
      return ctx.db.write((draft) => {
        if (draft.users.some((u) => u.id !== current.id && u.email === nextEmail)) {
          throw new ServiceError("EMAIL_TAKEN", "Já existe uma conta com esse email.");
        }
        const user = requireUser(draft);
        if (name !== undefined) user.name = name.trim();
        user.email = nextEmail;
        user.passwordHash = nextHash;
        return toUser(user);
      });
    },

    async updateDot({ dotColor, activeAccessoryId }) {
      await ctx.wait();
      return ctx.db.write((draft) => {
        const user = requireUser(draft);
        if (
          activeAccessoryId !== undefined &&
          activeAccessoryId !== null &&
          !user.unlockedAccessoryIds.includes(activeAccessoryId)
        ) {
          throw new ServiceError("NOT_OWNED", "Você ainda não desbloqueou esse acessório.");
        }
        if (dotColor !== undefined) user.dotColor = dotColor;
        if (activeAccessoryId !== undefined) user.activeAccessoryId = activeAccessoryId;
        return toUser(user);
      });
    },

    async getStats() {
      await ctx.wait();
      const state = ctx.db.read();
      const user = requireUser(state);
      const mine = state.sessions.filter((s) => s.userId === user.id && s.completedCycles > 0);
      const now = ctx.now();
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        const key = localDayKey(d);
        const minutes = mine
          .filter((s) => localDayKey(new Date(s.lastCycleAt ?? s.startedAt)) === key)
          .reduce((sum, s) => sum + sessionMinutes(s), 0);
        return { date: key, minutes };
      });
      return {
        streakDays: calculateStreak(
          mine.map((s) => s.lastCycleAt ?? s.startedAt),
          now,
        ),
        totalMinutes: mine.reduce((sum, s) => sum + sessionMinutes(s), 0),
        completedCycles: mine.reduce((sum, s) => sum + s.completedCycles, 0),
        last7Days,
      };
    },
  };
}
