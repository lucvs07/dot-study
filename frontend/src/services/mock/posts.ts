import { MEDIA_LIMITS, ServiceError, type Comment, type Post, type PostService } from "@/services/contracts";
import { COINS } from "@/domain/rules";
import { addCoins, findCurrentUser, requireUser, toAuthor, type MockContext } from "./context";
import type { CommentRecord, DbState, PostRecord } from "./db";
import { newId } from "./latency";

function cursorOf(p: PostRecord) {
  return `${p.createdAt}|${p.id}`;
}

function toPost(state: DbState, p: PostRecord, meId: string | null): Post {
  const author = state.users.find((u) => u.id === p.authorId)!;
  const likes = state.likes.filter((l) => l.postId === p.id);
  return {
    id: p.id,
    author: toAuthor(author),
    sessionId: p.sessionId,
    subjectId: p.subjectId,
    type: p.type,
    title: p.title,
    content: p.content,
    mediaUrl: p.mediaUrl,
    mediaDurationSec: p.mediaDurationSec,
    createdAt: p.createdAt,
    likeCount: p.seedLikeCount + likes.length,
    commentCount: state.comments.filter((c) => c.postId === p.id).length,
    likedByMe: likes.some((l) => l.userId === meId),
    savedByMe: state.saves.some((s) => s.postId === p.id && s.userId === meId),
  };
}

function findPost(state: DbState, id: string): PostRecord {
  const post = state.posts.find((p) => p.id === id);
  if (!post) throw new ServiceError("NOT_FOUND", "Post não encontrado.");
  return post;
}

function buildTree(state: DbState, records: CommentRecord[]): Comment[] {
  const byId = new Map<string, Comment>();
  for (const r of records) {
    const author = state.users.find((u) => u.id === r.authorId)!;
    byId.set(r.id, {
      id: r.id,
      postId: r.postId,
      author: toAuthor(author),
      parentId: r.parentId,
      content: r.content,
      createdAt: r.createdAt,
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

export function createPostService(ctx: MockContext): PostService {
  const nowIso = () => new Date(ctx.now()).toISOString();

  const toggle = async (id: string, list: "likes" | "saves", on: boolean): Promise<Post> => {
    await ctx.wait();
    return ctx.db.write((draft) => {
      const me = requireUser(draft);
      const post = findPost(draft, id);
      draft[list] = draft[list].filter((x) => !(x.postId === id && x.userId === me.id));
      if (on) draft[list].push({ userId: me.id, postId: id });
      return toPost(draft, post, me.id);
    });
  };

  return {
    async list(filter = {}) {
      await ctx.wait();
      const state = ctx.db.read();
      const me = requireUser(state);
      const limit = Math.min(Math.max(filter.limit ?? 10, 1), 50);
      const sorted = state.posts
        .filter((p) => filter.subjectId === undefined || p.subjectId === filter.subjectId)
        .filter((p) => filter.type === undefined || p.type === filter.type)
        .filter((p) => !filter.savedOnly || state.saves.some((s) => s.postId === p.id && s.userId === me.id))
        .sort((a, b) => cursorOf(b).localeCompare(cursorOf(a)));
      const start = filter.cursor ? sorted.findIndex((p) => cursorOf(p) < filter.cursor!) : 0;
      const slice = start < 0 ? [] : sorted.slice(start, start + limit);
      const hasMore = start >= 0 && start + limit < sorted.length;
      return {
        items: slice.map((p) => toPost(state, p, me.id)),
        nextCursor: hasMore ? cursorOf(slice[slice.length - 1]) : null,
      };
    },

    async get(id) {
      await ctx.wait();
      const state = ctx.db.read();
      return toPost(state, findPost(state, id), findCurrentUser(state)?.id ?? null);
    },

    async create(input) {
      await ctx.wait();
      const title = input.title.trim();
      if (title.length < 3 || title.length > 120)
        throw new ServiceError("VALIDATION", "O título precisa ter entre 3 e 120 caracteres.");
      if (input.content.length > 20_000)
        throw new ServiceError("VALIDATION", "O texto passou do limite de 20 mil caracteres.");
      if (input.type !== "text") {
        if (!input.mediaUrl || !input.mediaDurationSec)
          throw new ServiceError("VALIDATION", "Grave ou envie a mídia antes de publicar.");
        if (input.mediaDurationSec > MEDIA_LIMITS[input.type].maxSeconds) {
          throw new ServiceError("MEDIA_TOO_LONG", "A mídia passou do tempo máximo permitido.");
        }
      }
      return ctx.db.write((draft) => {
        const me = requireUser(draft);
        const session = input.sessionId
          ? draft.sessions.find((s) => s.id === input.sessionId && s.userId === me.id)
          : undefined;
        if (input.sessionId && !session) throw new ServiceError("NOT_FOUND", "Sessão não encontrada.");
        const record: PostRecord = {
          id: newId("p"),
          authorId: me.id,
          sessionId: session?.id ?? null,
          subjectId: session?.subjectId ?? null,
          type: input.type,
          title,
          content: input.content.trim(),
          mediaUrl: input.type === "text" ? null : input.mediaUrl!,
          mediaDurationSec: input.type === "text" ? null : input.mediaDurationSec!,
          createdAt: nowIso(),
          seedLikeCount: 0,
        };
        draft.posts.push(record);
        let reward = null;
        if (session && session.completedCycles > 0 && session.rewardedPostId === null) {
          session.rewardedPostId = record.id;
          reward = {
            coinsEarned: COINS.post,
            balance: addCoins(draft, me.id, COINS.post, "post", record.id, nowIso()),
          };
        }
        return { post: toPost(draft, record, me.id), reward };
      });
    },

    like: (id) => toggle(id, "likes", true),
    unlike: (id) => toggle(id, "likes", false),
    save: (id) => toggle(id, "saves", true),
    unsave: (id) => toggle(id, "saves", false),

    async listComments(postId) {
      await ctx.wait();
      const state = ctx.db.read();
      findPost(state, postId);
      const records = state.comments
        .filter((c) => c.postId === postId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return buildTree(state, records);
    },

    async addComment(postId, { content, parentId = null }) {
      await ctx.wait();
      const text = content.trim();
      if (!text || text.length > 2000)
        throw new ServiceError("VALIDATION", "Escreva um comentário de até 2000 caracteres.");
      return ctx.db.write((draft) => {
        const me = requireUser(draft);
        findPost(draft, postId);
        if (parentId && !draft.comments.some((c) => c.id === parentId && c.postId === postId)) {
          throw new ServiceError("NOT_FOUND", "Comentário não encontrado.");
        }
        const record: CommentRecord = {
          id: newId("c"),
          postId,
          authorId: me.id,
          parentId,
          content: text,
          createdAt: nowIso(),
        };
        draft.comments.push(record);
        return buildTree(draft, [record])[0];
      });
    },
  };
}
