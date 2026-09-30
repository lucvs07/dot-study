import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  Pause,
  PenLine,
  Play,
  RotateCcw,
  Shuffle,
  Sparkles,
  Trophy,
} from "lucide-react";
import { BRAND } from "@/domain/brand";
import { getDifficultyPresets, type DifficultyId } from "@/domain/difficulty";
import { COINS, sessionMinutes } from "@/domain/rules";
import { SUBJECT_ICONS } from "@/domain/subjectIcons";
import { CircularTimer } from "@/components/CircularTimer";
import { DurationPicker } from "@/components/DurationPicker";
import { ErrorMessage } from "@/components/ErrorMessage";
import { FreeSessionSummary } from "@/components/FreeSessionSummary";
import { LoadingState } from "@/components/LoadingState";
import { articlesForTheme } from "@/content/articleData";
import { useStudy } from "@/content/StudyContext";
import { PostPublisher, useLegacyState, type FeedArticle, type PublisherChallenge } from "@/app/App";
import { queryKeys } from "@/app/queryKeys";
import { useServices } from "@/services/ServicesContext";
import type { SessionMode } from "@/services/contracts";

const SRC_COLORS: Record<string, string> = {
  arXiv: "#B91C1C",
  "Semantic Scholar": "#1D4ED8",
  CORE: "#065F46",
};

export function EstudarPage() {
  const services = useServices();
  const navigate = useNavigate();
  const study = useStudy();
  // LEGADO: cor/acessório com as sobrescritas locais da loja e o feed em memória (Tasks 13–15).
  const { dotColor, activeAccessory, addArticle } = useLegacyState();
  const { countdown, session, phase } = study;

  const subjectsQuery = useQuery({ queryKey: queryKeys.subjects, queryFn: () => services.subjects.list() });
  const difficulties = useMemo(() => getDifficultyPresets(), []);

  // ── Escolhas do setup (o que está rodando vem do StudyContext) ─────────
  const [modeChoice, setModeChoice] = useState<SessionMode>(() => session?.mode ?? "challenge");
  const [difficultyId, setDifficultyId] = useState<DifficultyId>("medium");
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | "random" | null>(null);
  const [freeLabel, setFreeLabel] = useState("");
  const [freeDuration, setFreeDuration] = useState(25);
  const [freeBreak, setFreeBreak] = useState(5);
  const [freeSessionCount, setFreeSessionCount] = useState(2);
  const [starting, setStarting] = useState(false);
  const [publishError, setPublishError] = useState<unknown>(null);

  const timerMode: SessionMode = session?.mode ?? modeChoice;
  const difficulty = difficulties.find((d) => d.id === difficultyId) ?? difficulties[0];
  const subjects = useMemo(
    () => (subjectsQuery.data ?? []).map((s) => ({ ...s, Icon: SUBJECT_ICONS[s.icon] })),
    [subjectsQuery.data],
  );

  // Assunto e tema do desafio derivados da sessão real (sobrevivem à ida para a leitura).
  const active = useMemo<PublisherChallenge | null>(() => {
    if (!session || session.mode !== "challenge") return null;
    const subject = subjects.find((s) => s.id === session.subjectId);
    const theme = subject?.themes.find((t) => t.id === session.themeId);
    if (!subject || !theme) return null;
    return { subject: { name: subject.name, color: subject.color, icon: subject.Icon }, theme: theme.title };
  }, [session, subjects]);
  const articles = useMemo(() => (active ? articlesForTheme(active.theme) : []), [active]);

  const activeColor = active?.subject.color ?? dotColor;
  const totalTime = Math.max(1, countdown.totalSeconds);
  const freeRunning = timerMode === "free" && (phase === "work" || phase === "break");
  const freePhase: "work" | "break" = phase === "break" ? "break" : "work";

  const toggleRunning = () => (countdown.isRunning ? countdown.pause() : countdown.resume());

  const startChallenge = async () => {
    if (selectedSubjectId === null || starting) return;
    setStarting(true);
    const created = await study.startSession({
      mode: "challenge",
      subjectId: selectedSubjectId,
      focusMinutes: difficulty.minutes,
    });
    setStarting(false);
    if (!created) return;
    const subject = subjects.find((s) => s.id === created.subjectId);
    const theme = subject?.themes.find((t) => t.id === created.themeId);
    study.setChallenge(
      subject && theme ? { subjectName: subject.name, subjectColor: subject.color, theme: theme.title } : null,
    );
  };

  const startFree = async () => {
    if (starting) return;
    setStarting(true);
    await study.startSession({
      mode: "free",
      label: freeLabel || null,
      focusMinutes: freeDuration,
      breakMinutes: freeBreak,
      plannedCycles: freeSessionCount,
    });
    setStarting(false);
  };

  const switchMode = (m: SessionMode) => {
    if (session) void study.abandon();
    study.clearError();
    setModeChoice(m);
  };

  /** Nota opcional do resumo do modo livre: soma às anotações feitas durante a sessão. */
  const finishFreeSummary = async (note: string | null) => {
    if (session && note) {
      await study.flushNotes();
      const typed = study.notes.trim();
      try {
        await services.sessions.updateNotes(session.id, typed ? `${typed}\n\n${note}` : note);
        void study.invalidateProgress();
      } catch {
        // A nota é opcional: se falhar, o resumo fecha do mesmo jeito.
      }
    }
    study.endSession();
  };

  const handlePublish = async (article: FeedArticle) => {
    if (!session) return;
    setPublishError(null);
    try {
      // Mídia real só na Task 14: por ora todo post vai como texto.
      await services.posts.create({
        sessionId: session.id,
        type: "text",
        title: article.title,
        content: article.excerpt,
      });
    } catch (e) {
      setPublishError(e);
      return;
    }
    addArticle(article); // LEGADO: o FeedView antigo lê do estado em memória (Task 13).
    void study.invalidateProgress();
    study.endSession();
    navigate("/feed");
  };

  const handleSkip = () => {
    setPublishError(null);
    study.endSession();
  };

  if (subjectsQuery.isLoading) return <LoadingState />;
  if (subjectsQuery.error)
    return <ErrorMessage error={subjectsQuery.error} onRetry={() => void subjectsQuery.refetch()} />;

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Mode tabs */}
      {phase !== "publishing" && (
        <div className="flex justify-center pt-8 pb-2">
          <div className="flex rounded-xl overflow-hidden bg-card" style={{ border: "1px solid var(--border)" }}>
            {(["challenge", "free"] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className="px-6 py-2.5 text-sm transition-colors"
                style={{
                  fontFamily: "Inter",
                  fontWeight: 600,
                  background: timerMode === m ? BRAND.dark : "transparent",
                  color: timerMode === m ? "white" : "#6B7280",
                }}
              >
                {m === "challenge" ? (
                  <>
                    <Trophy size={14} className="inline mr-1" /> Desafio
                  </>
                ) : (
                  <>
                    <Clock size={14} className="inline mr-1" /> Livre
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {study.error != null && (
        <div className="w-full max-w-2xl mx-auto px-8 pt-4">
          <ErrorMessage error={study.error} />
        </div>
      )}

      {/* ── CHALLENGE MODE ── */}
      {timerMode === "challenge" && (
        <>
          {/* ── SETUP ── */}
          {phase === "setup" && (
            <div className="flex flex-col items-center p-8 gap-6">
              <div className="w-full max-w-2xl flex flex-col gap-6">
                {/* Difficulty */}
                <div>
                  <p
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      color: "var(--foreground)",
                      marginBottom: 14,
                    }}
                  >
                    Dificuldade
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {difficulties.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setDifficultyId(d.id)}
                        className="flex flex-col gap-1 p-4 rounded-2xl text-left transition-all hover:scale-[1.02]"
                        style={{
                          border: `2.5px solid ${difficultyId === d.id ? d.color : "var(--border)"}`,
                          background: difficultyId === d.id ? `${d.color}12` : "var(--card)",
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            style={{
                              fontFamily: "'Outfit', sans-serif",
                              fontWeight: 700,
                              fontSize: "0.9rem",
                              color: difficultyId === d.id ? d.color : "var(--foreground)",
                            }}
                          >
                            {d.label}
                          </span>
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              color: d.color,
                            }}
                          >
                            {d.minutes}min
                          </span>
                        </div>
                        <span style={{ fontFamily: "Inter", fontSize: "0.7rem", color: "var(--muted-foreground)" }}>
                          {d.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <p
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      color: "var(--foreground)",
                      marginBottom: 14,
                    }}
                  >
                    Assunto
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {subjects.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSubjectId(s.id)}
                        className="flex items-center gap-3 p-4 rounded-2xl text-left bg-card transition-all hover:scale-[1.02]"
                        style={{
                          border: `2.5px solid ${selectedSubjectId === s.id ? s.color : "var(--border)"}`,
                          background: selectedSubjectId === s.id ? `${s.color}10` : "var(--card)",
                        }}
                      >
                        <span style={{ color: s.color }}>
                          <s.Icon size={22} />
                        </span>
                        <div>
                          <div
                            style={{
                              fontFamily: "'Outfit', sans-serif",
                              fontWeight: 600,
                              fontSize: "0.88rem",
                              color: "var(--foreground)",
                            }}
                          >
                            {s.name}
                          </div>
                          <div style={{ fontFamily: "Inter", fontSize: "0.7rem", color: "var(--muted-foreground)" }}>
                            {s.themes.length} temas
                          </div>
                        </div>
                        {selectedSubjectId === s.id && (
                          <Check size={16} color={s.color} style={{ marginLeft: "auto" }} />
                        )}
                      </button>
                    ))}
                    <button
                      onClick={() => setSelectedSubjectId("random")}
                      className="flex items-center gap-3 p-4 rounded-2xl text-left bg-card transition-all hover:scale-[1.02]"
                      style={{
                        border: `2.5px solid ${selectedSubjectId === "random" ? BRAND.yellow : "var(--border)"}`,
                        background: selectedSubjectId === "random" ? `${BRAND.yellow}10` : "var(--card)",
                      }}
                    >
                      <Shuffle size={24} color={BRAND.yellow} />
                      <div>
                        <div
                          style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontWeight: 600,
                            fontSize: "0.88rem",
                            color: "var(--foreground)",
                          }}
                        >
                          Aleatório
                        </div>
                        <div style={{ fontFamily: "Inter", fontSize: "0.7rem", color: "var(--muted-foreground)" }}>
                          Surpresa total
                        </div>
                      </div>
                      {selectedSubjectId === "random" && (
                        <Check size={16} color={BRAND.yellow} style={{ marginLeft: "auto" }} />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => void startChallenge()}
                  disabled={selectedSubjectId === null || starting}
                  className="self-center px-10 py-3.5 rounded-2xl font-bold text-base transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    background: "var(--foreground)",
                    color: "var(--background)",
                  }}
                >
                  Iniciar Desafio →
                </button>
              </div>
            </div>
          )}

          {/* ── WORK phase: timer + articles below ── */}
          {phase === "work" && active && (
            <div className="flex flex-col items-center gap-6 px-8 pb-20" style={{ width: "100%" }}>
              {/* Theme card */}
              <div
                className="w-full rounded-2xl p-5"
                style={{ background: "var(--card)", border: "1.5px solid var(--border)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={13} color={dotColor} />
                  <span
                    style={{
                      fontFamily: "Inter",
                      fontSize: "0.68rem",
                      color: dotColor,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Tema do desafio
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ color: active.subject.color }}>
                    <active.subject.icon size={24} />
                  </span>
                  <div>
                    <p style={{ fontFamily: "Inter", fontSize: "0.72rem", color: "var(--muted-foreground)" }}>
                      {active.subject.name}
                    </p>
                    <p
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: 700,
                        fontSize: "1.1rem",
                        color: "var(--foreground)",
                      }}
                    >
                      {active.theme}
                    </p>
                  </div>
                </div>
              </div>

              {/* Circular timer */}
              <CircularTimer timeLeft={countdown.secondsLeft} totalTime={totalTime} color={activeColor} />

              {/* Controls */}
              <div className="flex items-center gap-5">
                <button
                  onClick={() => void study.abandon()}
                  className="w-12 h-12 rounded-full flex items-center justify-center bg-card hover:bg-muted transition-colors"
                  style={{ border: "1px solid var(--border)" }}
                >
                  <RotateCcw size={17} color="#9CA3AF" />
                </button>
                <button
                  onClick={toggleRunning}
                  className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-105"
                  style={{ background: activeColor }}
                >
                  {countdown.isRunning ? (
                    <Pause size={22} color="#111827" />
                  ) : (
                    <Play size={22} color="#111827" fill="#111827" />
                  )}
                </button>
                <div className="w-12 h-12" />
              </div>

              {/* Article cards */}
              <div className="w-full">
                <p
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    color: "var(--foreground)",
                    marginBottom: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <BookOpen size={13} /> Artigos para leitura
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {articles.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        study.setSelectedArticle(a);
                        navigate(`/leitura/${a.id}`);
                      }}
                      className="text-left rounded-2xl p-4 transition-all hover:scale-[1.01]"
                      style={{ background: "var(--card)", border: "1.5px solid var(--border)" }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div style={{ flex: 1 }}>
                          <p
                            style={{
                              fontFamily: "'Outfit', sans-serif",
                              fontWeight: 600,
                              fontSize: "0.88rem",
                              color: "var(--foreground)",
                              marginBottom: 4,
                              lineHeight: 1.3,
                            }}
                          >
                            {a.title}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              style={{
                                fontFamily: "Inter",
                                fontSize: "0.65rem",
                                fontWeight: 600,
                                color: SRC_COLORS[a.source] ?? "#374151",
                                background: `${SRC_COLORS[a.source] ?? "#374151"}14`,
                                padding: "2px 7px",
                                borderRadius: 5,
                              }}
                            >
                              {a.source}
                            </span>
                            <span
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: "0.65rem",
                                color: "var(--muted-foreground)",
                              }}
                            >
                              {a.year}
                            </span>
                            <span
                              style={{ fontFamily: "Inter", fontSize: "0.65rem", color: "var(--muted-foreground)" }}
                            >
                              {a.readTime} min
                            </span>
                            {a.abstractOnly && (
                              <span
                                style={{
                                  fontFamily: "Inter",
                                  fontSize: "0.62rem",
                                  color: "var(--muted-foreground)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 3,
                                }}
                              >
                                <BookOpen size={10} /> só resumo
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight
                          size={16}
                          color="var(--muted-foreground)"
                          style={{ flexShrink: 0, marginTop: 2 }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => void study.abandon()}
                className="text-sm hover:opacity-60 transition-opacity"
                style={{ fontFamily: "Inter", color: "var(--muted-foreground)" }}
              >
                ← Nova sessão
              </button>
            </div>
          )}

          {/* Publishing */}
          {phase === "publishing" && active && (
            <div className="flex flex-col items-center p-8">
              {publishError != null && (
                <div className="w-full" style={{ maxWidth: 580 }}>
                  <ErrorMessage error={publishError} />
                </div>
              )}
              <PostPublisher
                challenge={active}
                coinsEarned={study.reward?.coinsEarned ?? COINS.cycle}
                dotColor={dotColor}
                activeAccessory={activeAccessory}
                onPublish={handlePublish}
                onSkip={handleSkip}
              />
            </div>
          )}
        </>
      )}

      {/* ── FREE SESSION SUMMARY ── */}
      {timerMode === "free" && phase === "summary" && session && (
        <FreeSessionSummary
          totalMinutes={sessionMinutes(session)}
          coinsEarned={session.completedCycles * COINS.cycle}
          dotColor={dotColor}
          activeAccessory={activeAccessory}
          onDone={(note) => void finishFreeSummary(note)}
        />
      )}

      {/* ── FREE MODE ── */}
      {timerMode === "free" && phase !== "summary" && (
        <div className="flex flex-col items-center p-8 gap-6 w-full max-w-sm mx-auto">
          {phase === "setup" && (
            <div
              className="w-full bg-card rounded-2xl p-6 flex flex-col gap-5"
              style={{ border: "1px solid var(--border)" }}
            >
              <h3
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "var(--foreground)",
                }}
              >
                Sessão livre
              </h3>
              <DurationPicker
                label="Foco por sessão"
                value={freeDuration}
                onChange={(v) => {
                  setFreeDuration(v);
                }}
                presets={[15, 20, 25, 30, 45, 50]}
              />
              <DurationPicker
                label="Pausa entre sessões"
                value={freeBreak}
                onChange={(v) => setFreeBreak(v)}
                presets={[5, 10, 15]}
                max={30}
              />
              {/* Session count */}
              <div>
                <span
                  style={{
                    fontFamily: "Inter",
                    fontWeight: 600,
                    fontSize: "0.72rem",
                    color: "var(--muted-foreground)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Número de sessões
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setFreeSessionCount((c) => Math.max(1, c - 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-muted hover:bg-border transition-colors"
                    style={{
                      border: "1px solid var(--border)",
                      fontFamily: "Inter",
                      fontSize: "1.1rem",
                      color: "var(--foreground)",
                      fontWeight: 700,
                    }}
                  >
                    −
                  </button>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "1.2rem",
                      fontWeight: 700,
                      color: "var(--foreground)",
                      minWidth: 24,
                      textAlign: "center",
                    }}
                  >
                    {freeSessionCount}
                  </span>
                  <button
                    onClick={() => setFreeSessionCount((c) => Math.min(8, c + 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-muted hover:bg-border transition-colors"
                    style={{
                      border: "1px solid var(--border)",
                      fontFamily: "Inter",
                      fontSize: "1.1rem",
                      color: "var(--foreground)",
                      fontWeight: 700,
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
              {/* Total time summary */}
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-3"
                style={{ background: `${dotColor}10`, border: `1px solid ${dotColor}30` }}
              >
                <Clock size={13} color={dotColor} />
                <span style={{ fontFamily: "Inter", fontSize: "0.78rem", color: dotColor, fontWeight: 600 }}>
                  {freeSessionCount * freeDuration + (freeSessionCount - 1) * freeBreak} min no total
                </span>
                <span
                  style={{
                    fontFamily: "Inter",
                    fontSize: "0.72rem",
                    color: "var(--muted-foreground)",
                    marginLeft: "auto",
                  }}
                >
                  {freeSessionCount}×{freeDuration}min + {freeSessionCount - 1}×{freeBreak}min pausa
                </span>
              </div>
              <div>
                <span
                  style={{
                    fontFamily: "Inter",
                    fontWeight: 600,
                    fontSize: "0.72rem",
                    color: "var(--muted-foreground)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Rótulo (opcional)
                </span>
                <input
                  value={freeLabel}
                  onChange={(e) => setFreeLabel(e.target.value)}
                  placeholder="Ex: Revisão de véspera..."
                  className="w-full rounded-xl px-3 py-2.5 outline-none"
                  style={{
                    fontFamily: "Inter",
                    fontSize: "0.84rem",
                    color: "var(--foreground)",
                    background: "var(--muted)",
                    border: "1px solid var(--border)",
                  }}
                />
              </div>
              <button
                onClick={() => void startFree()}
                disabled={starting}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02]"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  background: "var(--foreground)",
                  color: "var(--background)",
                }}
              >
                Começar sessão livre
              </button>
            </div>
          )}
          {freeRunning && session && (
            <>
              <div
                className="w-full rounded-2xl p-4"
                style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <p style={{ fontFamily: "Inter", fontSize: "0.72rem", color: "var(--muted-foreground)" }}>
                    {freePhase === "work"
                      ? `Sessão ${session.completedCycles + 1} de ${session.plannedCycles}`
                      : "Pausa"}{" "}
                    · {freePhase === "work" ? session.focusMinutes : session.breakMinutes}min
                  </p>
                  <span
                    style={{
                      fontFamily: "Inter",
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      color: freePhase === "work" ? dotColor : BRAND.green,
                      background: freePhase === "work" ? `${dotColor}18` : `${BRAND.green}18`,
                      padding: "2px 7px",
                      borderRadius: 5,
                    }}
                  >
                    {freePhase === "work" ? "Foco" : "Pausa"}
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "var(--foreground)",
                  }}
                >
                  {session.label || "Sem rótulo"}
                </p>
              </div>
              <CircularTimer
                timeLeft={countdown.secondsLeft}
                totalTime={totalTime}
                color={freePhase === "work" ? dotColor : BRAND.green}
              />
              <div className="flex items-center gap-5">
                <button
                  onClick={() => void study.stop()}
                  aria-label="Encerrar sessão"
                  className="w-12 h-12 rounded-full flex items-center justify-center bg-card hover:bg-muted transition-colors"
                  style={{ border: "1px solid var(--border)" }}
                >
                  <RotateCcw size={17} color="#9CA3AF" />
                </button>
                <button
                  onClick={toggleRunning}
                  className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-105"
                  style={{ background: dotColor }}
                >
                  {countdown.isRunning ? (
                    <Pause size={22} color="#111827" />
                  ) : (
                    <Play size={22} color="#111827" fill="#111827" />
                  )}
                </button>
              </div>
              <div className="w-full">
                <p
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    color: "var(--foreground)",
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <PenLine size={13} /> Anotações
                </p>
                <textarea
                  value={study.notes}
                  onChange={(e) => study.setNotes(e.target.value)}
                  placeholder="O que você está aprendendo?"
                  className="w-full resize-none rounded-xl p-3 outline-none"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    fontFamily: "Inter",
                    fontSize: "0.82rem",
                    color: "var(--foreground)",
                    lineHeight: 1.65,
                    minHeight: 90,
                  }}
                />
              </div>
              <button
                onClick={() => void study.abandon()}
                className="text-sm hover:opacity-60 transition-opacity"
                style={{ fontFamily: "Inter", color: "var(--muted-foreground)" }}
              >
                ← Reconfigurar
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
