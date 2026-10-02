import { useServerWakeup } from "@/hooks/useServerWakeup";

export function ServerStatusBanner({ ping }: { ping: () => Promise<void> }) {
  const { state, retry } = useServerWakeup(ping);
  if (state === "checking" || state === "ready") return null;
  const waking = state === "waking";
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-32px)] w-max rounded-full px-4 py-2 text-sm flex flex-wrap items-center justify-center gap-3 text-center shadow"
      style={{
        background: waking ? "#FFF6DB" : "rgba(238,27,63,0.1)",
        color: waking ? "#7A5A00" : "#B4102C",
        border: `1px solid ${waking ? "#FFC23D" : "rgba(238,27,63,0.3)"}`,
      }}
    >
      {waking ? (
        <>
          <span className="w-2.5 h-2.5 rounded-full animate-pulse shrink-0" style={{ background: "#FFC23D" }} />
          <span className="min-w-0">Acordando o servidor… (até ~1 min no plano gratuito)</span>
        </>
      ) : (
        <>
          <span className="min-w-0">Servidor indisponível no momento.</span>
          <button onClick={retry} className="underline font-semibold shrink-0">
            Tentar de novo
          </button>
        </>
      )}
    </div>
  );
}
