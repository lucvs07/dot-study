import { computeSubjectScores, rankEntries } from "@dot-study/shared/rules";
import type { Deps } from "../../deps";
import { toAuthor } from "../../serialize";

export function createRankingService({ prisma }: Deps) {
  return {
    async bySubject(meId: string, subjectId: number) {
      // sessão recompensada sempre tem ciclo concluído, então o filtro não perde nenhum rewardedPostId
      const sessions = await prisma.studySession.findMany({
        where: { subjectId, completedCycles: { gt: 0 } },
        select: { id: true, userId: true, subjectId: true, completedCycles: true, rewardedPostId: true },
      });
      const posts = await prisma.post.findMany({
        where: { subjectId },
        select: { id: true, authorId: true, subjectId: true, sessionId: true },
      });
      const scores = computeSubjectScores(subjectId, sessions, posts);
      const users = await prisma.user.findMany({ where: { id: { in: [...scores.keys()] } } });
      return rankEntries(scores, new Map(users.map((u) => [u.id, toAuthor(u)])), meId);
    },
  };
}
