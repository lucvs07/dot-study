/* eslint-disable react-refresh/only-export-components -- LEGADO: removido na Task 15 (exporta views, hook e ROUTE_OF) */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Play,
  Pause,
  Lock,
  Check,
  PenLine,
  Mic,
  Square,
  Video,
  Send,
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

export type View = "dashboard" | "timer" | "feed" | "ranking" | "history" | "shop" | "settings";
type PostType = "text" | "audio" | "video";

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
  };
  return <LegacyStateContext.Provider value={value}>{children}</LegacyStateContext.Provider>;
}

export function useLegacyState(): LegacyState {
  const value = useContext(LegacyStateContext);
  if (!value) throw new Error("useLegacyState precisa estar dentro de <LegacyStateProvider>");
  return value;
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
