import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ErrorMessage } from "@/components/ErrorMessage";
import { ServiceError } from "@/services/contracts";
import { exchangeCode, saveToken } from "@/spotify/spotifyApi";

const PKCE_KEY = "dotstudy:spotify:pkce";

const CANCELLED = new ServiceError("NETWORK", "Conexão com o Spotify cancelada.");

export function SpotifyCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const oauthError = params.get("error");

    let saved: { verifier: string; state: string } | null = null;
    try {
      saved = JSON.parse(sessionStorage.getItem(PKCE_KEY) ?? "null");
    } catch {
      saved = null;
    }

    if (oauthError || !code || !state || !saved || state !== saved.state) {
      setError(CANCELLED);
      return;
    }

    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    if (!clientId) {
      setError(CANCELLED);
      return;
    }

    exchangeCode({ clientId, code, verifier: saved.verifier, redirectUri: `${location.origin}/spotify/callback` })
      .then((token) => {
        saveToken(token);
        try {
          sessionStorage.removeItem(PKCE_KEY);
        } catch {
          // sem storage disponível: não há o que limpar.
        }
        navigate("/", { replace: true });
      })
      .catch((err: unknown) => setError(err));
    // Roda só uma vez, ao montar: os parâmetros da URL de callback não mudam.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!error) return null;

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-4 max-w-md mx-auto">
      <ErrorMessage error={error} />
      <button
        onClick={() => navigate("/", { replace: true })}
        className="px-4 py-2 rounded-full font-semibold text-sm"
        style={{ background: "var(--muted)", color: "var(--foreground)" }}
      >
        Voltar
      </button>
    </div>
  );
}
