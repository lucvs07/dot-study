export function LoadingState({ label = "Carregando…" }: { label?: string }) {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-3 py-16 text-sm"
      style={{ color: "var(--muted-foreground)" }}
    >
      <span className="w-3 h-3 rounded-full animate-pulse" style={{ background: "#22CFD5" }} />
      {label}
    </div>
  );
}
