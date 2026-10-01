import type { StudySession } from "@dot-study/shared/contracts";
import { computeSubjectScores, rankEntries } from "@dot-study/shared/rules";
import type { Deps } from "../../deps";
import { toAuthor } from "../../serialize";

export function createRankingService({ prisma }: Deps) {
  return {
    async bySubject(meId: string, subjectId: number) {
      const sessions = await prisma.studySession.findMany({
        where: { subjectId, completedCycles: { gt: 0 } },
        select: { userId: true, subjectId: true, completedCycles: true },
      });
      const posts = await prisma.post.findMany({ where: { subjectId }, select: { authorId: true, subjectId: true } });
      // só esses campos são lidos
      const scores = computeSubjectScores(subjectId, sessions as unknown as StudySession[], posts);
      const users = await prisma.user.findMany({ where: { id: { in: [...scores.keys()] } } });
      return rankEntries(scores, new Map(users.map((u) => [u.id, toAuthor(u)])), meId);
    },
  };
}
