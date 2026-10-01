import type { Comment, CoinReward, Page, Post, PostService } from "@/services/contracts";
import type { HttpClient } from "./http";

export function createApiPostService(http: HttpClient): PostService {
  const p = (id: string) => `/posts/${encodeURIComponent(id)}`;
  return {
    list: (filter = {}) =>
      http.request<Page<Post>>("GET", "/posts", {
        query: {
          subjectId: filter.subjectId,
          type: filter.type,
          savedOnly: filter.savedOnly || undefined,
          cursor: filter.cursor,
          limit: filter.limit,
        },
      }),
    get: (id) => http.request<Post>("GET", p(id)),
    create: (input) => http.request<{ post: Post; reward: CoinReward | null }>("POST", "/posts", { body: input }),
    like: (id) => http.request<Post>("POST", `${p(id)}/like`),
    unlike: (id) => http.request<Post>("DELETE", `${p(id)}/like`),
    save: (id) => http.request<Post>("POST", `${p(id)}/save`),
    unsave: (id) => http.request<Post>("DELETE", `${p(id)}/save`),
    listComments: (postId) => http.request<Comment[]>("GET", `${p(postId)}/comments`),
    addComment: (postId, input) => http.request<Comment>("POST", `${p(postId)}/comments`, { body: input }),
  };
}
