import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate, useParams } from "react-router";
import { ArrowLeft, Bookmark, Heart, MessageCircle, Play, Send } from "lucide-react";
import { BRAND } from "@/domain/brand";
import { formatRecTime, relativeTime } from "@/domain/format";
import { DotAvatar } from "@/components/DotAvatar";
import { LoadingState } from "@/components/LoadingState";
import { ErrorMessage } from "@/components/ErrorMessage";
import { useMediaUrl } from "@/hooks/useMediaUrl";
import { useCurrentUser } from "@/hooks/useAuth";
import { useServices } from "@/services/ServicesContext";
import { queryKeys } from "@/app/queryKeys";
import { applyPostUpdate } from "./postCache";
import type { Comment } from "@/services/contracts";

const AUDIO_WAVE_HEIGHTS = [40, 70, 50, 90, 60, 80, 45, 75, 55, 85, 65, 95, 50, 70, 40, 80, 60, 45];

function CommentItem({
  comment,
  depth = 0,
  replyingTo,
  replyText,
  onReplyTextChange,
  onStartReply,
  onSubmitReply,
}: {
  comment: Comment;
  depth?: number;
  replyingTo: string | null;
  replyText: string;
  onReplyTextChange: (text: string) => void;
  onStartReply: (id: string | null) => void;
  onSubmitReply: (parentId: string) => void;
}) {
  return (
    <div>
      <div className="flex gap-3">
        <DotAvatar
          color={comment.author.dotColor}
          accessory={comment.author.activeAccessoryId}
          size={depth > 0 ? 28 : 36}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              style={{
                fontFamily: "Inter",
                fontWeight: 600,
                fontSize: depth > 0 ? "0.78rem" : "0.84rem",
                color: "var(--foreground)",
              }}
            >
              {comment.author.name}
            </span>
            <span
              style={{
                fontFamily: "Inter",
                fontSize: depth > 0 ? "0.68rem" : "0.72rem",
                color: "var(--muted-foreground)",
              }}
            >
              {relativeTime(comment.createdAt)}
            </span>
          </div>
          <p
            style={{
              fontFamily: "Inter",
              fontSize: depth > 0 ? "0.78rem" : "0.84rem",
              color: "var(--foreground)",
              lineHeight: 1.6,
            }}
          >
            {comment.content}
          </p>
          {depth === 0 && (
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => onStartReply(replyingTo === comment.id ? null : comment.id)}
                style={{
                  fontFamily: "Inter",
                  fontSize: "0.75rem",
                  color: "var(--muted-foreground)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Responder
              </button>
            </div>
          )}
          {depth === 0 && replyingTo === comment.id && (
            <div className="flex gap-2 mt-3">
              <input
                value={replyText}
                onChange={(e) => onReplyTextChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSubmitReply(comment.id)}
                placeholder="Escreva uma resposta…"
                className="flex-1 rounded-xl px-3 py-2 outline-none text-sm"
                style={{
                  background: "var(--input)",
                  border: "1px solid var(--border)",
                  fontFamily: "Inter",
                  color: "var(--foreground)",
                }}
              />
              <button
                aria-label="Enviar resposta"
                onClick={() => onSubmitReply(comment.id)}
                disabled={!replyText.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                style={{ background: "var(--foreground)" }}
              >
                <Send size={14} color="var(--background)" />
              </button>
            </div>
          )}
          {comment.replies.length > 0 && (
            <div className="flex flex-col gap-3 mt-3 pl-10">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  depth={depth + 1}
                  replyingTo={replyingTo}
                  replyText={replyText}
                  onReplyTextChange={onReplyTextChange}
                  onStartReply={onStartReply}
                  onSubmitReply={onSubmitReply}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function PostPage() {
  const { postId = "" } = useParams();
  const services = useServices();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const user = useCurrentUser();
  // Moedas ganhas ao publicar (vêm do estudo via estado da navegação).
  const coinsEarned = (location.state as { coinsEarned?: number } | null)?.coinsEarned ?? 0;

  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const postQuery = useQuery({ queryKey: queryKeys.post(postId), queryFn: () => services.posts.get(postId) });
  const commentsQuery = useQuery({
    queryKey: queryKeys.comments(postId),
    queryFn: () => services.posts.listComments(postId),
  });
  const subjectsQuery = useQuery({ queryKey: queryKeys.subjects, queryFn: () => services.subjects.list() });

  const { src, error: mediaError } = useMediaUrl(postQuery.data?.mediaUrl ?? null);

  const likeMutation = useMutation({
    mutationFn: () => {
      const post = postQuery.data!;
      return post.likedByMe ? services.posts.unlike(post.id) : services.posts.like(post.id);
    },
    onSuccess: (post) => applyPostUpdate(queryClient, post),
  });
  const saveMutation = useMutation({
    mutationFn: () => {
      const post = postQuery.data!;
      return post.savedByMe ? services.posts.unsave(post.id) : services.posts.save(post.id);
    },
    onSuccess: (post) => applyPostUpdate(queryClient, post),
  });

  const commentMutation = useMutation({
    mutationFn: (input: { content: string; parentId?: string | null }) => services.posts.addComment(postId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.comments(postId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.post(postId) });
    },
  });

  if (postQuery.isLoading || commentsQuery.isLoading || subjectsQuery.isLoading) return <LoadingState />;
  if (postQuery.error) return <ErrorMessage error={postQuery.error} onRetry={() => void postQuery.refetch()} />;
  if (commentsQuery.error)
    return <ErrorMessage error={commentsQuery.error} onRetry={() => void commentsQuery.refetch()} />;
  if (subjectsQuery.error)
    return <ErrorMessage error={subjectsQuery.error} onRetry={() => void subjectsQuery.refetch()} />;

  const post = postQuery.data!;
  const comments = commentsQuery.data!;
  const subject = post.subjectId !== null ? (subjectsQuery.data!.find((s) => s.id === post.subjectId) ?? null) : null;
  const waveColor = subject?.color ?? BRAND.dark;

  const submitComment = () => {
    const content = newComment.trim();
    if (!content) return;
    commentMutation.mutate({ content }, { onSuccess: () => setNewComment("") });
  };

  const submitReply = (parentId: string) => {
    const content = replyText.trim();
    if (!content) return;
    commentMutation.mutate(
      { content, parentId },
      {
        onSuccess: () => {
          setReplyText("");
          setReplyingTo(null);
        },
      },
    );
  };

  return (
    <div className="p-6 pb-28" style={{ maxWidth: 700, margin: "0 auto" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-card hover:bg-muted transition-colors"
          style={{ border: "1px solid var(--border)" }}
        >
          <ArrowLeft size={20} color="var(--foreground)" />
        </button>
        {subject && (
          <span
            className="px-3 py-1 rounded-lg text-xs font-semibold"
            style={{ background: `${subject.color}18`, color: subject.color, fontFamily: "Inter" }}
          >
            {subject.name}
          </span>
        )}
        <button
          aria-label={post.savedByMe ? "Remover dos salvos" : "Salvar"}
          onClick={() => saveMutation.mutate()}
          className="ml-auto transition-transform hover:scale-110"
        >
          <Bookmark
            size={18}
            fill={post.savedByMe ? BRAND.purple : "none"}
            color={post.savedByMe ? BRAND.purple : "var(--muted-foreground)"}
          />
        </button>
      </div>

      {coinsEarned > 0 && (
        <div
          role="status"
          className="rounded-2xl px-4 py-3 mb-6 flex items-center gap-2"
          style={{ background: `${BRAND.green}14`, border: `1px solid ${BRAND.green}40` }}
        >
          <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: BRAND.green }}>
            Post publicado!
          </span>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: BRAND.yellow }}>
            +{coinsEarned} moedas
          </span>
        </div>
      )}

      {/* Post body */}
      <div className="bg-card rounded-2xl p-6 mb-6" style={{ border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3 mb-4">
          <DotAvatar color={post.author.dotColor} accessory={post.author.activeAccessoryId} size={44} />
          <div>
            <p style={{ fontFamily: "Inter", fontWeight: 600, fontSize: "0.9rem", color: "var(--foreground)" }}>
              {post.author.name}
            </p>
            <p style={{ fontFamily: "Inter", fontSize: "0.72rem", color: "var(--muted-foreground)" }}>
              {relativeTime(post.createdAt)}
            </p>
          </div>
        </div>
        <h1
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            fontSize: "1.4rem",
            color: "var(--foreground)",
            lineHeight: 1.3,
            marginBottom: 16,
          }}
        >
          {post.title}
        </h1>

        {post.type === "text" ? (
          <p
            style={{
              fontFamily: "Inter",
              fontSize: "0.9rem",
              color: "var(--muted-foreground)",
              lineHeight: 1.75,
              marginBottom: 16,
            }}
          >
            {post.content}
          </p>
        ) : post.mediaUrl ? (
          mediaError ? (
            <p style={{ fontFamily: "Inter", fontSize: "0.82rem", color: "var(--muted-foreground)", marginBottom: 16 }}>
              {post.mediaUrl.startsWith("idb://")
                ? "Esta mídia foi gravada em outro navegador e não está disponível aqui."
                : "Não foi possível carregar a mídia. Tente de novo mais tarde."}
            </p>
          ) : post.type === "audio" ? (
            <audio controls src={src ?? undefined} className="w-full mb-4" />
          ) : (
            <video
              controls
              playsInline
              src={src ?? undefined}
              className="w-full rounded-xl mb-4"
              style={{ aspectRatio: "16/9", background: "var(--foreground)" }}
            />
          )
        ) : post.type === "audio" ? (
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex items-center gap-3 py-3 px-4 rounded-xl" style={{ background: `${waveColor}10` }}>
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
                  fontSize: "0.82rem",
                  color: waveColor,
                  fontWeight: 700,
                }}
              >
                {formatRecTime(post.mediaDurationSec ?? 0)}
              </span>
              <span style={{ fontFamily: "Inter", fontSize: "0.82rem", color: "var(--muted-foreground)", flex: 1 }}>
                {post.content}
              </span>
            </div>
            <span style={{ fontFamily: "Inter", fontSize: "0.72rem", color: "var(--muted-foreground)" }}>
              Mídia de exemplo
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mb-4">
            <div
              className="w-full rounded-xl flex items-center justify-center"
              style={{ aspectRatio: "16/9", background: "var(--foreground)" }}
            >
              <div className="flex flex-col items-center gap-3 opacity-40">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.15)" }}
                >
                  <Play size={24} fill="white" color="white" />
                </div>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.78rem",
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  {formatRecTime(post.mediaDurationSec ?? 0)}
                </span>
              </div>
            </div>
            <span style={{ fontFamily: "Inter", fontSize: "0.72rem", color: "var(--muted-foreground)" }}>
              Mídia de exemplo
            </span>
          </div>
        )}

        <div className="flex items-center gap-5 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <button
            aria-label={post.likedByMe ? "Descurtir" : "Curtir"}
            onClick={() => likeMutation.mutate()}
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
          <div className="flex items-center gap-2">
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
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="mb-6">
        <h2
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            fontSize: "1rem",
            color: "var(--foreground)",
            marginBottom: 16,
          }}
        >
          Comentários ({comments.length})
        </h2>
        {comments.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <MessageCircle size={32} color="var(--muted-foreground)" />
            <p style={{ fontFamily: "Inter", fontSize: "0.84rem", color: "var(--muted-foreground)" }}>
              Seja o primeiro a comentar
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                replyingTo={replyingTo}
                replyText={replyText}
                onReplyTextChange={setReplyText}
                onStartReply={(id) => {
                  setReplyingTo(id);
                  setReplyText("");
                }}
                onSubmitReply={submitReply}
              />
            ))}
          </div>
        )}
      </div>

      {commentMutation.error != null && (
        <div className="mb-4">
          <ErrorMessage error={commentMutation.error} />
        </div>
      )}

      {/* New comment input */}
      <div className="flex gap-3 items-center pt-4" style={{ borderTop: "1px solid var(--border)" }}>
        <DotAvatar color={user.dotColor} accessory={user.activeAccessoryId} size={32} />
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitComment()}
          placeholder="Escreva um comentário…"
          className="flex-1 rounded-xl px-4 py-2.5 outline-none text-sm"
          style={{
            background: "var(--input)",
            border: "1px solid var(--border)",
            fontFamily: "Inter",
            color: "var(--foreground)",
          }}
        />
        <button
          aria-label="Enviar"
          onClick={submitComment}
          disabled={!newComment.trim()}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
          style={{ background: user.dotColor }}
        >
          <Send size={16} color="#111827" />
        </button>
      </div>
    </div>
  );
}
