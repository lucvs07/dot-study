import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { BookOpen, ChevronRight, Flame, Hand, Timer, Trophy } from "lucide-react";
import { BRAND } from "@/domain/brand";
import { formatTotalTime, getDateLabel } from "@/domain/format";
import { sessionMinutes } from "@/domain/rules";
import { StudyLogo } from "@/components/StudyLogo";
import { LoadingState } from "@/components/LoadingState";
import { ErrorMessage } from "@/components/ErrorMessage";
import { SUBJECT_ICONS } from "@/domain/subjectIcons";
import { useCurrentUser } from "@/hooks/useAuth";
import { useServices } from "@/services/ServicesContext";
import { queryKeys } from "@/app/queryKeys";

export function DashboardPage() {
  const services = useServices();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const dotColor = user.dotColor;

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

  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const recent = [...sessions]
    .sort((a, b) => new Date(b.lastCycleAt ?? b.startedAt).getTime() - new Date(a.lastCycleAt ?? a.startedAt).getTime())
    .slice(0, 3);

  return (
    <div className="p-8" style={{ maxWidth: 920, margin: "0 auto" }}>
      <div className="mb-8">
        <p
          style={{
            fontSize: "0.78rem",
            color: "var(--muted-foreground)",
            fontFamily: "Inter",
            textTransform: "capitalize",
          }}
        >
          {today}
        </p>
        <h1
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 900,
            fontSize: "2rem",
            color: "var(--foreground)",
            marginTop: 4,
            lineHeight: 1.2,
          }}
        >
          Bom estudo, <span style={{ color: dotColor }}>{user.name}</span>{" "}
          <Hand size={24} style={{ display: "inline", color: BRAND.yellow, marginLeft: 8 }} />
        </h1>
        <div className="flex gap-6 mt-4">
          {[
            { icon: <Flame size={15} color={BRAND.red} />, value: `${stats.streakDays}`, label: "dias seguidos" },
            {
              icon: <Timer size={15} color={dotColor} />,
              value: formatTotalTime(stats.totalMinutes),
              label: "estudados",
            },
            { icon: <BookOpen size={15} color={BRAND.green} />, value: `${sessions.length}`, label: "sessões" },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              {s.icon}
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.9rem",
                  color: "var(--foreground)",
                  fontWeight: 700,
                }}
              >
                {s.value}
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", fontFamily: "Inter" }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-7 mb-8 relative overflow-hidden bg-card border border-border">
        <div
          className="absolute"
          style={{ inset: 0, backgroundImage: `radial-gradient(circle at 88% 50%, ${dotColor}18 0%, transparent 55%)` }}
        />
        <div className="absolute right-7 top-1/2 -translate-y-1/2 opacity-[0.04]">
          <StudyLogo dotColor={dotColor} textColor="var(--foreground)" dotSize={72} />
        </div>
        <h2
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            fontSize: "1.45rem",
            color: "var(--foreground)",
            position: "relative",
          }}
        >
          Pronto para a próxima sessão?
        </h2>
        <p
          style={{
            fontFamily: "Inter",
            fontSize: "0.85rem",
            color: "var(--muted-foreground)",
            marginTop: 6,
            position: "relative",
          }}
        >
          Cada ciclo concluído gera <strong style={{ color: BRAND.yellow }}>+10 moedas</strong>. Ao finalizar, publique
          no feed da comunidade e ganhe <strong style={{ color: BRAND.yellow }}>+30</strong>.
        </p>
        <div className="flex gap-3 mt-5" style={{ position: "relative" }}>
          <button
            onClick={() => navigate("/estudar")}
            className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
            style={{ background: dotColor, color: "#111827", fontFamily: "Inter" }}
          >
            Iniciar desafio
          </button>
          <button
            onClick={() => navigate("/historico")}
            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80 bg-muted text-foreground"
            style={{ fontFamily: "Inter" }}
          >
            Ver histórico
          </button>
        </div>
      </div>

      <div className="mb-8">
        <h2
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            fontSize: "1.05rem",
            color: "var(--foreground)",
            marginBottom: 14,
          }}
        >
          Assuntos
        </h2>
        <div className="grid grid-cols-5 gap-3">
          {subjects.map((s) => {
            const Icon = SUBJECT_ICONS[s.icon];
            const m = sessions.filter((x) => x.subjectId === s.id).reduce((a, x) => a + sessionMinutes(x), 0);
            return (
              <button
                key={s.id}
                onClick={() => navigate("/estudar")}
                className="rounded-2xl p-4 text-left transition-all hover:scale-[1.04] bg-card"
                style={{ border: `2.5px solid ${s.color}60` }}
              >
                <div style={{ color: s.color, marginBottom: 8 }}>
                  <Icon size={24} />
                </div>
                <div
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 600,
                    fontSize: "0.82rem",
                    color: "var(--foreground)",
                  }}
                >
                  {s.name}
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.65rem",
                    color: "var(--muted-foreground)",
                    marginTop: 4,
                  }}
                >
                  {m > 0 ? formatTotalTime(m) : "—"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1.05rem",
              color: "var(--foreground)",
            }}
          >
            Sessões recentes
          </h2>
          <button
            onClick={() => navigate("/historico")}
            className="flex items-center gap-1 hover:opacity-70 transition-opacity"
            style={{ fontFamily: "Inter", fontSize: "0.78rem", color: dotColor, fontWeight: 600 }}
          >
            Ver todas <ChevronRight size={13} />
          </button>
        </div>
        {recent.length === 0 ? (
          <div
            className="text-center py-10"
            style={{ color: "var(--muted-foreground)", fontFamily: "Inter", fontSize: "0.85rem" }}
          >
            Nenhuma sessão ainda. Comece estudando! <Trophy size={14} className="inline ml-1 mb-0.5" />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recent.map((s) => {
              const subject = subjects.find((sub) => sub.id === s.subjectId) ?? null;
              const theme = subject?.themes.find((t) => t.id === s.themeId) ?? null;
              const title = theme?.title ?? s.label ?? (s.mode === "free" ? "Sessão livre" : "—");
              const when = new Date(s.lastCycleAt ?? s.startedAt);
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-4 px-5 py-3.5 rounded-xl bg-card hover:shadow-sm transition-all"
                  style={{ border: "1px solid var(--border)" }}
                >
                  <div
                    className="w-1.5 h-9 rounded-full shrink-0"
                    style={{ background: subject?.color ?? "#9CA3AF" }}
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
                    <div style={{ fontFamily: "Inter", fontSize: "0.72rem", color: "var(--muted-foreground)" }}>
                      {subject?.name ?? "Sem assunto"} · {getDateLabel(when).toLowerCase()}
                    </div>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded-md text-xs"
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
                      fontSize: "0.76rem",
                      color: "var(--muted-foreground)",
                    }}
                  >
                    {sessionMinutes(s)}min
                  </span>
                  <ChevronRight size={14} color="#9CA3AF" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
