import type { Author, StudySession, User } from "@dot-study/shared/contracts";
import type { Prisma } from "@prisma/client";
import type { StudySession as SessionRow } from "@prisma/client";

export const userInclude = {
  accessories: { select: { accessoryId: true }, orderBy: { unlockedAt: "asc" } },
} satisfies Prisma.UserInclude;

export type UserRecord = Prisma.UserGetPayload<{ include: typeof userInclude }>;

export function toUser(u: UserRecord): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    coins: u.coins,
    dotColor: u.dotColor,
    activeAccessoryId: u.activeAccessoryId,
    unlockedAccessoryIds: u.accessories.map((a) => a.accessoryId),
    createdAt: u.createdAt.toISOString(),
  };
}

export function toAuthor(u: { id: string; name: string; dotColor: string; activeAccessoryId: string | null }): Author {
  return { id: u.id, name: u.name, dotColor: u.dotColor, activeAccessoryId: u.activeAccessoryId };
}

export function toSession(s: SessionRow): StudySession {
  return {
    id: s.id,
    userId: s.userId,
    mode: s.mode,
    subjectId: s.subjectId,
    themeId: s.themeId,
    label: s.label,
    focusMinutes: s.focusMinutes,
    breakMinutes: s.breakMinutes,
    plannedCycles: s.plannedCycles,
    completedCycles: s.completedCycles,
    notes: s.notes,
    status: s.status,
    startedAt: s.startedAt.toISOString(),
    lastCycleAt: s.lastCycleAt?.toISOString() ?? null,
    finishedAt: s.finishedAt?.toISOString() ?? null,
    rewardedPostId: s.rewardedPostId,
  };
}
