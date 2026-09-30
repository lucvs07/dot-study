import { useState } from "react";
import { Link, NavLink } from "react-router";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  ChevronUp,
  History,
  ListMusic,
  Music,
  Pause,
  Play,
  Rss,
  Settings,
  SkipBack,
  SkipForward,
  Timer,
  Trophy,
} from "lucide-react";
import { BRAND } from "@/domain/brand";
import { DotAvatar } from "@/components/DotAvatar";
import { useCurrentUser } from "@/hooks/useAuth";

// Player do Spotify simulado: mantido como no protótipo até a Task 16.
const SPOTIFY_PLAYLISTS = [
  { id: "p1", name: "Lofi Focus", tracks: ["Rainy Study", "Late Night Coffee", "Tokyo Vibes"] },
  { id: "p2", name: "Deep Work", tracks: ["Ambient Alpha", "White Noise", "Binaural Beats"] },
  { id: "p3", name: "Synthwave", tracks: ["Neon Nights", "Cyberpunk Study", "Retro Grid"] },
];

export function BottomNav() {
  const { coins, dotColor, activeAccessoryId: activeAccessory } = useCurrentUser();
  const [isPlaying, setIsPlaying] = useState(false);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [activePlaylist, setActivePlaylist] = useState<string | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  const activePlaylistData = SPOTIFY_PLAYLISTS.find((p) => p.id === activePlaylist);
  const trackName = activePlaylistData ? activePlaylistData.tracks[currentTrackIndex] : "Lofi Beats to Study to";

  const nextTrack = () => {
    if (activePlaylistData) {
      setCurrentTrackIndex((prev) => (prev + 1) % activePlaylistData.tracks.length);
    }
  };

  const prevTrack = () => {
    if (activePlaylistData) {
      setCurrentTrackIndex((prev) => (prev - 1 + activePlaylistData.tracks.length) % activePlaylistData.tracks.length);
    }
  };

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
      <div className="flex items-center gap-3 pl-4 border-l border-border relative">
        <div className="flex items-center gap-2">
          {!spotifyConnected ? (
            <button
              onClick={() => setSpotifyConnected(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1DB954]/10 text-[#1DB954] hover:bg-[#1DB954]/20 transition-colors text-xs font-semibold"
            >
              <Music size={14} />
              Connect
            </button>
          ) : (
            <button
              onClick={() => setShowPlaylists(!showPlaylists)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-full text-foreground hover:bg-muted transition-colors text-xs font-medium bg-muted"
            >
              <ListMusic size={14} />
              <ChevronUp size={12} className={`transition-transform ${showPlaylists ? "rotate-180" : ""}`} />
            </button>
          )}

          <div className="flex flex-col w-28">
            <span className="text-[10px] text-muted-foreground font-medium truncate uppercase tracking-wider">
              {activePlaylistData ? activePlaylistData.name : "Native Player"}
            </span>
            <span className="text-xs text-foreground font-medium truncate">{trackName}</span>
          </div>

          <div className="flex items-center gap-1.5 text-muted-foreground">
            <button onClick={prevTrack} className="hover:text-foreground transition-colors p-1">
              <SkipBack size={14} fill="currentColor" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-card bg-foreground hover:opacity-80 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            >
              {isPlaying ? (
                <Pause size={14} fill="currentColor" />
              ) : (
                <Play size={14} fill="currentColor" className="ml-0.5" />
              )}
            </button>
            <button onClick={nextTrack} className="hover:text-foreground transition-colors p-1">
              <SkipForward size={14} fill="currentColor" />
            </button>
          </div>
        </div>

        {/* Spotify Playlists Dropdown */}
        {spotifyConnected && showPlaylists && (
          <div className="absolute bottom-[calc(100%+16px)] right-0 w-56 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
            {!activePlaylist ? (
              <>
                <div className="p-3 border-b border-border bg-card">
                  <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#1DB954]"></div>
                    Spotify Playlists
                  </h3>
                </div>
                <div className="max-h-48 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                  {SPOTIFY_PLAYLISTS.map((playlist) => (
                    <button
                      key={playlist.id}
                      className="w-full flex items-center justify-between px-3 py-3 text-left hover:bg-muted transition-colors"
                      onClick={() => {
                        setActivePlaylist(playlist.id);
                        setCurrentTrackIndex(0);
                      }}
                    >
                      <span className="text-sm text-foreground font-medium">{playlist.name}</span>
                      <ChevronRight size={14} className="text-muted-foreground" />
                    </button>
                  ))}
                </div>
                <div className="p-2 border-t border-border">
                  <button
                    onClick={() => {
                      setSpotifyConnected(false);
                      setShowPlaylists(false);
                      setActivePlaylist(null);
                      setIsPlaying(false);
                    }}
                    className="w-full text-center text-[10px] text-muted-foreground hover:text-foreground py-1 transition-colors"
                  >
                    Disconnect Spotify
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 border-b border-border bg-card flex items-center gap-2">
                  <button
                    onClick={() => setActivePlaylist(null)}
                    className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft size={14} />
                  </button>
                  <h3 className="text-xs font-semibold text-[#1DB954] truncate">
                    {SPOTIFY_PLAYLISTS.find((p) => p.id === activePlaylist)?.name}
                  </h3>
                </div>
                <div className="max-h-48 overflow-y-auto bg-card py-1" style={{ scrollbarWidth: "none" }}>
                  {SPOTIFY_PLAYLISTS.find((p) => p.id === activePlaylist)?.tracks.map((track, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setCurrentTrackIndex(i);
                        setIsPlaying(true);
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2 text-xs hover:bg-muted transition-colors ${currentTrackIndex === i ? "text-[#1DB954]" : "text-muted-foreground"}`}
                    >
                      <span className="w-4 text-right text-[10px] opacity-50">{i + 1}</span>
                      <span className="truncate">{track}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
