import type { Author, ID, ISODate, RankEntry, StudySession } from "@/services/contracts";

export const COINS = { welcome: 250, cycle: 10, post: 30 } as const;
export const POINTS = { cycle: 10, post: 30 } as const;
export const CYCLE_MIN_FRACTION = 0.9;

export type CycleCheck = { ok: true } | { ok: false; reason: "CYCLE_TOO_SOON" | "SESSION_CLOSED" };

export function canCompleteCycle(session: StudySession, nowMs: number): CycleCheck {
  if (session.status !== "in_progress" || session.completedCycles >= session.plannedCycles) {
    return { ok: false, reason: "SESSION_CLOSED" };
  }
  const since = new Date(session.lastCycleAt ?? session.startedAt).getTime();
  const minMs = CYCLE_MIN_FRACTION * session.focusMinutes * 60_000;
  return nowMs - since >= minMs ? { ok: true } : { ok: false, reason: "CYCLE_TOO_SOON" };
}

export function sessionMinutes(session: StudySession): number {
  return session.completedCycles * session.focusMinutes;
}

export function localDayKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

/** Dias consecutivos com estudo, contando a partir de hoje (fuso local). */
export function calculateStreak(studyDates: ISODate[], nowMs: number): number {
  const days = new Set(studyDates.map((iso) => localDayKey(new Date(iso))));
  const cursor = new Date(nowMs);
  let streak = 0;
  while (days.has(localDayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function computeSubjectScores(
  subjectId: number,
  sessions: StudySession[],
  posts: { authorId: ID; subjectId: number | null }[],
): Map<ID, number> {
  const scores = new Map<ID, number>();
  const add = (userId: ID, value: number) => scores.set(userId, (scores.get(userId) ?? 0) + value);
  for (const s of sessions) if (s.subjectId === subjectId) add(s.userId, s.completedCycles * POINTS.cycle);
  for (const p of posts) if (p.subjectId === subjectId) add(p.authorId, POINTS.post);
  return scores;
}

export function rankEntries(scores: Map<ID, number>, authors: Map<ID, Author>, meId: ID | null): RankEntry[] {
  return [...scores.entries()]
    .filter(([id, score]) => score > 0 && authors.has(id))
    .sort((a, b) => b[1] - a[1] || authors.get(a[0])!.name.localeCompare(authors.get(b[0])!.name))
    .map(([id, score], i) => ({ position: i + 1, user: authors.get(id)!, score, isMe: id === meId }));
}
