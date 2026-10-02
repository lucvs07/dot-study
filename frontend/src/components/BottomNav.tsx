import { Link, NavLink } from "react-router";
import { BookOpen, History, Rss, Settings, Timer, Trophy } from "lucide-react";
import { BRAND } from "@/domain/brand";
import { DotAvatar } from "@/components/DotAvatar";
import { SpotifyPlayer } from "@/components/spotify/SpotifyPlayer";
import { useCurrentUser } from "@/hooks/useAuth";

export function BottomNav() {
  const { coins, dotColor, activeAccessoryId: activeAccessory } = useCurrentUser();

  const nav = [
    { to: "/", icon: BookOpen, label: "Início" },
    { to: "/estudar", icon: Timer, label: "Estudar" },
    { to: "/feed", icon: Rss, label: "Feed" },
    { to: "/ranking", icon: Trophy, label: "Ranking" },
    { to: "/historico", icon: History, label: "Histórico" },
    { to: "/ajustes", icon: Settings, label: "Ajustes" },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center bg-card rounded-2xl shadow-2xl p-2 gap-4 border border-border z-50 transition-colors">
      {/* Brand & Shop */}
      <div className="flex items-center gap-3 pl-2 pr-4 border-r border-border">
        <Link to="/" className="flex items-center">
          <span
            style={{
              fontFamily: "'Cal Sans', 'Outfit', sans-serif",
              lineHeight: 1,
              display: "flex",
              alignItems: "baseline",
            }}
          >
            <span style={{ fontSize: "1.5rem", color: "var(--foreground)", fontWeight: 600 }}>.</span>
            <span style={{ fontSize: "1.1rem", color: dotColor, fontWeight: 600, letterSpacing: "-0.02em" }}>
              study
            </span>
          </span>
        </Link>
        <Link
          to="/loja"
          className="transition-transform hover:scale-105 flex items-center gap-2 bg-muted rounded-full pr-3"
        >
          <DotAvatar color={dotColor} accessory={activeAccessory} size={28} />
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.75rem",
              color: BRAND.yellow,
              fontWeight: 700,
            }}
          >
            {coins}
          </span>
        </Link>
      </div>

      {/* Nav Links */}
      <div className="flex items-center gap-1">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className="flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all duration-150"
            style={({ isActive }) => ({
              background: isActive ? `${dotColor}22` : "transparent",
              color: isActive ? dotColor : "var(--muted-foreground)",
            })}
          >
            <Icon size={18} className="mb-1" />
            <span style={{ fontSize: "0.55rem", fontFamily: "Inter", fontWeight: 500 }}>{label}</span>
          </NavLink>
        ))}
      </div>

      {/* Music Player */}
      <SpotifyPlayer />
    </div>
  );
}
