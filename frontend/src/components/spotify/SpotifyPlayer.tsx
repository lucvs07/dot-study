import { useEffect, useRef, useState } from "react";
import { ChevronRight, ChevronUp, ListMusic, Pause, Play } from "lucide-react";
import { CURATED_PLAYLISTS } from "@/spotify/playlists";
import { buildAuthorizeUrl, challengeFromVerifier, generateVerifier } from "@/spotify/pkce";
import { clearToken, getMyPlaylists, loadToken, SpotifyError } from "@/spotify/spotifyApi";
import { createController, type EmbedController } from "@/spotify/embedController";

const PKCE_KEY = "dotstudy:spotify:pkce";

interface PlaylistEntry {
  id: string;
  name: string;
  uri: string;
  mine?: boolean;
}

export function SpotifyPlayer() {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const [playlists, setPlaylists] = useState<PlaylistEntry[]>(() =>
    CURATED_PLAYLISTS.map((p) => ({ id: p.id, name: p.name, uri: p.spotifyUri })),
  );
  const [active, setActive] = useState(CURATED_PLAYLISTS[0].spotifyUri);
  const [isPaused, setIsPaused] = useState(true);
  const [connected, setConnected] = useState(() => loadToken() !== null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showPlaylists, setShowPlaylists] = useState(false);

  const embedRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<EmbedController | null>(null);

  const activeEntry = playlists.find((p) => p.uri === active);

  useEffect(() => {
    if (!connected) return;
    const token = loadToken();
    if (!token) {
      setConnected(false);
      return;
    }
    getMyPlaylists(token)
      .then((mine) => {
        setPlaylists((curr) => [
          ...mine.map((p) => ({ id: p.id, name: p.name, uri: p.uri, mine: true })),
          ...curr.filter((p) => !p.mine),
        ]);
      })
      .catch((err: unknown) => {
        if (!(err instanceof SpotifyError)) return;
        if (err.kind === "not_allowed" || err.kind === "expired") {
          clearToken();
          setConnected(false);
          setPlaylists((curr) => curr.filter((p) => !p.mine));
          setNotice(`${err.message} Tocando playlists do dot.study.`);
        } else if (err.kind === "network") {
          setNotice(err.message);
        }
      });
  }, [connected]);

  async function ensureController(): Promise<EmbedController | null> {
    if (controllerRef.current) return controllerRef.current;
    if (!embedRef.current) return null;
    try {
      const controller = await createController(embedRef.current, active);
      controller.addListener("playback_update", (e) => setIsPaused(e.data.isPaused));
      controllerRef.current = controller;
      return controller;
    } catch {
      setNotice("Não foi possível carregar o player do Spotify.");
      return null;
    }
  }

  async function toggleDropdown() {
    const opening = !showPlaylists;
    setShowPlaylists(opening);
    if (opening) await ensureController();
  }

  async function selectPlaylist(uri: string) {
    setActive(uri);
    const controller = await ensureController();
    controller?.loadUri(uri);
  }

  async function togglePlay() {
    const controller = await ensureController();
    controller?.togglePlay();
  }

  async function connectSpotify() {
    if (!clientId) return;
    const verifier = generateVerifier();
    const state = generateVerifier().slice(0, 16);
    try {
      sessionStorage.setItem(PKCE_KEY, JSON.stringify({ verifier, state }));
    } catch {
      // Sem sessionStorage disponível: seguimos mesmo assim; o callback vai detectar o
      // estado ausente e cair no fluxo de "conexão cancelada" com segurança.
    }
    const challenge = await challengeFromVerifier(verifier);
    location.assign(buildAuthorizeUrl({ clientId, redirectUri: `${location.origin}/spotify/callback`, challenge, state }));
  }

  function disconnectSpotify() {
    clearToken();
    setConnected(false);
    setNotice(null);
    setPlaylists((curr) => curr.filter((p) => !p.mine));
  }

  const yours = playlists.filter((p) => p.mine);
  const curated = playlists.filter((p) => !p.mine);

  return (
    <div className="flex items-center gap-3 pl-4 border-l border-border relative">
      {notice && (
        <div
          role="status"
          className="absolute bottom-[calc(100%+8px)] right-0 w-56 text-[10px] rounded-lg px-2 py-1.5 z-10"
          style={{ background: "rgba(238,27,63,0.08)", color: "#B4102C" }}
        >
          {notice}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => void toggleDropdown()}
          aria-label="Playlists do Spotify"
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-full text-foreground hover:bg-muted transition-colors text-xs font-medium bg-muted"
        >
          <ListMusic size={14} />
          <ChevronUp size={12} className={`transition-transform ${showPlaylists ? "rotate-180" : ""}`} />
        </button>

        <div className="flex flex-col w-28">
          <span className="text-[10px] text-muted-foreground font-medium truncate uppercase tracking-wider">
            Spotify
          </span>
          <span className="text-xs text-foreground font-medium truncate">{activeEntry?.name ?? "dot.study"}</span>
        </div>

        <button
          onClick={() => void togglePlay()}
          aria-label={isPaused ? "Tocar" : "Pausar"}
          className="text-card bg-foreground hover:opacity-80 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
        >
          {isPaused ? (
            <Play size={14} fill="currentColor" className="ml-0.5" />
          ) : (
            <Pause size={14} fill="currentColor" />
          )}
        </button>
      </div>

      {/* Sempre montado (mesmo com o dropdown fechado) para o iFrame API não perder o
          player e a reprodução continuar tocando em segundo plano. */}
      <div
        className="absolute bottom-[calc(100%+16px)] right-0 w-56 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden"
        style={{ display: showPlaylists ? "block" : "none" }}
      >
        <div className="p-3 border-b border-border bg-card">
          <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1DB954]" />
            Spotify Playlists
          </h3>
        </div>

        <div ref={embedRef} style={{ height: 80 }} />

        <div className="max-h-48 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {yours.length > 0 && (
            <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              Suas playlists
            </p>
          )}
          {yours.map((playlist) => (
            <PlaylistRow key={playlist.id} playlist={playlist} active={active} onSelect={selectPlaylist} />
          ))}
          {yours.length > 0 && (
            <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              Playlists do dot.study
            </p>
          )}
          {curated.map((playlist) => (
            <PlaylistRow key={playlist.id} playlist={playlist} active={active} onSelect={selectPlaylist} />
          ))}
        </div>

        <div className="p-2 border-t border-border">
          {clientId && !connected && (
            <button
              onClick={() => void connectSpotify()}
              className="w-full text-center text-[10px] font-semibold py-1.5 rounded-full text-[#1DB954] hover:bg-[#1DB954]/10 transition-colors"
            >
              Conectar Spotify
            </button>
          )}
          {connected && (
            <button
              onClick={disconnectSpotify}
              className="w-full text-center text-[10px] text-muted-foreground hover:text-foreground py-1 transition-colors"
            >
              Desconectar Spotify
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PlaylistRow({
  playlist,
  active,
  onSelect,
}: {
  playlist: PlaylistEntry;
  active: string;
  onSelect: (uri: string) => void;
}) {
  return (
    <button
      className="w-full flex items-center justify-between px-3 py-3 text-left hover:bg-muted transition-colors"
      onClick={() => void onSelect(playlist.uri)}
    >
      <span
        className={`text-sm font-medium truncate ${playlist.uri === active ? "text-[#1DB954]" : "text-foreground"}`}
      >
        {playlist.name}
      </span>
      <ChevronRight size={14} className="text-muted-foreground" />
    </button>
  );
}
