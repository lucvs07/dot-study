import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Medal } from "lucide-react";
import { BRAND } from "@/domain/brand";
import { SUBJECT_ICONS } from "@/domain/subjectIcons";
import { DotAvatar } from "@/components/DotAvatar";
import { LoadingState } from "@/components/LoadingState";
import { ErrorMessage } from "@/components/ErrorMessage";
import { useCurrentUser } from "@/hooks/useAuth";
import { useServices } from "@/services/ServicesContext";
import { queryKeys } from "@/app/queryKeys";

export function RankingPage() {
  const services = useServices();
  const dotColor = useCurrentUser().dotColor;
  const [activeSubject, setActiveSubject] = useState(1);

  const subjectsQuery = useQuery({ queryKey: queryKeys.subjects, queryFn: () => services.subjects.list() });
  const rankingQuery = useQuery({
    queryKey: queryKeys.ranking(activeSubject),
    queryFn: () => services.rankings.bySubject(activeSubject),
  });

  if (subjectsQuery.isLoading || rankingQuery.isLoading) return <LoadingState />;
  if (subjectsQuery.error)
    return <ErrorMessage error={subjectsQuery.error} onRetry={() => void subjectsQuery.refetch()} />;
  if (rankingQuery.error)
    return <ErrorMessage error={rankingQuery.error} onRetry={() => void rankingQuery.refetch()} />;

  const subjects = subjectsQuery.data!;
  const entries = rankingQuery.data!;
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);
  const podH = [80, 112, 64];
  const podSz = [52, 64, 48];
  const renderMedal = (idx: number) => (
    <Medal size={18} color={idx === 1 ? BRAND.yellow : idx === 0 ? "#9CA3AF" : "#D97706"} />
  );
  const podBg = ["rgba(180,180,180,0.12)", `${BRAND.yellow}20`, "rgba(180,130,70,0.1)"];
  const podBd = ["rgba(180,180,180,0.22)", `${BRAND.yellow}50`, "rgba(180,130,70,0.2)"];
  const meInList = entries.some((e) => e.isMe);

  return (
    <div className="p-8" style={{ maxWidth: 680, margin: "0 auto" }}>
      <div className="mb-7">
        <h1
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 900,
            fontSize: "1.85rem",
            color: "var(--foreground)",
          }}
        >
          Ranking
        </h1>
        <p style={{ fontFamily: "Inter", fontSize: "0.83rem", color: "var(--muted-foreground)", marginTop: 4 }}>
          Classificação mensal por assunto
        </p>
      </div>
      <div className="flex gap-2 mb-10 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {subjects.map((s) => {
          const Icon = SUBJECT_ICONS[s.icon];
          return (
            <button
              key={s.id}
              onClick={() => setActiveSubject(s.id)}
              className="px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all"
              style={{
                fontFamily: "Inter",
                fontWeight: 500,
                background: activeSubject === s.id ? `${s.color}18` : "var(--card)",
                color: activeSubject === s.id ? s.color : "var(--muted-foreground)",
                border: `1px solid ${activeSubject === s.id ? `${s.color}44` : "var(--border)"}`,
              }}
            >
              <span className="flex items-center gap-1.5">
                <Icon size={14} /> {s.name}
              </span>
            </button>
          );
        })}
      </div>
      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-4 mb-10">
          {order.map((e, i) =>
            !e ? null : (
              <div key={e.position} className="flex flex-col items-center gap-2">
                <DotAvatar color={e.user.dotColor} accessory={e.user.activeAccessoryId} size={podSz[i]} />
                <span
                  style={{
                    fontFamily: "Inter",
                    fontSize: "0.78rem",
                    color: e.isMe ? dotColor : "var(--foreground)",
                    textAlign: "center",
                    fontWeight: e.isMe ? 700 : 400,
                    maxWidth: 90,
                  }}
                >
                  {e.user.name}
                  {e.isMe ? " (você)" : ""}
                </span>
                <div
                  className="rounded-t-xl flex flex-col items-center justify-center gap-0.5"
                  style={{
                    width: podSz[i] + 16,
                    height: podH[i],
                    background: podBg[i],
                    border: `1px solid ${podBd[i]}`,
                    borderBottom: "none",
                  }}
                >
                  <span style={{ fontSize: "1.1rem", marginBottom: 2 }}>{renderMedal(i)}</span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.6rem",
                      color: "var(--muted-foreground)",
                    }}
                  >
                    {e.score.toLocaleString("pt-BR")}
                  </span>
                </div>
              </div>
            ),
          )}
        </div>
      )}
      {rest.length > 0 && (
        <div className="flex flex-col gap-2">
          {rest.map((e) => (
            <div
              key={e.position}
              className="flex items-center gap-4 px-5 py-3.5 rounded-xl"
              style={{
                background: e.isMe ? `${dotColor}10` : "var(--card)",
                border: `1px solid ${e.isMe ? `${dotColor}40` : "var(--border)"}`,
              }}
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.82rem",
                  color: "var(--muted-foreground)",
                  width: 22,
                  textAlign: "right",
                }}
              >
                {e.position}
              </span>
              <DotAvatar color={e.user.dotColor} accessory={e.user.activeAccessoryId} size={36} />
              <span
                style={{
                  flex: 1,
                  fontFamily: "Inter",
                  fontSize: "0.88rem",
                  color: e.isMe ? dotColor : "var(--foreground)",
                  fontWeight: e.isMe ? 700 : 400,
                }}
              >
                {e.user.name}
                {e.isMe ? " (você)" : ""}
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.82rem",
                  color: "var(--muted-foreground)",
                }}
              >
                {e.score.toLocaleString("pt-BR")}
              </span>
            </div>
          ))}
        </div>
      )}
      {!meInList && (
        <p
          className="text-center mt-6"
          style={{ fontFamily: "Inter", fontSize: "0.8rem", color: "var(--muted-foreground)" }}
        >
          Você ainda não pontuou neste assunto — complete um desafio para entrar no ranking.
        </p>
      )}
    </div>
  );
}
