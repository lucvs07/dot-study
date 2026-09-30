export interface SpotifyToken {
  accessToken: string;
  expiresAt: number;
}
export interface SpotifyPlaylist {
  id: string;
  name: string;
  uri: string;
  imageUrl: string | null;
}
type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;

export class SpotifyError extends Error {
  constructor(
    public readonly kind: "not_allowed" | "expired" | "network" | "unknown",
    message: string,
  ) {
    super(message);
  }
}

async function call(fetchFn: FetchFn, url: string, init?: RequestInit): Promise<unknown> {
  let res: Response;
  try {
    res = await fetchFn(url, init);
  } catch {
    throw new SpotifyError("network", "Sem conexão com o Spotify.");
  }
  if (res.status === 401) throw new SpotifyError("expired", "Sua conexão com o Spotify expirou. Conecte de novo.");
  if (res.status === 403)
    throw new SpotifyError("not_allowed", "Sua conta do Spotify não está liberada neste app de demonstração.");
  if (!res.ok) throw new SpotifyError("unknown", "O Spotify não respondeu como esperado.");
  return res.json();
}

export async function exchangeCode({
  clientId,
  code,
  verifier,
  redirectUri,
  fetchFn = fetch,
  now = Date.now,
}: {
  clientId: string;
  code: string;
  verifier: string;
  redirectUri: string;
  fetchFn?: FetchFn;
  now?: () => number;
}): Promise<SpotifyToken> {
  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });
  const data = (await call(fetchFn, "https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })) as { access_token: string; expires_in: number };
  return { accessToken: data.access_token, expiresAt: now() + data.expires_in * 1000 };
}

export async function getMyPlaylists(token: SpotifyToken, fetchFn: FetchFn = fetch): Promise<SpotifyPlaylist[]> {
  const data = (await call(fetchFn, "https://api.spotify.com/v1/me/playlists?limit=20", {
    headers: { Authorization: `Bearer ${token.accessToken}` },
  })) as { items: { id: string; name: string; uri: string; images?: { url: string }[] | null }[] };
  return data.items.map((p) => ({ id: p.id, name: p.name, uri: p.uri, imageUrl: p.images?.[0]?.url ?? null }));
}

const KEY = "dotstudy:spotify";
export function loadToken(now = Date.now()): SpotifyToken | null {
  try {
    const t = JSON.parse(sessionStorage.getItem(KEY) ?? "null") as SpotifyToken | null;
    return t && t.expiresAt > now + 30_000 ? t : null;
  } catch {
    return null;
  }
}
export function saveToken(t: SpotifyToken) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(t));
  } catch {
    // sessionStorage indisponível (modo privado etc.): a conexão simplesmente não persiste.
  }
}
export function clearToken() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // idem: nada a fazer se o storage não está disponível.
  }
}
