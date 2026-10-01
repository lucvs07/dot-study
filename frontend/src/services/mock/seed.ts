import type { StudySession } from "@dot-study/shared/contracts";
import { ACCESSORIES, DEMO_USER, SUBJECTS } from "@dot-study/shared/catalog";
import { DEMO_DATASET } from "@dot-study/shared/demo";
import type { CommentRecord, DbState, PostRecord, UserRecord } from "./db";

export { SUBJECTS, ACCESSORIES, DEMO_USER };

/** Hash SHA-256 (hex) — é mock, mas a senha não fica em texto puro no navegador. */
export async function hashPassword(email: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(`dotstudy:${email.trim().toLowerCase()}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Hash pré-calculado de DEMO_USER (hashPassword("demo@dotstudy.app", "dotstudy123")).
// O teste de auth (Task 5) confere que este valor bate com hashPassword.
export const DEMO_PASSWORD_HASH = "999ce4586f06f6f721ebca3eee099d952587ff21b8ea1415f2d8f03895963b77";

export function buildSeed(now: number = Date.now()): DbState {
  const iso = (msAgo: number) => new Date(now - msAgo).toISOString();
  const demoId = DEMO_DATASET.demoUserId;

  const users: UserRecord[] = [
    {
      id: demoId,
      name: DEMO_USER.name,
      email: DEMO_USER.email,
      passwordHash: DEMO_PASSWORD_HASH,
      coins: DEMO_DATASET.demoUser.coins,
      dotColor: DEMO_DATASET.demoUser.dotColor,
      activeAccessoryId: null,
      unlockedAccessoryIds: [...DEMO_DATASET.demoUser.unlockedAccessoryIds],
      createdAt: iso(DEMO_DATASET.demoUser.createdMsAgo),
    },
    ...DEMO_DATASET.community.map((c) => ({
      id: c.id,
      name: c.name,
      email: `${c.id.slice(2)}@exemplo.dotstudy.app`,
      passwordHash: "seed-sem-login",
      coins: 0,
      dotColor: c.dotColor,
      activeAccessoryId: c.accessory,
      unlockedAccessoryIds: c.accessory ? [c.accessory] : [],
      createdAt: iso(DEMO_DATASET.communityCreatedMsAgo),
    })),
  ];

  const sessions: StudySession[] = DEMO_DATASET.sessions.map((s): StudySession => {
    const theme = s.subjectId ? (SUBJECTS[s.subjectId - 1].themes.find((t) => t.title === s.themeTitle) ?? null) : null;
    return {
      id: s.id,
      userId: s.userId,
      mode: s.subjectId ? "challenge" : "free",
      subjectId: s.subjectId,
      themeId: theme?.id ?? null,
      label: s.subjectId ? null : s.themeTitle,
      focusMinutes: s.focusMinutes,
      breakMinutes: s.subjectId ? 0 : 5,
      plannedCycles: s.cycles,
      completedCycles: s.cycles,
      notes: "",
      status: "completed",
      startedAt: iso(s.msAgo + s.focusMinutes * s.cycles * 60_000),
      lastCycleAt: iso(s.msAgo),
      finishedAt: iso(s.msAgo),
      rewardedPostId: null,
    };
  });

  const posts: PostRecord[] = DEMO_DATASET.posts.map((p) => ({
    id: p.id,
    authorId: p.authorId,
    sessionId: null,
    subjectId: p.subjectId,
    type: p.type,
    title: p.title,
    content: p.content,
    mediaUrl: null,
    mediaDurationSec: p.mediaDurationSec,
    createdAt: iso(p.msAgo),
    seedLikeCount: p.baseLikeCount,
  }));

  const comments: CommentRecord[] = DEMO_DATASET.comments.map((c) => ({
    id: c.id,
    postId: c.postId,
    authorId: c.authorId,
    parentId: c.parentId,
    content: c.content,
    createdAt: iso(c.msAgo),
  }));

  return {
    version: 1,
    currentUserId: null,
    users,
    sessions,
    posts,
    comments,
    likes: DEMO_DATASET.likes.map((l) => ({ ...l })),
    saves: DEMO_DATASET.saves.map((s) => ({ ...s })),
    transactions: [],
  };
}
