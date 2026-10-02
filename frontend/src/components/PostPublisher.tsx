import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Check, Coffee, Mic, PenLine, Send, Square, Upload, Video } from "lucide-react";
import { BRAND } from "@/domain/brand";
import { formatRecTime } from "@/domain/format";
import { AudioWave } from "@/components/AudioWave";
import { ErrorMessage } from "@/components/ErrorMessage";
import { useMediaRecorder, type RecorderKind } from "@/hooks/useMediaRecorder";
import { useServices } from "@/services/ServicesContext";
import { MEDIA_LIMITS, type PostType } from "@/services/contracts";

/** Mídia pronta para enviar: gravada no navegador ou escolhida do disco. */
type ReadyMedia = { blob: Blob; kind: RecorderKind; durationSec: number };

const WAVE_BARS = 20;
const idleWave = () => Array.from({ length: WAVE_BARS }, () => 18);
const VIDEO_FILE_TYPES = ["video/mp4", "video/webm"];

function RecorderAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="w-full rounded-xl p-3 text-sm"
      style={{ background: "rgba(238,27,63,0.08)", color: "#B4102C", border: "1px solid rgba(238,27,63,0.25)" }}
    >
      {message}
    </div>
  );
}

/**
 * Lê a duração de um arquivo de vídeo com um <video> fora da tela.
 * WebM gravado pelo Chrome costuma vir com duração Infinity até buscar o fim.
 */
function readVideoDuration(file: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    let done = false;
    const finish = (fn: () => void) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
      fn();
    };
    const timer = setTimeout(() => finish(() => reject(new Error("timeout"))), 10_000);
    const tryResolve = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) finish(() => resolve(video.duration));
    };
    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () => {
      if (Number.isFinite(video.duration)) tryResolve();
      else video.currentTime = Number.MAX_SAFE_INTEGER;
    };
    video.ondurationchange = tryResolve;
    video.ontimeupdate = tryResolve;
    video.onerror = () => finish(() => reject(new Error("unreadable")));
    video.src = url;
  });
}

function RecorderPanel({
  kind,
  accentColor,
  disabled,
  onMediaChange,
}: {
  kind: RecorderKind;
  accentColor: string;
  disabled: boolean;
  onMediaChange: (media: ReadyMedia | null) => void;
}) {
  const rec = useMediaRecorder(kind);
  const isDarkAccent = accentColor === BRAND.yellow;
  const maxSeconds = MEDIA_LIMITS[kind].maxSeconds;
  const isRecording = rec.status === "recording";
  const hasRecording = rec.status === "recorded" && rec.blob !== null;

  // Onda de áudio: puramente visual, como no protótipo.
  const [waveHeights, setWaveHeights] = useState(idleWave);
  useEffect(() => {
    if (!isRecording) {
      if (!hasRecording) setWaveHeights(idleWave());
      return;
    }
    const iv = setInterval(() => {
      setWaveHeights(Array.from({ length: WAVE_BARS }, () => Math.floor(Math.random() * 72 + 14)));
    }, 120);
    return () => clearInterval(iv);
  }, [isRecording, hasRecording]);

  // Arquivo de vídeo escolhido do disco (alternativa à gravação).
  const [file, setFile] = useState<{ blob: Blob; url: string; durationSec: number } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [readingFile, setReadingFile] = useState(false);
  const fileUrlRef = useRef<string | null>(null);
  const setFileState = (next: { blob: Blob; url: string; durationSec: number } | null) => {
    if (fileUrlRef.current) URL.revokeObjectURL(fileUrlRef.current);
    fileUrlRef.current = next?.url ?? null;
    setFile(next);
  };
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (fileUrlRef.current) URL.revokeObjectURL(fileUrlRef.current);
    };
  }, []);

  // Informa ao pai a mídia pronta (gravação ou arquivo).
  useEffect(() => {
    if (file) onMediaChange({ blob: file.blob, kind, durationSec: file.durationSec });
    else if (hasRecording && rec.blob) onMediaChange({ blob: rec.blob, kind, durationSec: Math.max(1, rec.seconds) });
    else onMediaChange(null);
  }, [file, hasRecording, rec.blob, rec.seconds, kind, onMediaChange]);

  const toggleRecording = () => {
    if (isRecording) rec.stop();
    else {
      setFileError(null);
      setFileState(null);
      void rec.start();
    }
  };
  const reRecord = () => {
    rec.reset();
    setFileState(null);
    setFileError(null);
  };

  const onFileChosen = async (e: ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0];
    e.target.value = "";
    if (!chosen) return;
    rec.reset();
    setFileState(null);
    setFileError(null);
    const limits = MEDIA_LIMITS.video;
    if (!VIDEO_FILE_TYPES.includes(chosen.type)) {
      setFileError("Formato não suportado. Envie um vídeo MP4 ou WebM.");
      return;
    }
    if (chosen.size > limits.maxBytes) {
      setFileError(`O vídeo passou de ${limits.maxBytes / 1024 / 1024} MB.`);
      return;
    }
    setReadingFile(true);
    try {
      const duration = await readVideoDuration(chosen);
      if (!mounted.current) return; // painel saiu durante a leitura: não cria URL que ninguém revoga
      if (duration > limits.maxSeconds) {
        setFileError(`O vídeo passou de ${limits.maxSeconds / 60} minutos.`);
        return;
      }
      setFileState({ blob: chosen, url: URL.createObjectURL(chosen), durationSec: Math.max(1, Math.round(duration)) });
    } catch {
      if (mounted.current) setFileError("Não foi possível ler este vídeo. Tente outro arquivo.");
    } finally {
      if (mounted.current) setReadingFile(false);
    }
  };

  const errorMessage = rec.error ?? fileError;
  const busy = disabled || rec.status === "requesting" || readingFile;

  // ── ÁUDIO ──
  if (kind === "audio") {
    return (
      <div className="flex flex-col items-center gap-5 py-4">
        {/* Waveform */}
        <AudioWave
          heights={waveHeights}
          color={hasRecording ? accentColor : isRecording ? BRAND.red : "var(--muted-foreground)"}
        />

        {/* Time counter */}
        <div className="flex items-center gap-3">
          {isRecording && <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: BRAND.red }} />}
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "1.8rem",
              color: "var(--foreground)",
              fontWeight: 700,
            }}
          >
            {formatRecTime(rec.seconds)}
          </span>
          <span style={{ fontFamily: "Inter", fontSize: "0.7rem", color: "var(--muted-foreground)" }}>
            / {formatRecTime(maxSeconds)}
          </span>
        </div>

        {errorMessage && <RecorderAlert message={errorMessage} />}

        {/* Controls */}
        {!hasRecording ? (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={toggleRecording}
              disabled={busy}
              aria-label={isRecording ? "Parar gravação" : "Gravar"}
              className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-105 disabled:opacity-40"
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
              {rec.status === "requesting"
                ? "Aguardando o microfone..."
                : isRecording
                  ? "Clique para parar"
                  : "Clique para gravar"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full">
            {rec.previewUrl && <audio controls src={rec.previewUrl} className="w-full" />}
            <button
              onClick={reRecord}
              disabled={disabled}
              className="px-4 py-2 rounded-xl text-sm bg-card hover:bg-muted transition-colors"
              style={{ fontFamily: "Inter", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
            >
              Regravar
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
            <Check size={12} /> Gravação pronta · {formatRecTime(rec.seconds)}
          </p>
        )}
      </div>
    );
  }

  // ── VÍDEO ──
  const ready = hasRecording || file !== null;
  const readySeconds = file ? file.durationSec : rec.seconds;
  const playbackUrl = file?.url ?? rec.previewUrl;
  return (
    <>
      {/* Camera viewfinder */}
      <div
        className="w-full rounded-xl relative overflow-hidden flex items-center justify-center"
        style={{ aspectRatio: "16/9", background: "var(--foreground)" }}
      >
        {isRecording && rec.stream && (
          <video
            muted
            playsInline
            autoPlay
            className="absolute inset-0 w-full h-full object-cover"
            ref={(el) => {
              if (el && "srcObject" in el && el.srcObject !== rec.stream) el.srcObject = rec.stream;
            }}
          />
        )}
        {ready && !isRecording && playbackUrl && (
          <video controls playsInline src={playbackUrl} className="absolute inset-0 w-full h-full object-contain" />
        )}

        {/* Corner brackets */}
        {!ready &&
          [
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
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem", color: "white" }}>
              {formatRecTime(rec.seconds)} / {formatRecTime(maxSeconds)}
            </span>
          </div>
        )}

        {/* Waveform inside camera (audio feedback) */}
        {isRecording && (
          <div className="absolute bottom-3 left-3 right-3">
            <AudioWave heights={waveHeights} color={accentColor} />
          </div>
        )}

        {/* Idle state */}
        {!isRecording && !ready && (
          <div className="flex flex-col items-center gap-3 opacity-40">
            <Video size={32} color="white" />
            <p style={{ fontFamily: "Inter", fontSize: "0.75rem", color: "var(--background)" }}>
              {rec.status === "requesting"
                ? "Aguardando a câmera..."
                : readingFile
                  ? "Lendo o arquivo..."
                  : `Até ${formatRecTime(maxSeconds)} de vídeo`}
            </p>
          </div>
        )}
      </div>

      {errorMessage && <RecorderAlert message={errorMessage} />}

      {/* Video controls */}
      <div className="flex items-center justify-center gap-4 flex-wrap">
        {!ready ? (
          <>
            <button
              onClick={toggleRecording}
              disabled={busy}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105 disabled:opacity-40"
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
            {!isRecording && (
              <label
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-card hover:bg-muted transition-colors cursor-pointer"
                style={{
                  fontFamily: "Inter",
                  color: "var(--muted-foreground)",
                  border: "1px solid var(--border)",
                  opacity: busy ? 0.4 : 1,
                }}
              >
                <Upload size={14} /> Enviar arquivo
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  className="sr-only"
                  disabled={busy}
                  onChange={(e) => void onFileChosen(e)}
                />
              </label>
            )}
          </>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={reRecord}
              disabled={disabled}
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
              <Check size={12} /> Vídeo pronto · {formatRecTime(readySeconds)}
            </p>
          </div>
        )}
      </div>
    </>
  );
}

export function PostPublisher({
  sessionId,
  theme,
  accentColor,
  onPublished,
  onSkip,
}: {
  sessionId: string | null;
  theme: string;
  accentColor: string;
  onPublished: (result: { postId: string; coinsEarned: number }) => void;
  onSkip: () => void;
}) {
  const services = useServices();
  const [postType, setPostType] = useState<PostType>("text");
  const [title, setTitle] = useState(`O que aprendi sobre ${theme}`);
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<ReadyMedia | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [publishError, setPublishError] = useState<unknown>(null);
  const submittingRef = useRef(false);

  const isDarkAccent = accentColor === BRAND.yellow;
  const titleOk = title.trim().length >= 3;
  const canPublish = !submitting && titleOk && (postType === "text" || (media !== null && media.kind === postType));

  const selectType = (t: PostType) => {
    if (t === postType || submitting) return;
    setMedia(null);
    setPublishError(null);
    setPostType(t);
  };

  const handlePublish = async () => {
    if (!canPublish || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setPublishError(null);
    try {
      let mediaUrl: string | null = null;
      let mediaDurationSec: number | null = null;
      if (postType !== "text" && media) {
        const uploaded = await services.media.upload(media.blob, media.kind, media.durationSec);
        mediaUrl = uploaded.url;
        mediaDurationSec = uploaded.durationSec;
      }
      const body =
        postType === "text"
          ? content.trim() || `Aprendi sobre ${theme} durante esta sessão de estudo.`
          : postType === "audio"
            ? `Reflexões sobre ${theme}`
            : `Explicando ${theme}`;
      const { post, reward } = await services.posts.create({
        sessionId,
        type: postType,
        title: title.trim(),
        content: body,
        mediaUrl,
        mediaDurationSec,
      });
      onPublished({ postId: post.id, coinsEarned: reward?.coinsEarned ?? 0 });
    } catch (err) {
      // Mantém o rascunho (título, texto e mídia) para tentar de novo.
      setPublishError(err);
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const titleInput = (placeholder: string) => (
    <input
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      placeholder={placeholder}
      disabled={submitting}
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
  );

  return (
    <div className="flex flex-col items-center gap-5 w-full py-8 px-6" style={{ maxWidth: 580, margin: "0 auto" }}>
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
            onClick={() => selectType(t)}
            aria-pressed={postType === t}
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
          {titleInput("Título do artigo")}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={submitting}
            rows={7}
            placeholder={`Escreva sobre o que você aprendeu em ${theme}...\n\nCompartilhe insights, dificuldades superadas ou conexões que você fez com outros temas.`}
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
                color: titleOk ? BRAND.green : "#9CA3AF",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {titleOk ? (
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

      {/* ── AUDIO / VIDEO FORMAT ── */}
      {postType !== "text" && (
        <div
          className="w-full bg-card rounded-2xl p-5 flex flex-col gap-4"
          style={{ border: "1px solid var(--border)" }}
        >
          {titleInput(postType === "audio" ? "Título do áudio" : "Título do vídeo")}
          <RecorderPanel
            key={postType}
            kind={postType}
            accentColor={accentColor}
            disabled={submitting}
            onMediaChange={setMedia}
          />
        </div>
      )}

      {publishError != null && (
        <div className="w-full">
          <ErrorMessage error={publishError} />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 w-full">
        <button
          onClick={onSkip}
          disabled={submitting}
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
          onClick={() => void handlePublish()}
          disabled={!canPublish}
          className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{
            fontFamily: "'Outfit', sans-serif",
            background: accentColor,
            color: isDarkAccent ? "#92400E" : BRAND.dark,
          }}
        >
          <Send size={15} /> {submitting ? "Publicando..." : "Publicar no feed"}
        </button>
      </div>
    </div>
  );
}
