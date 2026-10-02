type ChartTooltipPayloadEntry = {
  payload: { fullName: string; color: string; minutes: number; count: number };
};

export function ChartTooltip({ active, payload }: { active?: boolean; payload?: ChartTooltipPayloadEntry[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-card rounded-xl px-4 py-3 shadow-lg" style={{ border: "1px solid var(--border)" }}>
      <p style={{ fontFamily: "Inter", fontWeight: 600, color: "var(--foreground)", marginBottom: 4 }}>{d.fullName}</p>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem", color: d.color, fontWeight: 700 }}>
        {d.minutes} min
      </p>
      <p style={{ fontFamily: "Inter", fontSize: "0.72rem", color: "var(--muted-foreground)" }}>{d.count} sessões</p>
    </div>
  );
}
