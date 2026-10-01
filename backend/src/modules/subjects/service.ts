import type { Subject, SubjectIcon, Theme } from "@dot-study/shared/contracts";
import type { Deps } from "../../deps";
import { AppError } from "../../errors";

export function pickIndex(random: () => number, length: number): number {
  return Math.min(length - 1, Math.floor(random() * length));
}

export function createSubjectService({ prisma, random }: Deps) {
  return {
    async list(): Promise<Subject[]> {
      const rows = await prisma.subject.findMany({
        orderBy: { id: "asc" },
        include: { themes: { orderBy: { id: "asc" } } },
      });
      return rows.map((s) => ({
        id: s.id,
        name: s.name,
        color: s.color,
        icon: s.icon as SubjectIcon,
        themes: s.themes.map((t) => ({ id: t.id, title: t.title, subjectId: t.subjectId })),
      }));
    },
    async randomTheme(subjectId: number): Promise<Theme> {
      const themes = await prisma.theme.findMany({ where: { subjectId }, orderBy: { id: "asc" } });
      if (themes.length === 0) throw new AppError("NOT_FOUND", "Assunto não encontrado.");
      const t = themes[pickIndex(random, themes.length)];
      return { id: t.id, title: t.title, subjectId: t.subjectId };
    },
  };
}
