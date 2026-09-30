/* eslint-disable react-refresh/only-export-components -- LEGADO: removido na Task 15 (exporta views, hook e ROUTE_OF) */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Navigate, useNavigate } from "react-router";
import {
  Play,
  Pause,
  Heart,
  MessageCircle,
  Bookmark,
  Lock,
  Check,
  PenLine,
  Mic,
  Square,
  Video,
  Send,
  ArrowLeft,
  Sigma,
  Atom,
  Hourglass,
  PenTool,
  Code,
  Coffee,
  Hexagon,
  Moon,
  Sun,
  User,
  Globe,
  Mail,
  KeyRound,
  UserCog,
  LogOut,
  Trash2,
} from "lucide-react";
import { BRAND, DOT_COLORS } from "@/domain/brand";
import { formatRecTime } from "@/domain/format";
import { DotAvatar } from "@/components/DotAvatar";
import { AudioWave } from "@/components/AudioWave";
import { useCurrentUser } from "@/hooks/useAuth";
import { applyTheme, readTheme } from "./providers";

// ── Types ──────────────────────────────────────────────────────────────────

export type View = "dashboard" | "timer" | "feed" | "ranking" | "history" | "shop" | "settings" | "post-detail";
type PostType = "text" | "audio" | "video";

type Comment = {
  id: number;
  author: string;
  dotColor: string;
  accessory: string | null;
  text: string;
  date: string;
  likes: number;
  likedByMe: boolean;
  replies: Comment[];
};

export type FeedArticle = {
  id: number;
  author: string;
  dotColor: string;
  accessory: string | null;
  subject: string;
  subjectColor: string;
  title: string;
  excerpt: string;
  readTime: string;
  likes: number;
  comments: number;
  savedByMe: boolean;
  likedByMe: boolean;
  date: string;
  postType?: PostType;
};

// ── Data ──────────────────────────────────────────────────────────────────

const SUBJECTS = [
  { id: 1, name: "Matemática", icon: Sigma, color: BRAND.teal },
  { id: 2, name: "Física", icon: Atom, color: BRAND.yellow },
  { id: 3, name: "História", icon: Hourglass, color: BRAND.red },
  { id: 4, name: "Português", icon: PenTool, color: BRAND.purple },
  { id: 5, name: "Programação", icon: Code, color: BRAND.green },
];

const INITIAL_ARTICLES: FeedArticle[] = [
  {
    id: 1,
    author: "Ana Clara M.",
    dotColor: BRAND.purple,
    accessory: "hat",
    subject: "Matemática",
    subjectColor: BRAND.teal,
    title: "Como eu finalmente entendi Integrais",
    excerpt:
      "Depois de 3 semanas lutando com cálculo, encontrei uma abordagem visual que mudou tudo. O segredo estava em pensar geometricamente antes de algebricamente...",
    readTime: "5 min",
    likes: 47,
    comments: 12,
    savedByMe: false,
    likedByMe: false,
    date: "há 2h",
  },
  {
    id: 2,
    author: "Pedro Lima",
    dotColor: BRAND.teal,
    accessory: "glasses",
    subject: "Programação",
    subjectColor: BRAND.green,
    title: "Por que aprendi algoritmos antes de frameworks",
    excerpt:
      "Muita gente pula direto para React ou Django. Mas estudar algoritmos primeiro transformou minha forma de resolver problemas de verdade...",
    readTime: "8 min",
    likes: 89,
    comments: 23,
    savedByMe: true,
    likedByMe: true,
    date: "há 5h",
    postType: "text",
  },
  {
    id: 3,
    author: "Beatriz Santos",
    dotColor: BRAND.yellow,
    accessory: null,
    subject: "História",
    subjectColor: BRAND.red,
    title: "A Revolução Industrial e o que ela ainda nos ensina",
    excerpt: "Reflexões sobre os padrões que se repetem na era digital",
    readTime: "2:14",
    likes: 34,
    comments: 8,
    savedByMe: false,
    likedByMe: false,
    date: "há 1d",
    postType: "audio",
  },
  {
    id: 4,
    author: "Lucas Ferreira",
    dotColor: BRAND.green,
    accessory: "crown",
    subject: "Física",
    subjectColor: BRAND.yellow,
    title: "Eletromagnetismo desmistificado",
    excerpt: "Explicando campos e forças de forma visual e intuitiva",
    readTime: "1:08",
    likes: 62,
    comments: 17,
    savedByMe: false,
    likedByMe: true,
    date: "há 2d",
    postType: "video",
  },
];

const ACCESSORIES_LIST = [
  { id: "hat", name: "Chapéu de Formatura", cost: 500 },
  { id: "glasses", name: "Óculos Nerd", cost: 300 },
  { id: "crown", name: "Coroa Dourada", cost: 1200 },
  { id: "halo", name: "Auréola", cost: 800 },
  { id: "bow", name: "Laço Rosa", cost: 250 },
  { id: "horns", name: "Chifres", cost: 450 },
  { id: "bowler", name: "Chapéu Coco", cost: 600 },
  { id: "witch", name: "Chapéu de Bruxa", cost: 750 },
  { id: "party", name: "Chapéu de Festa", cost: 400 },
  { id: "shades", name: "Óculos Escuros", cost: 350 },
];

// ── PostPublisher ─────────────────────────────────────────────────────────

export type PublisherChallenge = {
  subject: { name: string; color: string; icon: React.ElementType };
  theme: string;
};

export function PostPublisher({
  challenge,
  coinsEarned,
  dotColor,
  activeAccessory,
  onPublish,
  onSkip,
}: {
  challenge: PublisherChallenge;
  /** Moedas ganhas no ciclo que acabou de ser concluído (vem do serviço). */
  coinsEarned: number;
  dotColor: string;
  activeAccessory: string | null;
  onPublish: (article: FeedArticle) => void;
  onSkip: () => void;
}) {
  const [postType, setPostType] = useState<PostType>("text");
  const [title, setTitle] = useState(`O que aprendi sobre ${challenge.theme}`);
  const [content, setContent] = useState("");

  // Shared recording state (audio & video)
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const [waveHeights, setWaveHeights] = useState(() => Array.from({ length: 20 }, () => 18));
  const playTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const maxRecTime = postType === "audio" ? 180 : 60;

  // Recording timer
  useEffect(() => {
    if (!isRecording) return;
    const iv = setInterval(() => {
      setRecTime((t) => {
        if (t + 1 >= maxRecTime) {
          setIsRecording(false);
          setHasRecording(true);
          return maxRecTime;
        }
        return t + 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [isRecording, maxRecTime]);

  // Waveform animation
  useEffect(() => {
    if (!isRecording) {
      if (!hasRecording) setWaveHeights(Array.from({ length: 20 }, () => 18));
      return;
    }
    const iv = setInterval(() => {
      setWaveHeights(Array.from({ length: 20 }, () => Math.floor(Math.random() * 72 + 14)));
    }, 120);
    return () => clearInterval(iv);
  }, [isRecording, hasRecording]);

  // Reset recording when switching type
  useEffect(() => {
    setIsRecording(false);
    setHasRecording(false);
    setIsPlaying(false);
    setRecTime(0);
    setWaveHeights(Array.from({ length: 20 }, () => 18));
  }, [postType]);

  const startPlay = () => {
    setIsPlaying(true);
    clearTimeout(playTimerRef.current);
    playTimerRef.current = setTimeout(() => setIsPlaying(false), recTime * 1000);
  };
  const stopPlay = () => {
    setIsPlaying(false);
    clearTimeout(playTimerRef.current);
  };
  const togglePlay = () => (isPlaying ? stopPlay() : startPlay());

  const stopRecording = () => {
    setIsRecording(false);
    setHasRecording(true);
  };
  const reRecord = () => {
    setIsRecording(false);
    setHasRecording(false);
    setIsPlaying(false);
    setRecTime(0);
    setWaveHeights(Array.from({ length: 20 }, () => 18));
  };

  const canPublish = postType === "text" ? title.trim().length >= 3 : hasRecording;

  const handlePublish = () => {
    let excerpt = "";
    let readTime = "1 min";
    if (postType === "text") {
      excerpt = content.trim().slice(0, 200) || `Aprendi sobre ${challenge.theme} durante esta sessão de estudo.`;
      const wc = content.split(" ").filter(Boolean).length;
      readTime = `${Math.max(1, Math.round(wc / 200))} min`;
    } else if (postType === "audio") {
      excerpt = `Reflexões sobre ${challenge.theme}`;
      readTime = formatRecTime(recTime);
    } else {
      excerpt = `Explicando ${challenge.theme}`;
      readTime = formatRecTime(recTime);
    }
    onPublish({
      id: Date.now(),
      author: "Guilherme",
      dotColor,
      accessory: activeAccessory,
      subject: challenge.subject.name,
      subjectColor: challenge.subject.color,
      title: title.trim() || challenge.theme,
      excerpt,
      readTime,
      likes: 0,
      comments: 0,
      savedByMe: false,
      likedByMe: false,
      date: "agora",
      postType,
    });
  };

  const accentColor = challenge.subject.color;
  const isDarkAccent = accentColor === BRAND.yellow;

  return (
    <div className="flex flex-col items-center gap-5 w-full py-8 px-6" style={{ maxWidth: 580, margin: "0 auto" }}>
      {/* Session complete header */}
      <div className="w-full rounded-2xl p-5" style={{ background: "var(--muted)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: `${BRAND.green}22` }}
            >
              <Check size={18} color={BRAND.green} strokeWidth={3} />
            </div>
            <div>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "1rem", color: BRAND.green }}>
                Sessão concluída! <span style={{ color: BRAND.yellow }}>+{coinsEarned} moedas</span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span style={{ color: accentColor }}>
                  <challenge.subject.icon size={16} />
                </span>
                <span style={{ fontFamily: "Inter", fontSize: "0.78rem", color: "var(--muted-foreground)" }}>
                  {challenge.subject.name}
                </span>
                <span style={{ color: "#4B5563" }}>·</span>
                <span
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 600,
                    fontSize: "0.88rem",
                    color: "var(--foreground)",
                  }}
                >
                  {challenge.theme}
                </span>
              </div>
            </div>
          </div>
          <DotAvatar color={dotColor} accessory={activeAccessory} size={48} />
        </div>
      </div>

      {/* Prompt */}
      <div className="w-full text-center">
        <p
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 900,
            fontSize: "1.3rem",
            color: "var(--foreground)",
          }}
        >
          Compartilhe o que você aprendeu
        </p>
        <p style={{ fontFamily: "Inter", fontSize: "0.82rem", color: "var(--muted-foreground)", marginTop: 4 }}>
          Publique no feed da comunidade — depois você vai para a pausa <Coffee size={14} className="inline ml-1" />
        </p>
      </div>

      {/* Format tabs */}
      <div className="flex w-full rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        {(["text", "audio", "video"] as PostType[]).map((t) => (
          <button
            key={t}
            onClick={() => setPostType(t)}
            className="flex-1 py-3 text-sm flex items-center justify-center gap-2 transition-colors"
            style={{
              fontFamily: "Inter",
              fontWeight: 600,
              background: postType === t ? accentColor : "var(--card)",
              color: postType === t ? (isDarkAccent ? "#92400E" : BRAND.dark) : "#6B7280",
              borderRight: t !== "video" ? "1px solid var(--border)" : "none",
            }}
          >
            {t === "text" && (
              <>
                <PenLine size={16} /> Artigo
              </>
            )}
            {t === "audio" && (
              <>
                <Mic size={15} /> Áudio
              </>
            )}
            {t === "video" && (
              <>
                <Video size={15} /> Vídeo
              </>
            )}
          </button>
        ))}
      </div>

      {/* ── TEXT FORMAT ── */}
      {postType === "text" && (
        <div
          className="w-full bg-card rounded-2xl p-5 flex flex-col gap-4"
          style={{ border: "1px solid var(--border)" }}
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do artigo"
            className="w-full rounded-xl px-4 py-3 outline-none"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              color: "var(--foreground)",
              background: "var(--muted)",
              border: "1px solid var(--border)",
            }}
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={7}
            placeholder={`Escreva sobre o que você aprendeu em ${challenge.theme}...\n\nCompartilhe insights, dificuldades superadas ou conexões que você fez com outros temas.`}
            className="resize-none rounded-xl p-4 outline-none w-full"
            style={{
              background: "var(--muted)",
              border: "1px solid var(--border)",
              fontFamily: "Inter",
              fontSize: "0.84rem",
              color: "var(--foreground)",
              lineHeight: 1.75,
            }}
          />
          <div className="flex justify-between items-center">
            <span style={{ fontFamily: "Inter", fontSize: "0.7rem", color: "var(--muted-foreground)" }}>
              {content.split(" ").filter(Boolean).length} palavras
            </span>
            <span
              style={{
                fontFamily: "Inter",
                fontSize: "0.7rem",
                color: title.trim().length >= 3 ? BRAND.green : "#9CA3AF",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {title.trim().length >= 3 ? (
                <>
                  <Check size={12} /> Pronto para publicar
                </>
              ) : (
                "Adicione um título para publicar"
              )}
            </span>
          </div>
        </div>
      )}

      {/* ── AUDIO FORMAT ── */}
      {postType === "audio" && (
        <div
          className="w-full bg-card rounded-2xl p-5 flex flex-col gap-4"
          style={{ border: "1px solid var(--border)" }}
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do áudio"
            className="w-full rounded-xl px-4 py-3 outline-none"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              color: "var(--foreground)",
              background: "var(--muted)",
              border: "1px solid var(--border)",
            }}
          />

          <div className="flex flex-col items-center gap-5 py-4">
            {/* Waveform */}
            <AudioWave
              heights={waveHeights}
              color={hasRecording ? accentColor : isRecording ? BRAND.red : "var(--muted-foreground)"}
              dim={hasRecording && isPlaying}
            />

            {/* Time counter */}
            <div className="flex items-center gap-3">
              {isRecording && (
                <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: BRAND.red }} />
              )}
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "1.8rem",
                  color: "var(--foreground)",
                  fontWeight: 700,
                }}
              >
                {formatRecTime(recTime)}
              </span>
              <span style={{ fontFamily: "Inter", fontSize: "0.7rem", color: "var(--muted-foreground)" }}>
                / {formatRecTime(maxRecTime)}
              </span>
            </div>

            {/* Controls */}
            {!hasRecording ? (
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={() => (isRecording ? stopRecording() : setIsRecording(true))}
                  className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-105"
                  style={{
                    background: isRecording ? BRAND.red : accentColor,
                    boxShadow: isRecording ? `0 0 0 8px ${BRAND.red}22` : "none",
                  }}
                >
                  {isRecording ? (
                    <Square size={20} fill="white" color="white" />
                  ) : (
                    <Mic size={22} color={isDarkAccent ? "#92400E" : BRAND.dark} />
                  )}
                </button>
                <p style={{ fontFamily: "Inter", fontSize: "0.72rem", color: isRecording ? BRAND.red : "#9CA3AF" }}>
                  {isRecording ? "Clique para parar" : "Clique para gravar"}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button
                  onClick={reRecord}
                  className="px-4 py-2 rounded-xl text-sm bg-card hover:bg-muted transition-colors"
                  style={{ fontFamily: "Inter", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
                >
                  Regravar
                </button>
                <button
                  onClick={togglePlay}
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105"
                  style={{ background: accentColor }}
                >
                  {isPlaying ? (
                    <Pause size={18} color={isDarkAccent ? "#92400E" : BRAND.dark} />
                  ) : (
                    <Play
                      size={18}
                      fill={isDarkAccent ? "#92400E" : BRAND.dark}
                      color={isDarkAccent ? "#92400E" : BRAND.dark}
                    />
                  )}
                </button>
              </div>
            )}

            {hasRecording && (
              <p
                style={{
                  fontFamily: "Inter",
                  fontSize: "0.72rem",
                  color: BRAND.green,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Check size={12} /> Gravação pronta · {formatRecTime(recTime)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── VIDEO FORMAT ── */}
      {postType === "video" && (
        <div
          className="w-full bg-card rounded-2xl p-5 flex flex-col gap-4"
          style={{ border: "1px solid var(--border)" }}
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do vídeo"
            className="w-full rounded-xl px-4 py-3 outline-none"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              color: "var(--foreground)",
              background: "var(--muted)",
              border: "1px solid var(--border)",
            }}
          />

          {/* Camera viewfinder */}
          <div
            className="w-full rounded-xl relative overflow-hidden flex items-center justify-center"
            style={{ aspectRatio: "16/9", background: "var(--foreground)" }}
          >
            {/* Corner brackets */}
            {[
              ["top-3 left-3", "borderTop borderLeft"],
              ["top-3 right-3", "borderTop borderRight"],
              ["bottom-3 left-3", "borderBottom borderLeft"],
              ["bottom-3 right-3", "borderBottom borderRight"],
            ].map(([pos, borders], i) => (
              <div
                key={i}
                className={`absolute w-5 h-5 ${pos}`}
                style={{
                  borderTop: borders.includes("borderTop") ? `2px solid ${accentColor}` : "none",
                  borderBottom: borders.includes("borderBottom") ? `2px solid ${accentColor}` : "none",
                  borderLeft: borders.includes("borderLeft") ? `2px solid ${accentColor}` : "none",
                  borderRight: borders.includes("borderRight") ? `2px solid ${accentColor}` : "none",
                }}
              />
            ))}

            {/* Recording overlay */}
            {isRecording && (
              <div
                className="absolute top-3 right-3 flex items-center gap-2 px-2.5 py-1 rounded-lg"
                style={{ background: "rgba(0,0,0,0.5)" }}
              >
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: BRAND.red }} />
                <span
                  style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem", color: "var(--background)" }}
                >
                  {formatRecTime(recTime)}
                </span>
              </div>
            )}

            {/* Waveform inside camera (audio feedback) */}
            {isRecording && (
              <div className="absolute bottom-3 left-3 right-3">
                <AudioWave heights={waveHeights} color={accentColor} />
              </div>
            )}

            {/* Recorded state */}
            {hasRecording && !isRecording && (
              <>
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(135deg, rgba(34,207,213,0.08) 0%, rgba(17,24,39,0.4) 100%)" }}
                />
                <button
                  onClick={togglePlay}
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{
                    background: "rgba(255,255,255,0.18)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.25)",
                  }}
                >
                  {isPlaying ? <Pause size={22} color="white" /> : <Play size={22} fill="white" color="white" />}
                </button>
                <div className="absolute bottom-3 right-3">
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.7rem",
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    {formatRecTime(recTime)}
                  </span>
                </div>
              </>
            )}

            {/* Idle state */}
            {!isRecording && !hasRecording && (
              <div className="flex flex-col items-center gap-3 opacity-40">
                <Video size={32} color="white" />
                <p style={{ fontFamily: "Inter", fontSize: "0.75rem", color: "var(--background)" }}>Câmera simulada</p>
              </div>
            )}
          </div>

          {/* Video controls */}
          <div className="flex items-center justify-center gap-4">
            {!hasRecording ? (
              <button
                onClick={() => (isRecording ? stopRecording() : setIsRecording(true))}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  background: isRecording ? BRAND.red : accentColor,
                  color: isRecording ? "white" : isDarkAccent ? "#92400E" : BRAND.dark,
                  boxShadow: isRecording ? `0 0 0 6px ${BRAND.red}22` : "none",
                }}
              >
                {isRecording ? (
                  <>
                    <Square size={14} fill="white" color="white" /> Parar gravação
                  </>
                ) : (
                  <>
                    <Video size={14} /> Iniciar gravação
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={reRecord}
                  className="px-4 py-2 rounded-xl text-sm bg-card hover:bg-muted transition-colors"
                  style={{ fontFamily: "Inter", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
                >
                  Regravar
                </button>
                <p
                  style={{
                    fontFamily: "Inter",
                    fontSize: "0.72rem",
                    color: BRAND.green,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Check size={12} /> Vídeo pronto · {formatRecTime(recTime)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 w-full">
        <button
          onClick={onSkip}
          className="flex-1 py-3 rounded-xl text-sm bg-card hover:bg-muted transition-colors"
          style={{
            fontFamily: "Inter",
            fontWeight: 500,
            color: "var(--muted-foreground)",
            border: "1px solid var(--border)",
          }}
        >
          Pular → ir para pausa
        </button>
        <button
          onClick={handlePublish}
          disabled={!canPublish}
          className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{
            fontFamily: "'Outfit', sans-serif",
            background: accentColor,
            color: isDarkAccent ? "#92400E" : BRAND.dark,
          }}
        >
          <Send size={15} /> Publicar no feed
        </button>
      </div>
    </div>
  );
}

// ── FeedView ───────────────────────────────────────────────────────────────

const POST_TYPE_ICON: Record<PostType, React.ElementType> = { text: PenLine, audio: Mic, video: Video };

function FeedViewLegacy({
  articles,
  setArticles,
  setSelectedPost,
  setView,
}: {
  articles: FeedArticle[];
  setArticles: React.Dispatch<React.SetStateAction<FeedArticle[]>>;
  setSelectedPost: (p: FeedArticle) => void;
  setView: (v: View) => void;
}) {
  const [activeFilter, setActiveFilter] = useState("Todos");
  const filters = ["Todos", ...SUBJECTS.map((s) => s.name)];
  const filtered = activeFilter === "Todos" ? articles : articles.filter((a) => a.subject === activeFilter);

  const toggleLike = (id: number) =>
    setArticles((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, likedByMe: !a.likedByMe, likes: a.likedByMe ? a.likes - 1 : a.likes + 1 } : a,
      ),
    );
  const toggleSave = (id: number) =>
    setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, savedByMe: !a.savedByMe } : a)));
  const openPost = (article: FeedArticle) => {
    setSelectedPost(article);
    setView("post-detail");
  };

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
        {filters.map((f) => {
          const s = SUBJECTS.find((x) => x.name === f);
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all"
              style={{
                fontFamily: "Inter",
                fontWeight: 500,
                background: activeFilter === f ? (s?.color ?? BRAND.dark) : "var(--card)",
                color: activeFilter === f ? (s ? BRAND.dark : "#F9FAFB") : "#6B7280",
                border: activeFilter === f ? "none" : "1px solid var(--border)",
              }}
            >
              {f}
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-4">
        {filtered.map((article) => (
          <article
            key={article.id}
            onClick={() => openPost(article)}
            className="rounded-2xl p-6 bg-card transition-all hover:shadow-md cursor-pointer"
            style={{ border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <DotAvatar color={article.dotColor} accessory={article.accessory} size={40} />
                <div>
                  <div
                    style={{ fontFamily: "Inter", fontWeight: 600, fontSize: "0.88rem", color: "var(--foreground)" }}
                  >
                    {article.author}
                  </div>
                  <div style={{ fontFamily: "Inter", fontSize: "0.72rem", color: "var(--muted-foreground)" }}>
                    {article.date} · {article.readTime} de leitura
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {article.postType && (
                  <span
                    className="flex items-center justify-center w-7 h-7 rounded-lg"
                    style={{ background: "var(--input)", color: "var(--muted-foreground)" }}
                  >
                    {(() => {
                      const PI = POST_TYPE_ICON[article.postType] || PenLine;
                      return <PI size={14} />;
                    })()}
                  </span>
                )}
                <span
                  className="px-2.5 py-1 rounded-lg text-xs"
                  style={{
                    background: `${article.subjectColor}18`,
                    color: article.subjectColor,
                    fontFamily: "Inter",
                    fontWeight: 600,
                  }}
                >
                  {article.subject}
                </span>
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
              {article.title}
            </h3>
            {article.postType === "audio" ? (
              <div
                className="flex items-center gap-3 py-3 px-4 rounded-xl"
                style={{ background: `${article.subjectColor}10` }}
              >
                <div className="flex items-center gap-0.5" style={{ height: 28 }}>
                  {Array.from({ length: 18 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full"
                      style={{
                        height: `${[40, 70, 50, 90, 60, 80, 45, 75, 55, 85, 65, 95, 50, 70, 40, 80, 60, 45][i]}%`,
                        background: article.subjectColor,
                        opacity: 0.65,
                      }}
                    />
                  ))}
                </div>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.78rem",
                    color: article.subjectColor,
                    fontWeight: 700,
                  }}
                >
                  {article.readTime}
                </span>
                <span style={{ fontFamily: "Inter", fontSize: "0.78rem", color: "var(--muted-foreground)", flex: 1 }}>
                  {article.excerpt}
                </span>
              </div>
            ) : article.postType === "video" ? (
              <div
                className="flex items-center gap-3 py-3 px-4 rounded-xl overflow-hidden"
                style={{ background: `${article.subjectColor}10` }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: `${article.subjectColor}22` }}
                >
                  <Play size={16} fill={article.subjectColor} color={article.subjectColor} />
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
                    {article.readTime}
                  </p>
                  <p style={{ fontFamily: "Inter", fontSize: "0.72rem", color: "var(--muted-foreground)" }}>
                    {article.excerpt}
                  </p>
                </div>
              </div>
            ) : (
              <p
                style={{ fontFamily: "Inter", fontSize: "0.84rem", color: "var(--muted-foreground)", lineHeight: 1.7 }}
              >
                {article.excerpt}
              </p>
            )}
            <div className="flex items-center gap-5 mt-5 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLike(article.id);
                }}
                className="flex items-center gap-2 transition-transform hover:scale-110"
              >
                <Heart
                  size={16}
                  fill={article.likedByMe ? BRAND.red : "none"}
                  color={article.likedByMe ? BRAND.red : "#9CA3AF"}
                />
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.78rem",
                    color: article.likedByMe ? BRAND.red : "#9CA3AF",
                  }}
                >
                  {article.likes}
                </span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openPost(article);
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
                  {article.comments}
                </span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSave(article.id);
                }}
                className="ml-auto transition-transform hover:scale-110"
              >
                <Bookmark
                  size={16}
                  fill={article.savedByMe ? BRAND.purple : "none"}
                  color={article.savedByMe ? BRAND.purple : "#9CA3AF"}
                />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

// ── ShopView ───────────────────────────────────────────────────────────────

function ShopViewLegacy({
  dotColor,
  setDotColor,
  activeAccessory,
  setActiveAccessory,
  coins,
  setCoins,
  unlockedAccessories,
  setUnlockedAccessories,
}: {
  dotColor: string;
  setDotColor: (c: string) => void;
  activeAccessory: string | null;
  setActiveAccessory: (a: string | null) => void;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  unlockedAccessories: string[];
  setUnlockedAccessories: (a: string[]) => void;
}) {
  const handleUnlock = (acc: (typeof ACCESSORIES_LIST)[number]) => {
    if (coins >= acc.cost && !unlockedAccessories.includes(acc.id)) {
      setCoins((c) => c - acc.cost);
      setUnlockedAccessories([...unlockedAccessories, acc.id]);
      setActiveAccessory(acc.id);
    }
  };
  return (
    <div className="p-8" style={{ maxWidth: 860, margin: "0 auto" }}>
      <div className="mb-7">
        <h1
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 900,
            fontSize: "1.85rem",
            color: "var(--foreground)",
          }}
        >
          Personagem
        </h1>
        <p style={{ fontFamily: "Inter", fontSize: "0.83rem", color: "var(--muted-foreground)", marginTop: 4 }}>
          Customize seu dot com as moedas que você ganha estudando
        </p>
      </div>
      <div className="grid grid-cols-2 gap-10">
        <div className="flex flex-col gap-6">
          <div
            className="bg-card rounded-2xl p-10 flex flex-col items-center gap-5"
            style={{ border: "1px solid var(--border)" }}
          >
            <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  position: "absolute",
                  inset: -24,
                  borderRadius: "50%",
                  background: dotColor,
                  filter: "blur(30px)",
                  opacity: 0.18,
                  pointerEvents: "none",
                }}
              />
              <DotAvatar color={dotColor} accessory={activeAccessory} size={120} />
            </div>
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: `${BRAND.yellow}18`, border: `1px solid ${BRAND.yellow}44` }}
            >
              <Hexagon size={16} fill={BRAND.yellow} color={BRAND.yellow} />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  color: BRAND.yellow,
                  fontSize: "0.95rem",
                }}
              >
                {coins.toLocaleString("pt-BR")}
              </span>
              <span style={{ fontFamily: "Inter", fontSize: "0.78rem", color: "var(--muted-foreground)" }}>moedas</span>
            </div>
          </div>
          <div>
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: "0.92rem",
                color: "var(--foreground)",
                marginBottom: 14,
              }}
            >
              Cor do personagem
            </p>
            <div className="flex flex-wrap gap-3">
              {DOT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setDotColor(c)}
                  className="w-10 h-10 rounded-full transition-all hover:scale-110"
                  style={{
                    background: c,
                    outline: dotColor === c ? `3px solid ${c}` : "none",
                    outlineOffset: 3,
                    boxShadow: dotColor === c ? `0 0 12px ${c}50` : "none",
                  }}
                />
              ))}
            </div>
          </div>
          {activeAccessory && (
            <button
              onClick={() => setActiveAccessory(null)}
              className="self-start px-4 py-2 rounded-xl text-sm bg-card hover:bg-muted transition-colors"
              style={{ color: "var(--muted-foreground)", fontFamily: "Inter", border: "1px solid var(--border)" }}
            >
              Remover acessório
            </button>
          )}
        </div>
        <div>
          <p
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "0.92rem",
              color: "var(--foreground)",
              marginBottom: 16,
            }}
          >
            Acessórios
          </p>
          <div className="grid grid-cols-2 gap-3">
            {ACCESSORIES_LIST.map((acc) => {
              const isUnlocked = unlockedAccessories.includes(acc.id);
              const isActive = activeAccessory === acc.id;
              const canAfford = coins >= acc.cost;
              return (
                <button
                  key={acc.id}
                  onClick={() => {
                    if (isUnlocked) setActiveAccessory(isActive ? null : acc.id);
                    else if (canAfford) handleUnlock(acc);
                  }}
                  className="p-4 rounded-xl text-left transition-all hover:scale-[1.03] bg-card"
                  style={{
                    border: `1.5px solid ${isActive ? `${dotColor}60` : "var(--border)"}`,
                    background: isActive ? `${dotColor}0C` : "var(--card)",
                    opacity: !isUnlocked && !canAfford ? 0.5 : 1,
                  }}
                >
                  <div className="flex justify-center mb-3">
                    <DotAvatar color={dotColor} accessory={acc.id} size={60} />
                  </div>
                  <div
                    style={{
                      fontFamily: "Inter",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      color: isActive ? dotColor : "var(--foreground)",
                      marginBottom: 6,
                    }}
                  >
                    {acc.name}
                  </div>
                  <div className="flex items-center justify-between">
                    {isUnlocked ? (
                      <span
                        className="flex items-center gap-1"
                        style={{ fontFamily: "Inter", fontSize: "0.7rem", color: isActive ? dotColor : BRAND.green }}
                      >
                        <Check size={11} /> {isActive ? "Equipado" : "Desbloqueado"}
                      </span>
                    ) : (
                      <span
                        className="flex items-center gap-1"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "0.72rem",
                          color: canAfford ? BRAND.yellow : "var(--muted-foreground)",
                        }}
                      >
                        <Hexagon
                          size={10}
                          fill={canAfford ? BRAND.yellow : "var(--muted-foreground)"}
                          color={canAfford ? BRAND.yellow : "var(--muted-foreground)"}
                        />{" "}
                        {acc.cost.toLocaleString("pt-BR")}
                      </span>
                    )}
                    {!isUnlocked && <Lock size={12} color="#9CA3AF" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PostDetailView ─────────────────────────────────────────────────────────

const INITIAL_COMMENTS: Comment[] = [
  {
    id: 1,
    author: "Ana Clara M.",
    dotColor: BRAND.purple,
    accessory: "hat",
    text: "Adorei a abordagem visual! Eu sempre tive dificuldade com esse conceito e agora ficou muito mais claro.",
    date: "há 1h",
    likes: 8,
    likedByMe: false,
    replies: [
      {
        id: 11,
        author: "Pedro Lima",
        dotColor: BRAND.teal,
        accessory: "glasses",
        text: "Concordo! Pensar geometricamente antes de algebricamente faz toda a diferença.",
        date: "há 45min",
        likes: 3,
        likedByMe: false,
        replies: [],
      },
    ],
  },
  {
    id: 2,
    author: "Lucas Ferreira",
    dotColor: BRAND.green,
    accessory: "crown",
    text: "Excelente conteúdo. Você conseguiu resumir em poucas palavras o que levei semanas para entender.",
    date: "há 2h",
    likes: 12,
    likedByMe: true,
    replies: [
      {
        id: 21,
        author: "Beatriz Santos",
        dotColor: BRAND.yellow,
        accessory: null,
        text: "Sério! Esse post merecia mais curtidas.",
        date: "há 1h 30min",
        likes: 5,
        likedByMe: false,
        replies: [],
      },
    ],
  },
];

function PostDetailViewLegacy({
  post,
  dotColor,
  activeAccessory,
  setView,
}: {
  post: FeedArticle;
  dotColor: string;
  activeAccessory: string | null;
  setView: (v: View) => void;
}) {
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [saved, setSaved] = useState(post.savedByMe);
  const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const subject = SUBJECTS.find((s) => s.name === post.subject);

  const toggleLike = () => {
    setLiked((l) => !l);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  };
  const toggleCommentLike = (id: number) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, likes: c.likedByMe ? c.likes - 1 : c.likes + 1, likedByMe: !c.likedByMe } : c,
      ),
    );
  };
  const toggleReplyLike = (commentId: number, replyId: number) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              replies: c.replies.map((r) =>
                r.id === replyId
                  ? { ...r, likes: r.likedByMe ? r.likes - 1 : r.likes + 1, likedByMe: !r.likedByMe }
                  : r,
              ),
            }
          : c,
      ),
    );
  };
  const submitComment = () => {
    if (!newComment.trim()) return;
    const c: Comment = {
      id: Date.now(),
      author: "Você",
      dotColor,
      accessory: activeAccessory,
      text: newComment.trim(),
      date: "agora",
      likes: 0,
      likedByMe: false,
      replies: [],
    };
    setComments((prev) => [c, ...prev]);
    setNewComment("");
  };
  const submitReply = (commentId: number) => {
    if (!replyText.trim()) return;
    const r: Comment = {
      id: Date.now(),
      author: "Você",
      dotColor,
      accessory: activeAccessory,
      text: replyText.trim(),
      date: "agora",
      likes: 0,
      likedByMe: false,
      replies: [],
    };
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, replies: [...c.replies, r] } : c)));
    setReplyText("");
    setReplyingTo(null);
  };

  return (
    <div className="p-6 pb-28" style={{ maxWidth: 700, margin: "0 auto" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setView("feed")}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-card hover:bg-muted transition-colors"
          style={{ border: "1px solid var(--border)" }}
        >
          <ArrowLeft size={20} color="var(--foreground)" />
        </button>
        {subject && (
          <span
            className="px-3 py-1 rounded-lg text-xs font-semibold"
            style={{ background: `${post.subjectColor}18`, color: post.subjectColor, fontFamily: "Inter" }}
          >
            {post.subject}
          </span>
        )}
        <button onClick={() => setSaved((s) => !s)} className="ml-auto transition-transform hover:scale-110">
          <Bookmark
            size={18}
            fill={saved ? BRAND.purple : "none"}
            color={saved ? BRAND.purple : "var(--muted-foreground)"}
          />
        </button>
      </div>

      {/* Post body */}
      <div className="bg-card rounded-2xl p-6 mb-6" style={{ border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3 mb-4">
          <DotAvatar color={post.dotColor} accessory={post.accessory} size={44} />
          <div>
            <p style={{ fontFamily: "Inter", fontWeight: 600, fontSize: "0.9rem", color: "var(--foreground)" }}>
              {post.author}
            </p>
            <p style={{ fontFamily: "Inter", fontSize: "0.72rem", color: "var(--muted-foreground)" }}>
              {post.date} · {post.readTime} de leitura
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
        {post.postType === "audio" ? (
          <div
            className="flex items-center gap-3 py-3 px-4 rounded-xl mb-4"
            style={{ background: `${post.subjectColor}10` }}
          >
            <div className="flex items-center gap-0.5" style={{ height: 28 }}>
              {Array.from({ length: 18 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full"
                  style={{
                    height: `${[40, 70, 50, 90, 60, 80, 45, 75, 55, 85, 65, 95, 50, 70, 40, 80, 60, 45][i]}%`,
                    background: post.subjectColor,
                    opacity: 0.65,
                  }}
                />
              ))}
            </div>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.82rem",
                color: post.subjectColor,
                fontWeight: 700,
              }}
            >
              {post.readTime}
            </span>
            <span style={{ fontFamily: "Inter", fontSize: "0.82rem", color: "var(--muted-foreground)", flex: 1 }}>
              {post.excerpt}
            </span>
          </div>
        ) : post.postType === "video" ? (
          <div
            className="w-full rounded-xl flex items-center justify-center mb-4"
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
                {post.readTime}
              </span>
            </div>
          </div>
        ) : (
          <p
            style={{
              fontFamily: "Inter",
              fontSize: "0.9rem",
              color: "var(--muted-foreground)",
              lineHeight: 1.75,
              marginBottom: 16,
            }}
          >
            {post.excerpt}
          </p>
        )}
        <div className="flex items-center gap-5 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <button onClick={toggleLike} className="flex items-center gap-2 transition-transform hover:scale-110">
            <Heart size={16} fill={liked ? BRAND.red : "none"} color={liked ? BRAND.red : "#9CA3AF"} />
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.78rem",
                color: liked ? BRAND.red : "#9CA3AF",
              }}
            >
              {likeCount}
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
              {comments.length}
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
              <div key={comment.id}>
                <div className="flex gap-3">
                  <DotAvatar color={comment.dotColor} accessory={comment.accessory} size={36} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        style={{
                          fontFamily: "Inter",
                          fontWeight: 600,
                          fontSize: "0.84rem",
                          color: "var(--foreground)",
                        }}
                      >
                        {comment.author}
                      </span>
                      <span style={{ fontFamily: "Inter", fontSize: "0.72rem", color: "var(--muted-foreground)" }}>
                        {comment.date}
                      </span>
                    </div>
                    <p
                      style={{ fontFamily: "Inter", fontSize: "0.84rem", color: "var(--foreground)", lineHeight: 1.6 }}
                    >
                      {comment.text}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <button
                        onClick={() => toggleCommentLike(comment.id)}
                        className="flex items-center gap-1.5 transition-transform hover:scale-110"
                      >
                        <Heart
                          size={14}
                          fill={comment.likedByMe ? BRAND.red : "none"}
                          color={comment.likedByMe ? BRAND.red : "#9CA3AF"}
                        />
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "0.72rem",
                            color: comment.likedByMe ? BRAND.red : "#9CA3AF",
                          }}
                        >
                          {comment.likes}
                        </span>
                      </button>
                      <button
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
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
                    {replyingTo === comment.id && (
                      <div className="flex gap-2 mt-3">
                        <input
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Escreva uma resposta..."
                          className="flex-1 rounded-xl px-3 py-2 outline-none text-sm"
                          style={{
                            background: "var(--input)",
                            border: "1px solid var(--border)",
                            fontFamily: "Inter",
                            color: "var(--foreground)",
                          }}
                        />
                        <button
                          onClick={() => submitReply(comment.id)}
                          disabled={!replyText.trim()}
                          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                          style={{ background: dotColor }}
                        >
                          <Send size={14} color="#111827" />
                        </button>
                      </div>
                    )}
                    {comment.replies.length > 0 && (
                      <div className="flex flex-col gap-3 mt-3 pl-10">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-2">
                            <DotAvatar color={reply.dotColor} accessory={reply.accessory} size={28} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  style={{
                                    fontFamily: "Inter",
                                    fontWeight: 600,
                                    fontSize: "0.78rem",
                                    color: "var(--foreground)",
                                  }}
                                >
                                  {reply.author}
                                </span>
                                <span
                                  style={{ fontFamily: "Inter", fontSize: "0.68rem", color: "var(--muted-foreground)" }}
                                >
                                  {reply.date}
                                </span>
                              </div>
                              <p
                                style={{
                                  fontFamily: "Inter",
                                  fontSize: "0.78rem",
                                  color: "var(--foreground)",
                                  lineHeight: 1.6,
                                }}
                              >
                                {reply.text}
                              </p>
                              <button
                                onClick={() => toggleReplyLike(comment.id, reply.id)}
                                className="flex items-center gap-1.5 mt-1.5 transition-transform hover:scale-110"
                              >
                                <Heart
                                  size={12}
                                  fill={reply.likedByMe ? BRAND.red : "none"}
                                  color={reply.likedByMe ? BRAND.red : "#9CA3AF"}
                                />
                                <span
                                  style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: "0.68rem",
                                    color: reply.likedByMe ? BRAND.red : "#9CA3AF",
                                  }}
                                >
                                  {reply.likes}
                                </span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New comment input */}
      <div className="flex gap-3 items-center pt-4" style={{ borderTop: "1px solid var(--border)" }}>
        <DotAvatar color={dotColor} accessory={activeAccessory} size={32} />
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitComment()}
          placeholder="Adicione um comentário..."
          className="flex-1 rounded-xl px-4 py-2.5 outline-none text-sm"
          style={{
            background: "var(--input)",
            border: "1px solid var(--border)",
            fontFamily: "Inter",
            color: "var(--foreground)",
          }}
        />
        <button
          onClick={submitComment}
          disabled={!newComment.trim()}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
          style={{ background: dotColor }}
        >
          <Send size={16} color="#111827" />
        </button>
      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────

// ── SettingsView ───────────────────────────────────────────────────────────

function SettingsViewLegacy({
  userName,
  setUserName,
  theme,
  setTheme,
  dotColor,
}: {
  userName: string;
  setUserName: (n: string) => void;
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  dotColor: string;
}) {
  // ── Acesso ──────────────────────────────────────────────────────────────
  const [loginMethod, setLoginMethod] = useState<"google" | "email" | "password">("email");

  // ── Dados da conta ──────────────────────────────────────────────────────
  const [displayName, setDisplayName] = useState(userName);
  const [displayNameSaved, setDisplayNameSaved] = useState(userName);
  const [email, setEmail] = useState("guilherme@email.com");
  const [emailSaved, setEmailSaved] = useState("guilherme@email.com");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const loginMethodNote: Record<string, string> = {
    google: "Conectado via Google. Você pode adicionar uma senha como método alternativo.",
    email: "Um link de acesso é enviado para o seu e-mail quando necessário.",
    password: "Acesso por e-mail e senha.",
  };

  const handleSavePassword = () => {
    if (!newPassword) return;
    setPasswordSaved(true);
    setNewPassword("");
    setTimeout(() => setPasswordSaved(false), 2000);
  };

  const handleResetPassword = () => {
    setResetSent(true);
    setTimeout(() => setResetSent(false), 3000);
  };

  return (
    <div className="p-8" style={{ maxWidth: 680, margin: "0 auto" }}>
      <div className="mb-8">
        <h1
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 900,
            fontSize: "1.85rem",
            color: "var(--foreground)",
          }}
        >
          Configurações
        </h1>
        <p style={{ fontFamily: "Inter", fontSize: "0.83rem", color: "var(--muted-foreground)", marginTop: 4 }}>
          Ajuste seu perfil e preferências
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Perfil */}
        <div className="bg-card rounded-2xl p-6 border border-border flex flex-col gap-4">
          <h2
            className="flex items-center gap-2"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1.05rem",
              color: "var(--foreground)",
            }}
          >
            <User size={18} color={dotColor} /> Perfil
          </h2>
          <div>
            <label
              style={{
                fontFamily: "Inter",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--muted-foreground)",
                marginBottom: 6,
                display: "block",
              }}
            >
              Nome de exibição
            </label>
            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-input rounded-xl px-4 py-3 outline-none focus:ring-2 transition-all"
              style={
                {
                  fontFamily: "Inter",
                  fontSize: "0.9rem",
                  color: "var(--foreground)",
                  "--tw-ring-color": dotColor,
                } as React.CSSProperties
              }
            />
          </div>
        </div>

        {/* Aparência */}
        <div className="bg-card rounded-2xl p-6 border border-border flex flex-col gap-4">
          <h2
            className="flex items-center gap-2"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1.05rem",
              color: "var(--foreground)",
            }}
          >
            <Sun size={18} color={dotColor} /> Aparência
          </h2>
          <div>
            <label
              style={{
                fontFamily: "Inter",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--muted-foreground)",
                marginBottom: 10,
                display: "block",
              }}
            >
              Tema
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTheme("light")}
                className="flex items-center justify-center gap-2 py-3 rounded-xl transition-all border"
                style={{
                  background: theme === "light" ? `${dotColor}14` : "var(--background)",
                  borderColor: theme === "light" ? dotColor : "var(--border)",
                  color: theme === "light" ? dotColor : "var(--muted-foreground)",
                  fontFamily: "Inter",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                }}
              >
                <Sun size={16} /> Claro
              </button>
              <button
                onClick={() => setTheme("dark")}
                className="flex items-center justify-center gap-2 py-3 rounded-xl transition-all border"
                style={{
                  background: theme === "dark" ? `${dotColor}14` : "var(--background)",
                  borderColor: theme === "dark" ? dotColor : "var(--border)",
                  color: theme === "dark" ? dotColor : "var(--muted-foreground)",
                  fontFamily: "Inter",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                }}
              >
                <Moon size={16} /> Escuro
              </button>
            </div>
          </div>
        </div>

        {/* Acesso */}
        <div className="bg-card rounded-2xl p-6 border border-border flex flex-col gap-4">
          <h2
            className="flex items-center gap-2"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1.05rem",
              color: "var(--foreground)",
            }}
          >
            <Lock size={18} color={dotColor} /> Acesso
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "google" as const, icon: <Globe size={16} />, label: "Google" },
              { id: "email" as const, icon: <Mail size={16} />, label: "E-mail" },
              { id: "password" as const, icon: <KeyRound size={16} />, label: "Senha" },
            ].map(({ id, icon, label }) => (
              <button
                key={id}
                onClick={() => setLoginMethod(id)}
                className="flex items-center justify-center gap-2 py-3 rounded-xl transition-all"
                style={{
                  fontFamily: "Inter",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  background: loginMethod === id ? `${dotColor}24` : "var(--background)",
                  border: `1px solid ${loginMethod === id ? dotColor : "var(--border)"}`,
                  color: loginMethod === id ? dotColor : "var(--muted-foreground)",
                }}
              >
                {icon} {label}
              </button>
            ))}
          </div>
          <p style={{ fontFamily: "Inter", fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: 12 }}>
            {loginMethodNote[loginMethod]}
          </p>
        </div>

        {/* Dados da conta */}
        <div className="bg-card rounded-2xl p-6 border border-border flex flex-col gap-4">
          <h2
            className="flex items-center gap-2"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1.05rem",
              color: "var(--foreground)",
            }}
          >
            <UserCog size={18} color={dotColor} /> Dados da conta
          </h2>
          <div className="flex flex-col gap-5">
            {/* Nome de exibição */}
            <div>
              <label
                style={{
                  fontFamily: "Inter",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "var(--muted-foreground)",
                  marginBottom: 6,
                  display: "block",
                }}
              >
                Nome de exibição
              </label>
              <div style={{ position: "relative" }}>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 outline-none"
                  style={{
                    background: "var(--input)",
                    fontFamily: "Inter",
                    fontSize: "0.88rem",
                    color: "var(--foreground)",
                    paddingRight: displayName !== displayNameSaved ? 72 : 16,
                  }}
                />
                {displayName !== displayNameSaved && (
                  <button
                    onClick={() => {
                      setUserName(displayName);
                      setDisplayNameSaved(displayName);
                    }}
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: dotColor,
                      color: BRAND.dark,
                      fontFamily: "Inter",
                      fontWeight: 600,
                      fontSize: "0.72rem",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px 12px",
                      borderRadius: 8,
                    }}
                  >
                    Salvar
                  </button>
                )}
              </div>
            </div>
            {/* E-mail */}
            <div>
              <label
                style={{
                  fontFamily: "Inter",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "var(--muted-foreground)",
                  marginBottom: 6,
                  display: "block",
                }}
              >
                E-mail
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 outline-none"
                  style={{
                    background: "var(--input)",
                    fontFamily: "Inter",
                    fontSize: "0.88rem",
                    color: "var(--foreground)",
                    paddingRight: email !== emailSaved ? 72 : 16,
                  }}
                />
                {email !== emailSaved && (
                  <button
                    onClick={() => setEmailSaved(email)}
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: dotColor,
                      color: BRAND.dark,
                      fontFamily: "Inter",
                      fontWeight: 600,
                      fontSize: "0.72rem",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px 12px",
                      borderRadius: 8,
                    }}
                  >
                    Salvar
                  </button>
                )}
              </div>
            </div>
            {/* Senha */}
            <div>
              <label
                style={{
                  fontFamily: "Inter",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "var(--muted-foreground)",
                  marginBottom: 6,
                  display: "block",
                }}
              >
                Senha
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl px-4 py-2.5 outline-none"
                  style={{
                    background: "var(--input)",
                    fontFamily: "Inter",
                    fontSize: "0.88rem",
                    color: "var(--foreground)",
                    paddingRight: newPassword ? 72 : 16,
                  }}
                />
                {newPassword && (
                  <button
                    onClick={handleSavePassword}
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: dotColor,
                      color: BRAND.dark,
                      fontFamily: "Inter",
                      fontWeight: 600,
                      fontSize: "0.72rem",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px 12px",
                      borderRadius: 8,
                    }}
                  >
                    Salvar
                  </button>
                )}
              </div>
              {passwordSaved && (
                <p
                  className="flex items-center gap-1"
                  style={{ fontFamily: "Inter", fontSize: "0.75rem", color: BRAND.green, marginTop: 6 }}
                >
                  <Check size={12} /> Senha atualizada
                </p>
              )}
            </div>
          </div>

          {/* Esqueci minha senha */}
          <button
            onClick={handleResetPassword}
            style={{
              fontFamily: "Inter",
              fontSize: "0.78rem",
              color: dotColor,
              background: "none",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              marginTop: 4,
              padding: 0,
            }}
          >
            Esqueci minha senha
          </button>
          {resetSent && (
            <div
              style={{
                marginTop: 10,
                padding: "12px 16px",
                borderRadius: 12,
                background: `${BRAND.green}1F`,
                border: `1px solid ${BRAND.green}59`,
                fontFamily: "Inter",
                fontSize: "0.78rem",
                color: "var(--foreground)",
              }}
            >
              Enviamos um link de redefinição para guilherme@email.com
            </div>
          )}
        </div>

        {/* Zona de perigo */}
        <div className="flex items-center gap-3" style={{ marginTop: 8 }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span
            style={{
              fontFamily: "Inter",
              fontSize: "0.7rem",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--muted-foreground)",
              whiteSpace: "nowrap",
            }}
          >
            Zona de perigo
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.confirm("Deseja realmente sair?")}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-card"
            style={{
              border: `1px solid ${BRAND.red}59`,
              color: BRAND.red,
              fontFamily: "Inter",
              fontWeight: 600,
              fontSize: "0.85rem",
            }}
          >
            <LogOut size={15} /> Sair da conta
          </button>
          <button
            onClick={() => window.confirm("Esta ação é irreversível. Deseja excluir sua conta?")}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-card"
            style={{
              border: "1px solid #b91c1c80",
              color: "#b91c1c",
              fontFamily: "Inter",
              fontWeight: 600,
              fontSize: "0.85rem",
            }}
          >
            <Trash2 size={15} /> Excluir conta
          </button>
        </div>
      </div>
    </div>
  );
}

// ── LEGADO: removido na Task 15 ────────────────────────────────────────────
// Ponte temporária: os estados que viviam em `export default function App` agora
// ficam num provider montado no AppLayout, e cada view do protótipo ganha um
// wrapper sem props para ser montada numa rota. As Tasks 11–15 trocam cada
// wrapper por uma página real em `pages/` e apagam este arquivo.

export const ROUTE_OF: Record<View, string> = {
  dashboard: "/",
  timer: "/estudar",
  feed: "/feed",
  ranking: "/ranking",
  history: "/historico",
  shop: "/loja",
  settings: "/ajustes",
  "post-detail": "/feed/post",
};

type LegacyState = {
  // Vindos do usuário logado, com sobrescrita local para as views antigas (loja/ajustes).
  dotColor: string;
  setDotColor: (c: string) => void;
  userName: string;
  setUserName: (n: string) => void;
  activeAccessory: string | null;
  setActiveAccessory: (a: string | null) => void;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  unlockedAccessories: string[];
  setUnlockedAccessories: (a: string[]) => void;
  articles: FeedArticle[];
  setArticles: React.Dispatch<React.SetStateAction<FeedArticle[]>>;
  addArticle: (a: FeedArticle) => void;
  selectedPost: FeedArticle | null;
  setSelectedPost: (p: FeedArticle | null) => void;
};

const LegacyStateContext = createContext<LegacyState | null>(null);

export function LegacyStateProvider({ children }: { children: ReactNode }) {
  const user = useCurrentUser();
  // LEGADO: removido na Task 15 — sobrescritas locais usadas só pelas views antigas.
  const [dotColorOverride, setDotColor] = useState<string | null>(null);
  const [userNameOverride, setUserName] = useState<string | null>(null);
  const [accessoryOverride, setAccessoryOverride] = useState<{ value: string | null } | null>(null);
  const [coinsOverride, setCoinsOverride] = useState<number | null>(null);
  const [theme, setThemeState] = useState<"light" | "dark">(readTheme);
  const [unlockedAccessories, setUnlockedAccessories] = useState<string[]>(["hat", "glasses"]);
  const [articles, setArticles] = useState<FeedArticle[]>(INITIAL_ARTICLES);
  const [selectedPost, setSelectedPost] = useState<FeedArticle | null>(null);

  const coins = coinsOverride ?? user.coins;
  const setCoins = useCallback<React.Dispatch<React.SetStateAction<number>>>(
    (action) =>
      setCoinsOverride((prev) => {
        const base = prev ?? user.coins;
        return typeof action === "function" ? action(base) : action;
      }),
    [user.coins],
  );
  const setActiveAccessory = useCallback((a: string | null) => setAccessoryOverride({ value: a }), []);
  const setTheme = useCallback((t: "light" | "dark") => {
    setThemeState(t);
    applyTheme(t);
  }, []);
  const addArticle = useCallback((a: FeedArticle) => setArticles((prev) => [a, ...prev]), []);

  const value: LegacyState = {
    dotColor: dotColorOverride ?? user.dotColor,
    setDotColor,
    userName: userNameOverride ?? user.name,
    setUserName,
    activeAccessory: accessoryOverride ? accessoryOverride.value : user.activeAccessoryId,
    setActiveAccessory,
    coins,
    setCoins,
    theme,
    setTheme,
    unlockedAccessories,
    setUnlockedAccessories,
    articles,
    setArticles,
    addArticle,
    selectedPost,
    setSelectedPost,
  };
  return <LegacyStateContext.Provider value={value}>{children}</LegacyStateContext.Provider>;
}

export function useLegacyState(): LegacyState {
  const value = useContext(LegacyStateContext);
  if (!value) throw new Error("useLegacyState precisa estar dentro de <LegacyStateProvider>");
  return value;
}

/** Troca o antigo `setView(x)` por navegação de rota. */
function useSetView(): (v: View) => void {
  const navigate = useNavigate();
  return useCallback((v: View) => navigate(ROUTE_OF[v]), [navigate]);
}

export function FeedView() {
  const legacy = useLegacyState();
  const setView = useSetView();
  return (
    <FeedViewLegacy
      articles={legacy.articles}
      setArticles={legacy.setArticles}
      setSelectedPost={legacy.setSelectedPost}
      setView={setView}
    />
  );
}

export function PostDetailView() {
  const legacy = useLegacyState();
  const setView = useSetView();
  if (!legacy.selectedPost) return <Navigate to={ROUTE_OF.feed} replace />;
  return (
    <PostDetailViewLegacy
      post={legacy.selectedPost}
      dotColor={legacy.dotColor}
      activeAccessory={legacy.activeAccessory}
      setView={setView}
    />
  );
}

export function ShopView() {
  const legacy = useLegacyState();
  return (
    <ShopViewLegacy
      dotColor={legacy.dotColor}
      setDotColor={legacy.setDotColor}
      activeAccessory={legacy.activeAccessory}
      setActiveAccessory={legacy.setActiveAccessory}
      coins={legacy.coins}
      setCoins={legacy.setCoins}
      unlockedAccessories={legacy.unlockedAccessories}
      setUnlockedAccessories={legacy.setUnlockedAccessories}
    />
  );
}

export function SettingsView() {
  const legacy = useLegacyState();
  return (
    <SettingsViewLegacy
      userName={legacy.userName}
      setUserName={legacy.setUserName}
      theme={legacy.theme}
      setTheme={legacy.setTheme}
      dotColor={legacy.dotColor}
    />
  );
}
