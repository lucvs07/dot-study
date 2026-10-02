import type { PostFilter } from "@/services/contracts";

export const queryKeys = {
  me: ["me"],
  stats: ["stats"],
  subjects: ["subjects"],
  sessions: ["sessions"],
  posts: (f: PostFilter) => ["posts", f],
  post: (id: string) => ["post", id],
  comments: (id: string) => ["comments", id],
  ranking: (subjectId: number) => ["ranking", subjectId],
  accessories: ["accessories"],
} as const;
