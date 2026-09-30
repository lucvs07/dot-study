import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/app/queryKeys";
import type { Page, Post, PostFilter } from "@/services/contracts";

/**
 * Aplica no cache do React Query o `Post` retornado por like/unlike/save/unsave:
 * atualiza `["post", id]` e cada página de `["posts", filter]` já montada. Numa lista
 * filtrada por `savedOnly: true`, um post que deixou de estar salvo é removido na hora
 * (sem esperar refetch); se um post passou a estar salvo, invalida a lista de salvos
 * para que ele apareça nela na próxima vez que for aberta/recarregada.
 */
export function applyPostUpdate(queryClient: QueryClient, post: Post): void {
  for (const query of queryClient.getQueryCache().findAll({ queryKey: ["posts"] })) {
    const filter = (query.queryKey[1] as PostFilter | undefined) ?? {};
    queryClient.setQueryData<InfiniteData<Page<Post>>>(query.queryKey, (old) => {
      if (!old) return old;
      const removeFromList = filter.savedOnly === true && !post.savedByMe;
      return {
        ...old,
        pages: old.pages.map((p) => ({
          ...p,
          items: removeFromList
            ? p.items.filter((it) => it.id !== post.id)
            : p.items.map((it) => (it.id === post.id ? post : it)),
        })),
      };
    });
  }
  queryClient.setQueryData(queryKeys.post(post.id), post);
  if (post.savedByMe) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.posts({ savedOnly: true }) });
  }
}
