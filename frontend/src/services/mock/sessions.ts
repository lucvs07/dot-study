import { ServiceError, type SessionService, type StudySession } from "@/services/contracts";
import { COINS, canCompleteCycle } from "@/domain/rules";
import { addCoins, requireUser, type MockContext } from "./context";
import type { DbState } from "./db";
import { newId } from "./latency";
import { SUBJECTS } from "./seed";
import { pickIndex } from "./subjects";

function assertRange(value: number, min: number, max: number, label: string) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new ServiceError("VALIDATION", `${label} deve estar entre ${min} e ${max}.`);
  }
}

function findMine(draft: DbState, sessionId: string): StudySession {
  const user = requireUser(draft);
  const session = draft.sessions.find((s) => s.id === sessionId && s.userId === user.id);
  if (!session) throw new ServiceError("NOT_FOUND", "Sessão não encontrada.");
  return session;
}

export function createSessionService(ctx: MockContext): SessionService {
  const nowIso = () => new Date(ctx.now()).toISOString();
  return {
    async start(input) {
      await ctx.wait();
      assertRange(input.focusMinutes, 1, 120, "O tempo de foco");
      if (input.mode === "free") {
        assertRange(input.breakMinutes, 1, 60, "A pausa");
        assertRange(input.plannedCycles, 1, 12, "O número de ciclos");
      }
      return ctx.db.write((draft) => {
        const user = requireUser(draft);
        for (const s of draft.sessions) {
          if (s.userId === user.id && s.status === "in_progress") {
            s.status = "abandoned";
            s.finishedAt = nowIso();
          }
        }
        let subjectId: number | null = null;
        let themeId: number | null = null;
        if (input.mode === "challenge") {
          const subject =
            input.subjectId === "random"
              ? SUBJECTS[pickIndex(ctx.random, SUBJECTS.length)]
              : SUBJECTS.find((s) => s.id === input.subjectId);
          if (!subject) throw new ServiceError("NOT_FOUND", "Assunto não encontrado.");
          subjectId = subject.id;
          themeId = subject.themes[pickIndex(ctx.random, subject.themes.length)].id;
        }
        const session: StudySession = {
          id: newId("s"),
          userId: user.id,
          mode: input.mode,
          subjectId,
          themeId,
          label: input.mode === "free" ? input.label?.trim() || null : null,
          focusMinutes: input.focusMinutes,
          breakMinutes: input.mode === "free" ? input.breakMinutes : 0,
          plannedCycles: input.mode === "free" ? input.plannedCycles : 1,
          completedCycles: 0,
          notes: "",
          status: "in_progress",
          startedAt: nowIso(),
          lastCycleAt: null,
          finishedAt: null,
          rewardedPostId: null,
        };
        draft.sessions.unshift(session);
        return structuredClone(session);
      });
    },

    async completeCycle(sessionId) {
      await ctx.wait();
      return ctx.db.write((draft) => {
        const session = findMine(draft, sessionId);
        const check = canCompleteCycle(session, ctx.now());
        if (!check.ok) {
          throw new ServiceError(
            check.reason,
            check.reason === "CYCLE_TOO_SOON" ? "Esse ciclo ainda não terminou." : "Essa sessão já foi encerrada.",
          );
        }
        session.completedCycles += 1;
        session.lastCycleAt = nowIso();
        if (session.completedCycles === session.plannedCycles) {
          session.status = "completed";
          session.finishedAt = nowIso();
        }
        const balance = addCoins(draft, session.userId, COINS.cycle, "cycle", session.id, nowIso());
        return { session: structuredClone(session), reward: { coinsEarned: COINS.cycle, balance } };
      });
    },

    async updateNotes(sessionId, notes) {
      await ctx.wait();
      return ctx.db.write((draft) => {
        const session = findMine(draft, sessionId);
        session.notes = notes.slice(0, 5000);
        return structuredClone(session);
      });
    },

    async finish(sessionId, status) {
      await ctx.wait();
      return ctx.db.write((draft) => {
        const session = findMine(draft, sessionId);
        if (session.status === "in_progress") {
          session.status = status;
          session.finishedAt = nowIso();
        }
        return structuredClone(session);
      });
    },

    async list() {
      await ctx.wait();
      const state = ctx.db.read();
      const user = requireUser(state);
      return state.sessions
        .filter((s) => s.userId === user.id)
        .sort((a, b) => (b.lastCycleAt ?? b.startedAt).localeCompare(a.lastCycleAt ?? a.startedAt));
    },
  };
}
