import { Minus, Plus } from "lucide-react";

export function DurationPicker({
  label,
  value,
  onChange,
  presets,
  min = 1,
  max = 120,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  presets: number[];
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span
        style={{
          fontFamily: "Inter",
          fontWeight: 600,
          fontSize: "0.72rem",
          color: "var(--muted-foreground)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </span>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => onChange(p)}
              className="px-3 py-1.5 rounded-lg transition-all"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: "0.78rem",
                background: value === p ? "var(--foreground)" : "var(--muted)",
                color: value === p ? "var(--background)" : "var(--foreground)",
              }}
            >
              {p}min
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1" style={{ marginLeft: 4 }}>
          <button
            onClick={() => onChange(Math.max(min, value - 1))}
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-card hover:bg-muted transition-colors"
            style={{ border: "1px solid var(--border)" }}
          >
            <Minus size={11} color="var(--foreground)" />
          </button>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.82rem",
              color: "var(--foreground)",
              fontWeight: 700,
              minWidth: "4.5ch",
              textAlign: "center",
            }}
          >
            {value}min
          </span>
          <button
            onClick={() => onChange(Math.min(max, value + 1))}
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-card hover:bg-muted transition-colors"
            style={{ border: "1px solid var(--border)" }}
          >
            <Plus size={11} color="var(--foreground)" />
          </button>
        </div>
      </div>
    </div>
  );
}
