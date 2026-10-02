// @vitest-environment jsdom
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { SpotifyPlayer } from "./SpotifyPlayer";

// Nunca carregar o script real do Spotify nos testes: o iFrame API só importa quando
// o dropdown é aberto, então basta garantir que createController nunca é chamado
// sem querermos, e mockar quando o teste efetivamente abre o dropdown. O mesmo objeto
// mockado é devolvido em toda chamada, para que os testes possam inspecionar suas
// chamadas (ex.: `destroy`) depois de interagir com o componente.
const mockController = {
  loadUri: vi.fn(),
  togglePlay: vi.fn(),
  addListener: vi.fn(),
  destroy: vi.fn(),
};
vi.mock("@/spotify/embedController", () => ({
  createController: vi.fn(() => Promise.resolve(mockController)),
}));

afterEach(() => {
  sessionStorage.clear();
  vi.clearAllMocks();
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

  it("destrói o controller do embed ao desmontar (ex.: logout)", async () => {
    const { unmount } = renderWithProviders(<SpotifyPlayer />);
    await userEvent.click(screen.getByRole("button", { name: "Playlists do Spotify" }));
    // Espera o controller ser efetivamente criado (createController resolve de forma
    // assíncrona) antes de desmontar, senão não há nada para destruir ainda.
    await waitFor(() => expect(mockController.addListener).toHaveBeenCalled());

    unmount();

    expect(mockController.destroy).toHaveBeenCalledTimes(1);
  });
});
