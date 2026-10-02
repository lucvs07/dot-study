import { useCallback, useEffect, useRef, useState } from "react";
import { MEDIA_LIMITS } from "@/services/contracts";

export type RecorderStatus = "idle" | "requesting" | "recording" | "recorded" | "error";
export type RecorderKind = "audio" | "video";

export function isRecordingSupported(): boolean {
  return typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
}

function pickMime(kind: RecorderKind): string | undefined {
  const candidates =
    kind === "audio"
      ? ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]
      : ["video/webm;codecs=vp9,opus", "video/webm", "video/mp4"];
  return candidates.find((t) => MediaRecorder.isTypeSupported?.(t));
}

function describeError(err: unknown, kind: RecorderKind): string {
  const device = kind === "audio" ? "microfone" : "câmera e ao microfone";
  const name = (err as { name?: string })?.name;
  if (name === "NotAllowedError" || name === "SecurityError")
    return `Permita o acesso ao ${device} nas configurações do navegador para gravar.`;
  if (name === "NotFoundError")
    return `Nenhum ${kind === "audio" ? "microfone" : "dispositivo de câmera"} foi encontrado.`;
  return "Não foi possível iniciar a gravação. Tente de novo.";
}

/** O jsdom (e navegadores antigos) podem não ter revokeObjectURL. */
function revokeUrl(url: string | null) {
  if (url && typeof URL.revokeObjectURL === "function") URL.revokeObjectURL(url);
}

const stopTracks = (s: MediaStream | null) => s?.getTracks().forEach((t) => t.stop());

/**
 * Grava áudio ou vídeo com a MediaRecorder API. Para sozinho ao atingir
 * `MEDIA_LIMITS[kind].maxSeconds`. O tempo é medido pelo relógio (Date.now),
 * não pela contagem de ticks, então não atrasa com a aba em segundo plano.
 */
export function useMediaRecorder(kind: RecorderKind) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewRef = useRef<string | null>(null);
  const startedAt = useRef(0);
  /** Incrementado ao descartar: um start() que ainda aguarda a permissão é cancelado. */
  const generation = useRef(0);
  const maxSeconds = MEDIA_LIMITS[kind].maxSeconds;

  const stop = useCallback(() => {
    if (recorder.current?.state === "recording") recorder.current.stop();
  }, []);

  /** Descarta o gravador atual sem produzir blob (regravar / desmontar). */
  const discardRecorder = useCallback(() => {
    generation.current += 1;
    const rec = recorder.current;
    if (rec) {
      rec.ondataavailable = null;
      rec.onstop = null;
      if (rec.state === "recording") rec.stop();
    }
    recorder.current = null;
    stopTracks(streamRef.current);
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    if (recorder.current?.state === "recording") return;
    setError(null);
    if (!isRecordingSupported()) {
      setStatus("error");
      setError("Este navegador não permite gravar. Publique em texto ou use Chrome/Firefox atualizados.");
      return;
    }
    setStatus("requesting");
    const myGeneration = generation.current;
    let media: MediaStream | null = null;
    try {
      media = await navigator.mediaDevices.getUserMedia(
        kind === "audio" ? { audio: true } : { audio: true, video: { width: 640, height: 480 } },
      );
      // Descartado (regravar, troca de aba, desmontagem) enquanto pedia permissão: solta o dispositivo.
      if (generation.current !== myGeneration) {
        stopTracks(media);
        return;
      }
      const mimeType = pickMime(kind);
      const rec = new MediaRecorder(media, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];
      const ownStream = media;
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      rec.onstop = () => {
        const out = new Blob(chunks, { type: chunks[0]?.type || mimeType || `${kind}/webm` });
        revokeUrl(previewRef.current);
        const url = URL.createObjectURL(out);
        previewRef.current = url;
        setBlob(out);
        setPreviewUrl(url);
        setSeconds(Math.min(maxSeconds, Math.round((Date.now() - startedAt.current) / 1000)));
        setStatus("recorded");
        stopTracks(ownStream);
        if (streamRef.current === ownStream) streamRef.current = null;
        setStream(null);
      };
      recorder.current = rec;
      streamRef.current = media;
      startedAt.current = Date.now();
      setSeconds(0);
      setStream(media);
      rec.start(1000);
      setStatus("recording");
    } catch (err) {
      stopTracks(media);
      if (generation.current !== myGeneration) return;
      recorder.current = null;
      streamRef.current = null;
      setStream(null);
      setStatus("error");
      setError(describeError(err, kind));
    }
  }, [kind, maxSeconds]);

  useEffect(() => {
    if (status !== "recording") return;
    const id = setInterval(() => {
      const s = Math.floor((Date.now() - startedAt.current) / 1000);
      setSeconds(Math.min(maxSeconds, s));
      if (s >= maxSeconds) stop();
    }, 250);
    return () => clearInterval(id);
  }, [status, maxSeconds, stop]);

  const reset = useCallback(() => {
    discardRecorder();
    revokeUrl(previewRef.current);
    previewRef.current = null;
    setStream(null);
    setBlob(null);
    setPreviewUrl(null);
    setSeconds(0);
    setError(null);
    setStatus("idle");
  }, [discardRecorder]);

  // Ao desmontar: solta câmera/microfone e a URL de prévia.
  useEffect(
    () => () => {
      discardRecorder();
      revokeUrl(previewRef.current);
    },
    [discardRecorder],
  );

  return { status, seconds, blob, previewUrl, stream, error, start, stop, reset };
}
