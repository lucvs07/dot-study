import { useCallback, useEffect, useRef, useState } from "react";

export type WakeupState = "checking" | "waking" | "ready" | "down";

export function useServerWakeup(
  ping: () => Promise<void>,
  {
    slowAfterMs = 2000,
    giveUpAfterMs = 70_000,
    retryEveryMs = 5000,
  }: { slowAfterMs?: number; giveUpAfterMs?: number; retryEveryMs?: number } = {},
): { state: WakeupState; retry: () => void } {
  const [state, setState] = useState<WakeupState>("checking");
  const [attempt, setAttempt] = useState(0);
  const pingRef = useRef(ping);
  pingRef.current = ping;

  useEffect(() => {
    let alive = true;
    const started = Date.now();
    setState("checking");
    const slow = setTimeout(() => alive && setState((s) => (s === "checking" ? "waking" : s)), slowAfterMs);
    let retry: ReturnType<typeof setTimeout> | undefined;
    const tryOnce = () => {
      pingRef.current().then(
        () => {
          if (!alive) return;
          clearTimeout(slow);
          setState("ready");
        },
        () => {
          if (!alive) return;
          if (Date.now() - started >= giveUpAfterMs) {
            clearTimeout(slow);
            setState("down");
            return;
          }
          retry = setTimeout(tryOnce, retryEveryMs);
        },
      );
    };
    tryOnce();
    return () => {
      alive = false;
      clearTimeout(slow);
      clearTimeout(retry);
    };
  }, [attempt, slowAfterMs, giveUpAfterMs, retryEveryMs]);

  const retryNow = useCallback(() => setAttempt((n) => n + 1), []);
  return { state, retry: retryNow };
}

export function pingApi(baseUrl: string): () => Promise<void> {
  return async () => {
    const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/api/v1/health`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`health ${res.status}`);
  };
}
