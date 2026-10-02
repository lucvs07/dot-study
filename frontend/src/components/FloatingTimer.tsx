import { Pause, Play } from "lucide-react";

export function FloatingTimer({
  timeLeft,
  totalTime,
  color,
  isRunning,
  onToggle,
  theme,
  subjectColor: _subjectColor,
}: {
  timeLeft: number;
  totalTime: number;
  color: string;
  isRunning: boolean;
  onToggle: () => void;
  theme: string;
  subjectColor: string;
}) {
  const mins = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, "0");
  const secs = (timeLeft % 60).toString().padStart(2, "0");
  const pct = totalTime > 0 ? timeLeft / totalTime : 1;
  const r = 14;
  const circ = 2 * Math.PI * r;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 80,
        right: 16,
        zIndex: 100,
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        boxShadow: "0 4px 24px rgba(17,24,39,0.18)",
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        minWidth: 180,
      }}
    >
      {/* mini circular progress */}
      <svg width={36} height={36} style={{ flexShrink: 0 }}>
        <circle cx={18} cy={18} r={r} fill="none" stroke="var(--muted)" strokeWidth={3} />
        <circle
          cx={18}
          cy={18}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          transform="rotate(-90 18 18)"
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
        <text
          x={18}
          y={22}
          textAnchor="middle"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, fill: "var(--foreground)" }}
        >
          {mins}:{secs}
        </text>
      </svg>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "Inter", fontSize: "0.62rem", color: "var(--muted-foreground)", marginBottom: 1 }}>
          Em andamento
        </p>
        <p
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            fontSize: "0.78rem",
            color: "var(--foreground)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {theme}
        </p>
      </div>
      <button
        onClick={onToggle}
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: color,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {isRunning ? <Pause size={12} color="#111827" /> : <Play size={12} color="#111827" fill="#111827" />}
      </button>
    </div>
  );
}
