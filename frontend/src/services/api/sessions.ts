import type { CoinReward, SessionService, StudySession } from "@/services/contracts";
import type { HttpClient } from "./http";

export function createApiSessionService(http: HttpClient): SessionService {
  return {
    start: (input) => http.request<StudySession>("POST", "/sessions", { body: input }),
    completeCycle: (id) =>
      http.request<{ session: StudySession; reward: CoinReward }>("POST", `/sessions/${encodeURIComponent(id)}/cycles`),
    updateNotes: (id, notes) =>
      http.request<StudySession>("PATCH", `/sessions/${encodeURIComponent(id)}`, { body: { notes } }),
    finish: (id, status) =>
      http.request<StudySession>("PATCH", `/sessions/${encodeURIComponent(id)}`, { body: { status } }),
    list: () => http.request<StudySession[]>("GET", "/sessions"),
  };
}
