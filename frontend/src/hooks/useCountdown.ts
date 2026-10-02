import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Contagem regressiva baseada em horário-limite (`deadline`, em ms): o tempo restante
 * é sempre recalculado a partir de `Date.now()`, então intervalos estrangulados (aba em
 * segundo plano) não atrasam o fim. Tick a cada 250 ms; `onFinish` é chamado uma vez.
 */
export function useCountdown(onFinish: () => void) {
  const [totalSeconds, setTotal] = useState(0);
  const [secondsLeft, setLeft] = useState(0);
  const [isRunning, setRunning] = useState(false);
  const deadline = useRef<number | null>(null);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const tick = useCallback(() => {
    if (deadline.current === null) return;
    const left = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
    setLeft(left);
    if (left === 0) {
      deadline.current = null;
      setRunning(false);
      onFinishRef.current();
    }
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(tick, 250);
    const onVisible = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isRunning, tick]);

  const start = useCallback((seconds: number) => {
    deadline.current = Date.now() + seconds * 1000;
    setTotal(seconds);
    setLeft(seconds);
    setRunning(true);
  }, []);

  const pause = useCallback(() => {
    if (deadline.current === null) return;
    setLeft(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)));
    deadline.current = null;
    setRunning(false);
  }, []);

  const resume = useCallback(() => {
    setLeft((left) => {
      if (left > 0) {
        deadline.current = Date.now() + left * 1000;
        setRunning(true);
      }
      return left;
    });
  }, []);

  const reset = useCallback((seconds: number) => {
    deadline.current = null;
    setRunning(false);
    setTotal(seconds);
    setLeft(seconds);
  }, []);

  return { secondsLeft, totalSeconds, isRunning, start, pause, resume, reset };
}

export type Countdown = ReturnType<typeof useCountdown>;
