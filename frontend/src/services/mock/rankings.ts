import type { RankingService } from "@/services/contracts";
import { computeSubjectScores, rankEntries } from "@/domain/rules";
import { findCurrentUser, toAuthor, type MockContext } from "./context";

export function createRankingService(ctx: MockContext): RankingService {
  return {
    async bySubject(subjectId) {
      await ctx.wait();
      const state = ctx.db.read();
      const scores = computeSubjectScores(subjectId, state.sessions, state.posts);
      const authors = new Map(state.users.map((u) => [u.id, toAuthor(u)]));
      return rankEntries(scores, authors, findCurrentUser(state)?.id ?? null);
    },
  };
}
