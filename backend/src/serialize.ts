import type { Author, Comment, Post, StudySession, User } from "@dot-study/shared/contracts";
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

export function postInclude(meId: string) {
  return {
    author: true,
    _count: { select: { likes: true, comments: true } },
    likes: { where: { userId: meId }, select: { userId: true } },
    saves: { where: { userId: meId }, select: { userId: true } },
  } satisfies Prisma.PostInclude;
}

type PostRecord = Prisma.PostGetPayload<{ include: ReturnType<typeof postInclude> }>;

export function toPost(p: PostRecord): Post {
  return {
    id: p.id,
    author: toAuthor(p.author),
    sessionId: p.sessionId,
    subjectId: p.subjectId,
    type: p.type,
    title: p.title,
    content: p.content,
    mediaUrl: p.mediaUrl,
    mediaDurationSec: p.mediaDurationSec,
    createdAt: p.createdAt.toISOString(),
    likeCount: p.baseLikeCount + p._count.likes,
    commentCount: p._count.comments,
    likedByMe: p.likes.length > 0,
    savedByMe: p.saves.length > 0,
  };
}

type CommentRow = Prisma.CommentGetPayload<{ include: { author: true } }>;

export function toCommentTree(rows: CommentRow[]): Comment[] {
  const byId = new Map<string, Comment>();
  for (const r of rows) {
    byId.set(r.id, {
      id: r.id,
      postId: r.postId,
      author: toAuthor(r.author),
      parentId: r.parentId,
      content: r.content,
      createdAt: r.createdAt.toISOString(),
      replies: [],
    });
  }
  const roots: Comment[] = [];
  for (const c of byId.values()) {
    const parent = c.parentId ? byId.get(c.parentId) : undefined;
    (parent ? parent.replies : roots).push(c);
  }
  return roots;
}
