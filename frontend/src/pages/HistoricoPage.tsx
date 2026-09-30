import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { BRAND } from "@/domain/brand";
import { formatTotalTime, getDateLabel } from "@/domain/format";
import { localDayKey, sessionMinutes } from "@/domain/rules";
import { SUBJECT_ICONS } from "@/domain/subjectIcons";
import { LoadingState } from "@/components/LoadingState";
import { ErrorMessage } from "@/components/ErrorMessage";
import { ChartTooltip } from "@/components/ChartTooltip";
import { useCurrentUser } from "@/hooks/useAuth";
import { useServices } from "@/services/ServicesContext";
import { queryKeys } from "@/app/queryKeys";
import type { StudySession, Subject } from "@/services/contracts";

export function HistoricoPage() {
  const services = useServices();
  const navigate = useNavigate();
  const dotColor = useCurrentUser().dotColor;
  const [filter, setFilter] = useState<number | null>(null);

  const statsQuery = useQuery({ queryKey: queryKeys.stats, queryFn: () => services.users.getStats() });
  const sessionsQuery = useQuery({ queryKey: queryKeys.sessions, queryFn: () => services.sessions.list() });
  const subjectsQuery = useQuery({ queryKey: queryKeys.subjects, queryFn: () => services.subjects.list() });

  if (statsQuery.isLoading || sessionsQuery.isLoading || subjectsQuery.isLoading) return <LoadingState />;
  if (statsQuery.error) return <ErrorMessage error={statsQuery.error} onRetry={() => void statsQuery.refetch()} />;
  if (sessionsQuery.error)
    return <ErrorMessage error={sessionsQuery.error} onRetry={() => void sessionsQuery.refetch()} />;
  if (subjectsQuery.error)
    return <ErrorMessage error={subjectsQuery.error} onRetry={() => void subjectsQuery.refetch()} />;

  const stats = statsQuery.data!;
  const sessions = sessionsQuery.data!.filter((s) => s.completedCycles > 0);
  const subjects = subjectsQuery.data!;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = sessions.filter((s) => {
    const d = new Date(s.lastCycleAt ?? s.startedAt);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  }).length;

  const subjectCounts = new Map<number, number>();
  sessions
    .filter((s) => s.subjectId !== null)
    .forEach((s) => subjectCounts.set(s.subjectId!, (subjectCounts.get(s.subjectId!) ?? 0) + 1));
  const favId = [...subjectCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const fav = subjects.find((s) => s.id === favId)?.name ?? "—";

  const chartData = stats.last7Days.map((d) => {
    const dateObj = new Date(d.date + "T12:00");
    const daySessions = sessions.filter((s) => localDayKey(new Date(s.lastCycleAt ?? s.startedAt)) === d.date);
    return {
      name: dateObj.toLocaleDateString("pt-BR", { weekday: "short" }),
      fullName: dateObj.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }),
      minutes: d.minutes,
      count: daySessions.length,
      color: dotColor,
    };
  });

  const filtered = (filter !== null ? sessions.filter((s) => s.subjectId === filter) : sessions).sort(
    (a, b) => new Date(b.lastCycleAt ?? b.startedAt).getTime() - new Date(a.lastCycleAt ?? a.startedAt).getTime(),
  );
  const grouped: { label: string; items: StudySession[] }[] = [];
  filtered.forEach((s) => {
    const label = getDateLabel(new Date(s.lastCycleAt ?? s.startedAt));
    const g = grouped.find((x) => x.label === label);
    if (g) g.items.push(s);
    else grouped.push({ label, items: [s] });
  });

  const findSubject = (id: number | null): Subject | null =>
    id === null ? null : (subjects.find((s) => s.id === id) ?? null);

  return (
    <div className="p-8" style={{ maxWidth: 860, margin: "0 auto" }}>
      <div className="mb-8">
        <h1
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 900,
            fontSize: "1.85rem",
            color: "var(--foreground)",
          }}
        >
          Histórico
        </h1>
        <p style={{ fontFamily: "Inter", fontSize: "0.83rem", color: "var(--muted-foreground)", marginTop: 4 }}>
          Todas as suas sessões · Assunto favorito: <strong style={{ color: "var(--foreground)" }}>{fav}</strong>
        </p>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total estudado", value: formatTotalTime(stats.totalMinutes), color: dotColor },
          { label: "Sessões totais", value: `${sessions.length}`, color: BRAND.green },
          { label: "Sequência atual", value: `${stats.streakDays} dias`, color: BRAND.red },
          { label: "Hoje", value: `${todayCount} sessões`, color: BRAND.purple },
        ].map((stat, i) => (
          <div key={i} className="bg-card rounded-2xl p-5" style={{ border: "1px solid var(--border)" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: stat.color, marginBottom: 10 }} />
            <p
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: "1.25rem",
                color: "var(--foreground)",
              }}
            >
              {stat.value}
            </p>
            <p style={{ fontFamily: "Inter", fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: 4 }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>
      <div className="bg-card rounded-2xl p-6 mb-8" style={{ border: "1px solid var(--border)" }}>
        <h2
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            fontSize: "1rem",
            color: "var(--foreground)",
            marginBottom: 20,
          }}
        >
          Estudo nos últimos 7 dias (min)
        </h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} barSize={36}>
            <XAxis
              dataKey="name"
              tick={{ fontFamily: "Inter", fontSize: 12, fill: "#6B7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
              unit="m"
              width={36}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
            <Bar name="Tempo" dataKey="minutes" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        <button
          onClick={() => setFilter(null)}
          className="px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all"
          style={{
            fontFamily: "Inter",
            fontWeight: 500,
            background: filter === null ? BRAND.dark : "var(--card)",
            color: filter === null ? "white" : "#6B7280",
            border: filter === null ? "none" : "1px solid var(--border)",
          }}
        >
          Todos ({sessions.length})
        </button>
        {subjects.map((s) => {
          const Icon = SUBJECT_ICONS[s.icon];
          const count = sessions.filter((x) => x.subjectId === s.id).length;
          if (!count) return null;
          return (
            <button
              key={s.id}
              onClick={() => setFilter(s.id)}
              className="px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all"
              style={{
                fontFamily: "Inter",
                fontWeight: 500,
                background: filter === s.id ? `${s.color}18` : "var(--card)",
                color: filter === s.id ? s.color : "var(--muted-foreground)",
                border: `1px solid ${filter === s.id ? `${s.color}44` : "var(--border)"}`,
              }}
            >
              <span className="flex items-center gap-1.5">
                <Icon size={14} /> {s.name} ({count})
              </span>
            </button>
          );
        })}
      </div>
      {grouped.length === 0 ? (
        <div
          className="text-center py-16"
          style={{ color: "var(--muted-foreground)", fontFamily: "Inter", fontSize: "0.85rem" }}
        >
          Nenhuma sessão encontrada.{" "}
          <button
            onClick={() => navigate("/estudar")}
            style={{ color: dotColor, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
          >
            Comece estudando!
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map((group) => (
            <div key={group.label}>
              <p
                style={{
                  fontFamily: "Inter",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  color: "var(--muted-foreground)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 10,
                }}
              >
                {group.label}
                <span style={{ fontWeight: 400, marginLeft: 8 }}>
                  {formatTotalTime(group.items.reduce((s, x) => s + sessionMinutes(x), 0))} · {group.items.length}{" "}
                  {group.items.length === 1 ? "sessão" : "sessões"}
                </span>
              </p>
              <div className="flex flex-col gap-2">
                {group.items.map((s) => {
                  const subj = findSubject(s.subjectId);
                  const theme = subj?.themes.find((t) => t.id === s.themeId) ?? null;
                  const title = theme?.title ?? s.label ?? (s.mode === "free" ? "Sessão livre" : "—");
                  const when = new Date(s.lastCycleAt ?? s.startedAt);
                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-4 px-5 py-4 rounded-xl bg-card hover:shadow-sm transition-all"
                      style={{ border: "1px solid var(--border)" }}
                    >
                      <div
                        className="w-1.5 h-10 rounded-full shrink-0"
                        style={{ background: subj?.color ?? "#9CA3AF" }}
                      />
                      <div className="flex-1 min-w-0">
                        <div
                          style={{
                            fontFamily: "Inter",
                            fontWeight: 600,
                            fontSize: "0.88rem",
                            color: "var(--foreground)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {title}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {subj && (
                            <span
                              style={{
                                fontFamily: "Inter",
                                fontSize: "0.68rem",
                                color: subj.color,
                                fontWeight: 600,
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                              }}
                            >
                              {(() => {
                                const Icon = SUBJECT_ICONS[subj.icon];
                                return <Icon size={11} />;
                              })()}{" "}
                              {subj.name}
                            </span>
                          )}
                          {!subj && (
                            <span
                              style={{ fontFamily: "Inter", fontSize: "0.68rem", color: "var(--muted-foreground)" }}
                            >
                              Sem assunto
                            </span>
                          )}
                          <span style={{ fontSize: "0.68rem", color: "#D1D5DB" }}>·</span>
                          <span style={{ fontFamily: "Inter", fontSize: "0.68rem", color: "var(--muted-foreground)" }}>
                            {when.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        {s.notes && (
                          <p
                            style={{
                              fontFamily: "Inter",
                              fontSize: "0.75rem",
                              color: "var(--muted-foreground)",
                              fontStyle: "italic",
                              marginTop: 3,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            "{s.notes}"
                          </p>
                        )}
                      </div>
                      <span
                        className="px-2 py-0.5 rounded-md text-xs shrink-0"
                        style={{
                          fontFamily: "Inter",
                          fontWeight: 500,
                          background: s.mode === "challenge" ? `${dotColor}14` : "var(--muted)",
                          color: s.mode === "challenge" ? dotColor : "#6B7280",
                        }}
                      >
                        {s.mode === "challenge" ? "Desafio" : "Livre"}
                      </span>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "0.8rem",
                          color: "var(--muted-foreground)",
                          fontWeight: 700,
                        }}
                      >
                        {sessionMinutes(s)}min
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
