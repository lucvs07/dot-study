export function CircularTimer({ timeLeft, totalTime, color }: { timeLeft: number; totalTime: number; color: string }) {
  const r = 90,
    c = 2 * Math.PI * r;
  const offset = c * (1 - timeLeft / totalTime);
  const min = Math.floor(timeLeft / 60),
    sec = timeLeft % 60;
  return (
    <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
      <svg width="220" height="220" style={{ transform: "rotate(-90deg)", position: "absolute" }}>
        <circle cx="110" cy="110" r={r} fill="none" stroke="var(--border)" strokeWidth="10" />
        <circle
          cx="110"
          cy="110"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "2.8rem",
          color: "var(--foreground)",
          fontWeight: 700,
          letterSpacing: "0.04em",
          position: "relative",
          zIndex: 1,
        }}
      >
        {String(min).padStart(2, "0")}:{String(sec).padStart(2, "0")}
      </span>
    </div>
  );
}
