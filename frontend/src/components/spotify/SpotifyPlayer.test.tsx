// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { SpotifyPlayer } from "./SpotifyPlayer";

// Nunca carregar o script real do Spotify nos testes: o iFrame API só importa quando
// o dropdown é aberto, então basta garantir que createController nunca é chamado
// sem querermos, e mockar quando o teste efetivamente abre o dropdown.
vi.mock("@/spotify/embedController", () => ({
  createController: vi.fn(() =>
    Promise.resolve({
      loadUri: vi.fn(),
      togglePlay: vi.fn(),
      addListener: vi.fn(),
      destroy: vi.fn(),
    }),
  ),
}));

afterEach(() => {
  sessionStorage.clear();
});

describe("SpotifyPlayer", () => {
  it("mostra as playlists curadas e não oferece Conectar Spotify sem client id", async () => {
    renderWithProviders(<SpotifyPlayer />);
    await userEvent.click(screen.getByRole("button", { name: "Playlists do Spotify" }));
    expect(await screen.findByRole("button", { name: /peaceful piano/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /lofi deep focus/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /lofi study/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /conectar spotify/i })).not.toBeInTheDocument();
  });
});
