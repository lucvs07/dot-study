import { useState } from "react";
import { Check } from "lucide-react";
import { BRAND } from "@/domain/brand";
import { DotAvatar } from "./DotAvatar";

export function FreeSessionSummary({
  totalMinutes,
  coinsEarned,
  dotColor,
  activeAccessory,
  onDone,
}: {
  totalMinutes: number;
  /** Moedas ganhas na sessão (ciclos concluídos × moedas por ciclo). */
  coinsEarned: number;
  dotColor: string;
  activeAccessory: string | null;
  onDone: (note: string | null) => void;
}) {
  const [note, setNote] = useState("");
  const h = Math.floor(totalMinutes / 60),
    m = totalMinutes % 60;
  const timeLabel = h > 0 ? `${h}h ${m > 0 ? m + "min" : ""}`.trim() : `${m}min`;

  return (
    <div className="flex flex-col items-center gap-5 w-full py-8 px-6" style={{ maxWidth: 580, margin: "0 auto" }}>
      {/* Summary card */}
      <div
        className="w-full rounded-2xl p-5"
        style={{ background: "var(--card)", border: "1.5px solid var(--border)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: `${BRAND.green}22` }}
            >
              <Check size={18} color={BRAND.green} strokeWidth={3} />
            </div>
            <div>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "1rem", color: BRAND.green }}>
                Sessão livre concluída! <span style={{ color: BRAND.yellow }}>+{coinsEarned} moedas</span>
              </p>
              <p
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.82rem",
                  color: dotColor,
                  fontWeight: 700,
                  marginTop: 2,
                }}
              >
                Tempo total: {timeLabel}
              </p>
            </div>
          </div>
          <DotAvatar color={dotColor} accessory={activeAccessory} size={48} />
        </div>
      </div>

      {/* Note */}
      <div className="w-full text-center">
        <p
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 900,
            fontSize: "1.2rem",
            color: "var(--foreground)",
          }}
        >
          Como foi a sessão?
        </p>
        <p style={{ fontFamily: "Inter", fontSize: "0.8rem", color: "var(--muted-foreground)", marginTop: 4 }}>
          Opcional — aparece no histórico
        </p>
      </div>
      <div className="w-full">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 280))}
          rows={4}
          placeholder="O que você estudou ou fez nesta sessão?"
          className="resize-none w-full rounded-xl p-4 outline-none"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            fontFamily: "Inter",
            fontSize: "0.84rem",
            color: "var(--foreground)",
            lineHeight: 1.65,
          }}
        />
        <p
          style={{
            fontFamily: "Inter",
            fontSize: "0.7rem",
            color: "var(--muted-foreground)",
            textAlign: "right",
            marginTop: 4,
          }}
        >
          {note.length}/280
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 w-full">
        <button
          onClick={() => onDone(null)}
          className="flex-1 py-3 rounded-xl text-sm bg-card hover:bg-muted transition-colors"
          style={{
            fontFamily: "Inter",
            fontWeight: 500,
            color: "var(--muted-foreground)",
            border: "1px solid var(--border)",
          }}
        >
          Pular
        </button>
        <button
          onClick={() => onDone(note.trim() || null)}
          className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02]"
          style={{ fontFamily: "'Outfit', sans-serif", background: dotColor, color: BRAND.dark }}
        >
          Salvar anotação
        </button>
      </div>
    </div>
  );
}
