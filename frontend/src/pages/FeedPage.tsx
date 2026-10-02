import { useState, type ElementType } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { Bookmark, Heart, MessageCircle, Mic, PenLine, Play, Video } from "lucide-react";
import { BRAND } from "@/domain/brand";
import { formatRecTime, relativeTime } from "@/domain/format";
import { DotAvatar } from "@/components/DotAvatar";
import { LoadingState } from "@/components/LoadingState";
import { ErrorMessage } from "@/components/ErrorMessage";
import { useServices } from "@/services/ServicesContext";
import { queryKeys } from "@/app/queryKeys";
import { applyPostUpdate } from "./postCache";
import type { Post, PostFilter, PostType, Subject } from "@/services/contracts";

const POST_TYPE_ICON: Record<PostType, ElementType> = { text: PenLine, audio: Mic, video: Video };

const AUDIO_WAVE_HEIGHTS = [40, 70, 50, 90, 60, 80, 45, 75, 55, 85, 65, 95, 50, 70, 40, 80, 60, 45];

function readTimeLabel(post: Post): string {
  if (post.type !== "text") return formatRecTime(post.mediaDurationSec ?? 0);
  const words = post.content.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min`;
}

function isDefaultFilter(f: PostFilter): boolean {
  return f.subjectId === undefined && !f.savedOnly;
}

export function FeedPage() {
  const services = useServices();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<PostFilter>({});

  const subjectsQuery = useQuery({ queryKey: queryKeys.subjects, queryFn: () => services.subjects.list() });
  const postsQuery = useInfiniteQuery({
    queryKey: queryKeys.posts(filter),
    queryFn: ({ pageParam }) => services.posts.list({ ...filter, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });

  const likeMutation = useMutation({
    mutationFn: (post: Post) => (post.likedByMe ? services.posts.unlike(post.id) : services.posts.like(post.id)),
    onSuccess: (post) => applyPostUpdate(queryClient, post),
  });
  const saveMutation = useMutation({
    mutationFn: (post: Post) => (post.savedByMe ? services.posts.unsave(post.id) : services.posts.save(post.id)),
    onSuccess: (post) => applyPostUpdate(queryClient, post),
  });

  if (subjectsQuery.isLoading || postsQuery.isLoading) return <LoadingState />;
  if (subjectsQuery.error)
    return <ErrorMessage error={subjectsQuery.error} onRetry={() => void subjectsQuery.refetch()} />;
  if (postsQuery.error) return <ErrorMessage error={postsQuery.error} onRetry={() => void postsQuery.refetch()} />;

  const subjects = subjectsQuery.data!;
  const posts = postsQuery.data!.pages.flatMap((p) => p.items);
  const subjectOf = (id: number | null): Subject | null =>
    id === null ? null : (subjects.find((s) => s.id === id) ?? null);

  return (
    <div className="p-8" style={{ maxWidth: 700, margin: "0 auto" }}>
      <div className="mb-7">
        <h1
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 900,
            fontSize: "1.85rem",
            color: "var(--foreground)",
          }}
        >
          Feed
        </h1>
        <p style={{ fontFamily: "Inter", fontSize: "0.83rem", color: "var(--muted-foreground)", marginTop: 4 }}>
          Artigos, áudios e vídeos publicados pela comunidade .study
        </p>
      </div>
      <div className="flex gap-2 mb-8 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        <button
          onClick={() => setFilter({})}
          className="px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all"
          style={{
            fontFamily: "Inter",
            fontWeight: 500,
            background: isDefaultFilter(filter) ? BRAND.dark : "var(--card)",
            color: isDefaultFilter(filter) ? "#F9FAFB" : "#6B7280",
            border: isDefaultFilter(filter) ? "none" : "1px solid var(--border)",
          }}
        >
          Todos
        </button>
        {subjects.map((s) => (
          <button
            key={s.id}
            onClick={() => setFilter({ subjectId: s.id })}
            className="px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all"
            style={{
              fontFamily: "Inter",
              fontWeight: 500,
              background: filter.subjectId === s.id ? s.color : "var(--card)",
              color: filter.subjectId === s.id ? BRAND.dark : "#6B7280",
              border: filter.subjectId === s.id ? "none" : "1px solid var(--border)",
            }}
          >
            {s.name}
          </button>
        ))}
        <button
          onClick={() => setFilter({ savedOnly: true })}
          className="px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all"
          style={{
            fontFamily: "Inter",
            fontWeight: 500,
            background: filter.savedOnly ? BRAND.purple : "var(--card)",
            color: filter.savedOnly ? BRAND.dark : "#6B7280",
            border: filter.savedOnly ? "none" : "1px solid var(--border)",
          }}
        >
          Salvos
        </button>
      </div>
      {posts.length === 0 ? (
        <p
          style={{
            fontFamily: "Inter",
            fontSize: "0.85rem",
            color: "var(--muted-foreground)",
            textAlign: "center",
            padding: "2.5rem 0",
          }}
        >
          {filter.savedOnly ? "Você ainda não salvou nenhum post." : "Nenhum post encontrado."}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post) => {
            const subject = subjectOf(post.subjectId);
            const TypeIcon = POST_TYPE_ICON[post.type];
            const waveColor = subject?.color ?? BRAND.dark;
            return (
              <article
                key={post.id}
                onClick={() => navigate(`/feed/${post.id}`)}
                className="rounded-2xl p-6 bg-card transition-all hover:shadow-md cursor-pointer"
                style={{ border: "1px solid var(--border)" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <DotAvatar color={post.author.dotColor} accessory={post.author.activeAccessoryId} size={40} />
                    <div>
                      <div
                        style={{
                          fontFamily: "Inter",
                          fontWeight: 600,
                          fontSize: "0.88rem",
                          color: "var(--foreground)",
                        }}
                      >
                        {post.author.name}
                      </div>
                      <div style={{ fontFamily: "Inter", fontSize: "0.72rem", color: "var(--muted-foreground)" }}>
                        {relativeTime(post.createdAt)} · {readTimeLabel(post)} de leitura
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="flex items-center justify-center w-7 h-7 rounded-lg"
                      style={{ background: "var(--input)", color: "var(--muted-foreground)" }}
                    >
                      <TypeIcon size={14} />
                    </span>
                    {subject && (
                      <span
                        className="px-2.5 py-1 rounded-lg text-xs"
                        style={{
                          background: `${subject.color}18`,
                          color: subject.color,
                          fontFamily: "Inter",
                          fontWeight: 600,
                        }}
                      >
                        {subject.name}
                      </span>
                    )}
                  </div>
                </div>
                <h3
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    color: "var(--foreground)",
                    marginBottom: 8,
                    lineHeight: 1.3,
                  }}
                >
                  {post.title}
                </h3>
                {post.type === "audio" ? (
                  <div
                    className="flex items-center gap-3 py-3 px-4 rounded-xl"
                    style={{ background: `${waveColor}10` }}
                  >
                    <div className="flex items-center gap-0.5" style={{ height: 28 }}>
                      {AUDIO_WAVE_HEIGHTS.map((h, i) => (
                        <div
                          key={i}
                          className="w-1 rounded-full"
                          style={{ height: `${h}%`, background: waveColor, opacity: 0.65 }}
                        />
                      ))}
                    </div>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "0.78rem",
                        color: waveColor,
                        fontWeight: 700,
                      }}
                    >
                      {readTimeLabel(post)}
                    </span>
                    <span
                      style={{ fontFamily: "Inter", fontSize: "0.78rem", color: "var(--muted-foreground)", flex: 1 }}
                    >
                      {post.content.slice(0, 200)}
                    </span>
                  </div>
                ) : post.type === "video" ? (
                  <div
                    className="flex items-center gap-3 py-3 px-4 rounded-xl overflow-hidden"
                    style={{ background: `${waveColor}10` }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ background: `${waveColor}22` }}
                    >
                      <Play size={16} fill={waveColor} color={waveColor} />
                    </div>
                    <div>
                      <p
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "0.78rem",
                          color: "var(--foreground)",
                          fontWeight: 700,
                        }}
                      >
                        {readTimeLabel(post)}
                      </p>
                      <p style={{ fontFamily: "Inter", fontSize: "0.72rem", color: "var(--muted-foreground)" }}>
                        {post.content.slice(0, 200)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p
                    style={{
                      fontFamily: "Inter",
                      fontSize: "0.84rem",
                      color: "var(--muted-foreground)",
                      lineHeight: 1.7,
                    }}
                  >
                    {post.content.slice(0, 200)}
                  </p>
                )}
                <div className="flex items-center gap-5 mt-5 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                  <button
                    aria-label={post.likedByMe ? "Descurtir" : "Curtir"}
                    onClick={(e) => {
                      e.stopPropagation();
                      likeMutation.mutate(post);
                    }}
                    className="flex items-center gap-2 transition-transform hover:scale-110"
                  >
                    <Heart
                      size={16}
                      fill={post.likedByMe ? BRAND.red : "none"}
                      color={post.likedByMe ? BRAND.red : "#9CA3AF"}
                    />
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "0.78rem",
                        color: post.likedByMe ? BRAND.red : "#9CA3AF",
                      }}
                    >
                      {post.likeCount}
                    </span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/feed/${post.id}`);
                    }}
                    className="flex items-center gap-2 transition-transform hover:scale-110"
                  >
                    <MessageCircle size={16} color="#9CA3AF" />
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "0.78rem",
                        color: "var(--muted-foreground)",
                      }}
                    >
                      {post.commentCount}
                    </span>
                  </button>
                  <button
                    aria-label={post.savedByMe ? "Remover dos salvos" : "Salvar"}
                    onClick={(e) => {
                      e.stopPropagation();
                      saveMutation.mutate(post);
                    }}
                    className="ml-auto transition-transform hover:scale-110"
                  >
                    <Bookmark
                      size={16}
                      fill={post.savedByMe ? BRAND.purple : "none"}
                      color={post.savedByMe ? BRAND.purple : "#9CA3AF"}
                    />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {postsQuery.hasNextPage && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => void postsQuery.fetchNextPage()}
            disabled={postsQuery.isFetchingNextPage}
            className="px-5 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80 bg-muted text-foreground disabled:opacity-50"
            style={{ fontFamily: "Inter" }}
          >
            {postsQuery.isFetchingNextPage ? "Carregando…" : "Carregar mais"}
          </button>
        </div>
      )}
    </div>
  );
}
