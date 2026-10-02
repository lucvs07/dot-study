// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PostPublisher } from "./PostPublisher";
import { createTestServices, loginDemo, renderWithProviders } from "@/test/renderWithProviders";

class FakeRecorder {
  static isTypeSupported = () => true;
  state: "inactive" | "recording" = "inactive";
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor(public stream: MediaStream) {}
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob(["x"], { type: "audio/webm" }) });
    this.onstop?.();
  }
}

describe("PostPublisher", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("publica texto e informa as moedas ganhas", async () => {
    const services = createTestServices();
    await loginDemo(services);
    const onPublished = vi.fn();
    renderWithProviders(
      <PostPublisher
        sessionId={null}
        theme="Álgebra Linear"
        accentColor="#22CFD5"
        onPublished={onPublished}
        onSkip={() => {}}
      />,
      { services },
    );
    expect(screen.getByDisplayValue("O que aprendi sobre Álgebra Linear")).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText(/escreva|conte/i), "Vetores e matrizes.");
    await userEvent.click(screen.getByRole("button", { name: /publicar/i }));
    await vi.waitFor(() => expect(onPublished).toHaveBeenCalledWith({ postId: expect.any(String), coinsEarned: 0 }));
  });

  it("sem suporte a gravação, áudio mostra aviso e texto continua disponível", async () => {
    vi.stubGlobal("MediaRecorder", undefined);
    const services = createTestServices();
    await loginDemo(services);
    renderWithProviders(
      <PostPublisher sessionId={null} theme="Óptica" accentColor="#FFC23D" onPublished={() => {}} onSkip={() => {}} />,
      { services },
    );
    await userEvent.click(screen.getByRole("button", { name: /áudio/i }));
    await userEvent.click(screen.getByRole("button", { name: /gravar/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/não permite gravar/i);
    // O protótipo chama a aba de texto de "Artigo".
    await userEvent.click(screen.getByRole("button", { name: /artigo|texto/i }));
    expect(screen.getByRole("button", { name: /publicar/i })).toBeEnabled();
  });

  it("grava áudio, envia a mídia e publica com duração", async () => {
    vi.stubGlobal("MediaRecorder", FakeRecorder);
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] }),
      },
    });
    URL.createObjectURL = vi.fn(() => "blob:preview");
    const services = createTestServices();
    await loginDemo(services);
    const create = vi.spyOn(services.posts, "create");
    const onPublished = vi.fn();
    renderWithProviders(
      <PostPublisher
        sessionId={null}
        theme="Óptica"
        accentColor="#FFC23D"
        onPublished={onPublished}
        onSkip={() => {}}
      />,
      { services },
    );
    await userEvent.click(screen.getByRole("button", { name: /áudio/i }));
    const publish = screen.getByRole("button", { name: /publicar/i });
    expect(publish).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: /^gravar$/i }));
    await userEvent.click(await screen.findByRole("button", { name: /parar/i }));
    expect(await screen.findByText(/gravação pronta/i)).toBeInTheDocument();
    await userEvent.click(publish);
    await vi.waitFor(() => expect(onPublished).toHaveBeenCalled());
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "audio",
        mediaUrl: expect.stringMatching(/^idb:\/\//),
        mediaDurationSec: expect.any(Number),
      }),
    );
    expect(create.mock.calls[0][0].mediaDurationSec).toBeGreaterThanOrEqual(1);
  });
});
