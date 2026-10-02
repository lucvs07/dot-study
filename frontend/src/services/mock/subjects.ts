import { ServiceError, type SubjectService } from "@/services/contracts";
import type { MockContext } from "./context";
import { SUBJECTS } from "./seed";

export function pickIndex(random: () => number, length: number): number {
  return Math.min(length - 1, Math.floor(random() * length));
}

export function createSubjectService(ctx: MockContext): SubjectService {
  return {
    async list() {
      await ctx.wait();
      return structuredClone(SUBJECTS);
    },
    async randomTheme(subjectId) {
      await ctx.wait();
      const subject = SUBJECTS.find((s) => s.id === subjectId);
      if (!subject) throw new ServiceError("NOT_FOUND", "Assunto não encontrado.");
      return { ...subject.themes[pickIndex(ctx.random, subject.themes.length)] };
    },
  };
}
