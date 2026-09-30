/* eslint-disable react-refresh/only-export-components -- exporta o provider junto do hook useStudy */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useCountdown, type Countdown } from "@/hooks/useCountdown";
import { useServices } from "@/services/ServicesContext";
import type { CoinReward, StartSessionInput, StudySession } from "@/services/contracts";
import { queryKeys } from "@/app/queryKeys";
import type { Article } from "./articleData";

export type StudyChallenge = { subjectName: string; subjectColor: string; theme: string };

/** `summary` = resumo do modo livre; `publishing` = convite para publicar após o desafio. */
export type StudyPhase = "setup" | "work" | "break" | "publishing" | "summary";

const NOTES_DEBOUNCE_MS = 800;

export interface StudyContextValue {
  challenge: StudyChallenge | null;
  setChallenge: (c: StudyChallenge | null) => void;
  selectedArticle: Article | null;
  setSelectedArticle: (a: Article | null) => void;
  activeSessionId: string | null;

  /** Dono único do cronômetro: continua rodando quando a rota muda (ex.: leitura). */
  countdown: Countdown;
  session: StudySession | null;
  phase: StudyPhase;
  /** Recompensa do último ciclo concluído. */
  reward: CoinReward | null;
  error: unknown;
  clearError: () => void;
  notes: string;
  setNotes: (notes: string) => void;
  flushNotes: () => Promise<void>;
  startSession: (input: StartSessionInput) => Promise<StudySession | null>;
  /** Encerra como `abandoned` a sessão em andamento (se houver) e volta ao setup. */
  abandon: () => Promise<void>;
  /**
   * Parar antes do fim (modo livre): encerra como `abandoned`; se já houve ciclo concluído
   * vai para o resumo (`summary`), senão volta ao setup.
   */
  stop: () => Promise<void>;
  /** Volta ao setup sem mexer na sessão (já concluída/encerrada). */
  endSession: () => void;
  /** Invalida as queries que dependem de moedas, ciclos e sessões. */
  invalidateProgress: () => Promise<void>;
}

const StudyContext = createContext<StudyContextValue | null>(null);

export function StudyProvider({ children }: { children: ReactNode }) {
  const services = useServices();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const [challenge, setChallenge] = useState<StudyChallenge | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [session, setSessionState] = useState<StudySession | null>(null);
  const [phase, setPhaseState] = useState<StudyPhase>("setup");
  const [reward, setReward] = useState<CoinReward | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [notes, setNotesState] = useState("");

  // Refs espelham o estado mais recente: o fim do cronômetro dispara fora do ciclo de
  // render (e às vezes com a EstudarPage desmontada), então nada pode depender de closure.
  const sessionRef = useRef<StudySession | null>(null);
  const phaseRef = useRef<StudyPhase>("setup");
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingNotes = useRef<{ sessionId: string; notes: string } | null>(null);

  const setSession = useCallback((s: StudySession | null) => {
    sessionRef.current = s;
    setSessionState(s);
  }, []);
  const setPhase = useCallback((p: StudyPhase) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);

  const invalidateProgress = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.me }),
      queryClient.invalidateQueries({ queryKey: queryKeys.stats }),
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions }),
      queryClient.invalidateQueries({ queryKey: ["ranking"] }),
    ]);
  }, [queryClient]);

  const flushNotes = useCallback(async () => {
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = null;
    const pending = pendingNotes.current;
    pendingNotes.current = null;
    if (!pending) return;
    try {
      await services.sessions.updateNotes(pending.sessionId, pending.notes);
    } catch {
      // Anotação é secundária: uma falha aqui não pode travar o fluxo do timer.
    }
  }, [services]);

  const setNotes = useCallback(
    (text: string) => {
      setNotesState(text);
      const current = sessionRef.current;
      if (!current) return;
      pendingNotes.current = { sessionId: current.id, notes: text };
      if (notesTimer.current) clearTimeout(notesTimer.current);
      notesTimer.current = setTimeout(() => void flushNotes(), NOTES_DEBOUNCE_MS);
    },
    [flushNotes],
  );

  const resetState = useCallback(() => {
    setSession(null);
    setPhase("setup");
    setChallenge(null);
    setReward(null);
    setNotesState("");
  }, [setSession, setPhase]);

  // `handleFinish` é chamado pelo useCountdown via ref (sempre a versão mais nova) e lê
  // o estado pelos refs acima — sem closures velhas.
  const handleFinish = async () => {
    const current = sessionRef.current;
    if (!current) return;
    if (phaseRef.current === "break") {
      setPhase("work");
      countdown.start(current.focusMinutes * 60);
      return;
    }
    if (phaseRef.current !== "work") return;
    try {
      await flushNotes();
      const result = await services.sessions.completeCycle(current.id);
      if (sessionRef.current?.id !== current.id) return; // resetou/trocou de modo no meio
      setSession(result.session);
      setReward(result.reward);
      void invalidateProgress();
      if (result.session.mode === "challenge") {
        setPhase("publishing");
        if (pathRef.current !== "/estudar") navigate("/estudar");
      } else if (result.session.status === "in_progress") {
        setPhase("break");
        countdown.start(result.session.breakMinutes * 60);
      } else {
        setPhase("summary");
      }
    } catch (e) {
      if (sessionRef.current?.id !== current.id) return;
      setError(e);
      resetState();
      if (pathRef.current !== "/estudar") navigate("/estudar");
    }
  };

  const countdown = useCountdown(() => void handleFinish());
  const { start: startCountdown, reset: resetCountdown } = countdown;

  const startSession = useCallback(
    async (input: StartSessionInput) => {
      setError(null);
      try {
        const created = await services.sessions.start(input);
        setSession(created);
        setReward(null);
        setNotesState("");
        setPhase("work");
        startCountdown(created.focusMinutes * 60);
        void queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
        return created;
      } catch (e) {
        setError(e);
        return null;
      }
    },
    [services, queryClient, setSession, setPhase, startCountdown],
  );

  const abandon = useCallback(async () => {
    const current = sessionRef.current;
    resetCountdown(0);
    resetState();
    await flushNotes();
    if (current && current.status === "in_progress") {
      try {
        await services.sessions.finish(current.id, "abandoned");
      } catch (e) {
        setError(e);
      }
      void invalidateProgress();
    }
  }, [services, resetCountdown, resetState, flushNotes, invalidateProgress]);

  const stop = useCallback(async () => {
    const current = sessionRef.current;
    if (!current) return;
    resetCountdown(0);
    await flushNotes();
    let updated = current;
    try {
      updated = await services.sessions.finish(current.id, "abandoned");
    } catch (e) {
      setError(e);
    }
    void invalidateProgress();
    if (sessionRef.current?.id !== current.id) return;
    if (updated.completedCycles > 0) {
      setSession(updated);
      setPhase("summary");
    } else {
      resetState();
    }
  }, [services, resetCountdown, flushNotes, invalidateProgress, setSession, setPhase, resetState]);

  const endSession = useCallback(() => {
    resetCountdown(0);
    resetState();
  }, [resetCountdown, resetState]);

  useEffect(
    () => () => {
      if (notesTimer.current) clearTimeout(notesTimer.current);
    },
    [],
  );

  const value: StudyContextValue = {
    challenge,
    setChallenge,
    selectedArticle,
    setSelectedArticle,
    activeSessionId: session?.id ?? null,
    countdown,
    session,
    phase,
    reward,
    error,
    clearError: () => setError(null),
    notes,
    setNotes,
    flushNotes,
    startSession,
    abandon,
    stop,
    endSession,
    invalidateProgress,
  };
  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy(): StudyContextValue {
  const value = useContext(StudyContext);
  if (!value) throw new Error("useStudy precisa estar dentro de <StudyProvider>");
  return value;
}
