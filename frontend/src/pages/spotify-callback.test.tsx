// @vitest-environment jsdom
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "@/app/router";
import { exchangeCode, getMyPlaylists, loadToken } from "@/spotify/spotifyApi";
import { createTestServices, loginDemo, renderWithProviders } from "@/test/renderWithProviders";

// Nunca carregar o script real do Spotify nos testes (ver SpotifyPlayer.test.tsx).
vi.mock("@/spotify/embedController", () => ({
  createController: vi.fn(() =>
    Promise.resolve({ loadUri: vi.fn(), togglePlay: vi.fn(), addListener: vi.fn(), destroy: vi.fn() }),
  ),
}));

// Só a rede é mockada: loadToken/saveToken/clearToken continuam reais (sessionStorage).
vi.mock("@/spotify/spotifyApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/spotify/spotifyApi")>();
  return { ...actual, exchangeCode: vi.fn(), getMyPlaylists: vi.fn() };
});

const PKCE_KEY = "dotstudy:spotify:pkce";

// A página de callback lê `window.location.search` (a URL real do redirect), não a do router.
function arriveFromSpotify(query: string) {
  window.history.replaceState(null, "", `/spotify/callback?${query}`);
}

async function renderCallback() {
  const services = createTestServices();
  await loginDemo(services);
  return renderWithProviders(<AppRoutes />, { route: "/spotify/callback", services });
}

beforeEach(() => {
  vi.stubEnv("VITE_SPOTIFY_CLIENT_ID", "client-teste");
  sessionStorage.setItem(PKCE_KEY, JSON.stringify({ verifier: "verifier-teste", state: "state-ok" }));
  vi.mocked(exchangeCode).mockResolvedValue({ accessToken: "tok", expiresAt: Date.now() + 3600_000 });
  vi.mocked(getMyPlaylists).mockResolvedValue([
    { id: "m1", name: "Minha Playlist", uri: "spotify:playlist:m1", imageUrl: null },
  ]);
});

afterEach(() => {
  vi.unstubAllEnvs();
  sessionStorage.clear();
  window.history.replaceState(null, "", "/");
});

describe("callback do Spotify", () => {
  it("após conectar, o player já mostra a conta conectada e as playlists do usuário, sem recarregar", async () => {
    arriveFromSpotify("code=codigo&state=state-ok");
    await renderCallback();

    await waitFor(() => expect(loadToken()).not.toBeNull());
    await userEvent.click(await screen.findByRole("button", { name: "Playlists do Spotify" }));

    expect(await screen.findByRole("button", { name: /desconectar spotify/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^conectar spotify/i })).not.toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /minha playlist/i })).toBeInTheDocument();
    expect(exchangeCode).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: "client-teste", code: "codigo", verifier: "verifier-teste" }),
    );
  });

  it("state divergente mostra erro e não salva token", async () => {
    arriveFromSpotify("code=codigo&state=outro-state");
    await renderCallback();

    expect(await screen.findByText(/conexão com o spotify cancelada/i)).toBeInTheDocument();
    expect(exchangeCode).not.toHaveBeenCalled();
    expect(loadToken()).toBeNull();
    expect(sessionStorage.getItem(PKCE_KEY)).toBeNull();
  });
});
