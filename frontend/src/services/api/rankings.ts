import type { RankEntry, RankingService } from "@/services/contracts";
import type { HttpClient } from "./http";

export function createApiRankingService(http: HttpClient): RankingService {
  return { bySubject: (subjectId) => http.request<RankEntry[]>("GET", `/rankings/${subjectId}`) };
}
