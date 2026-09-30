// @vitest-environment jsdom
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "@/app/router";
import { ServiceError } from "@/services/contracts";
import { createTestServices, loginDemo, renderWithProviders } from "@/test/renderWithProviders";

async function startChallenge() {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const services = createTestServices();
  await loginDemo(services);
  renderWithProviders(<AppRoutes />, { route: "/estudar", services });
  await user.click(await screen.findByRole("button", { name: /fácil/i }));
  await user.click(screen.getByRole("button", { name: /matemática/i }));
  await user.click(screen.getByRole("button", { name: /iniciar desafio/i }));
  await screen.findByText(/tema do desafio/i);
  return { user, services };
}

describe("Estudar (desafio)", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true, now: new Date("2026-09-29T12:00:00Z") }));
  afterEach(() => vi.useRealTimers());

  it("inicia desafio, conclui o ciclo e ganha +10 moedas", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const services = createTestServices();
    await loginDemo(services);
    renderWithProviders(<AppRoutes />, { route: "/estudar", services });
    await user.click(await screen.findByRole("button", { name: /fácil/i }));
    await user.click(screen.getByRole("button", { name: /matemática/i }));
    await user.click(screen.getByRole("button", { name: /começar|iniciar/i }));
    expect((await services.sessions.list())[0]).toMatchObject({
      status: "in_progress",
      subjectId: 1,
      focusMinutes: 15,
    });
    await act(async () => {
      vi.advanceTimersByTime(15 * 60_000 + 500);
    });
    expect(await screen.findByText(/\+10/)).toBeInTheDocument();
    expect((await services.users.getStats()).completedCycles).toBe(13);
  });

  it("modo demo: desafio de 1 min completa e mostra +10", async () => {
    vi.stubEnv("VITE_DEMO_MODE", "true");
    try {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const services = createTestServices();
      await loginDemo(services);
      renderWithProviders(<AppRoutes />, { route: "/estudar", services });
      await user.click(await screen.findByRole("button", { name: /demo/i }));
      await user.click(screen.getByRole("button", { name: /física/i }));
      await user.click(screen.getByRole("button", { name: /iniciar desafio/i }));
      await screen.findByText(/tema do desafio/i);
      expect((await services.sessions.list())[0]).toMatchObject({ focusMinutes: 1, subjectId: 2 });
      await act(async () => {
        vi.advanceTimersByTime(60_000 + 500);
      });
      expect(await screen.findByText(/\+10/)).toBeInTheDocument();
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("publica o post da sessão, abre o post e mostra as moedas do post", async () => {
    const { user, services } = await startChallenge();
    await act(async () => {
      vi.advanceTimersByTime(15 * 60_000 + 500);
    });
    await user.click(await screen.findByRole("button", { name: /publicar no feed/i }));
    expect(await screen.findByRole("status")).toHaveTextContent(/\+30 moedas/);
    expect(screen.getByRole("link", { name: /feed/i })).toHaveAttribute("aria-current", "page");
    const { items } = await services.posts.list();
    const session = (await services.sessions.list())[0];
    const post = items.find((p) => p.sessionId === session.id);
    expect(post).toMatchObject({ type: "text", title: expect.stringMatching(/^O que aprendi sobre /) });
    expect(await screen.findByRole("heading", { name: post!.title })).toBeInTheDocument();
  });

  it("o timer continua na leitura e volta ao estudo quando o ciclo termina", async () => {
    const { user } = await startChallenge();
    await user.click(screen.getByRole("button", { name: /uma visão geral/i }));
    expect(await screen.findByText(/em andamento/i)).toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(15 * 60_000 + 500);
    });
    expect(await screen.findByText(/\+10/)).toBeInTheDocument();
  });

  it("resetar abandona a sessão em andamento", async () => {
    const { user, services } = await startChallenge();
    await user.click(screen.getByRole("button", { name: /nova sessão/i }));
    await screen.findByRole("button", { name: /iniciar desafio/i });
    expect((await services.sessions.list()).find((s) => s.status === "in_progress")).toBeUndefined();
  });

  it("ciclo recusado pelo serviço mostra o erro e volta ao setup", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const services = createTestServices();
    await loginDemo(services);
    vi.spyOn(services.sessions, "completeCycle").mockRejectedValue(
      new ServiceError("CYCLE_TOO_SOON", "Esse ciclo ainda não terminou."),
    );
    renderWithProviders(<AppRoutes />, { route: "/estudar", services });
    await user.click(await screen.findByRole("button", { name: /fácil/i }));
    await user.click(screen.getByRole("button", { name: /matemática/i }));
    await user.click(screen.getByRole("button", { name: /iniciar desafio/i }));
    await act(async () => {
      vi.advanceTimersByTime(15 * 60_000 + 500);
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(/ainda não terminou/i);
    expect(screen.getByRole("button", { name: /iniciar desafio/i })).toBeInTheDocument();
  });
});

describe("Estudar (livre)", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true, now: new Date("2026-09-29T12:00:00Z") }));
  afterEach(() => vi.useRealTimers());

  it("roda foco, pausa e foco, salva anotações e mostra o resumo", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const services = createTestServices();
    await loginDemo(services);
    renderWithProviders(<AppRoutes />, { route: "/estudar", services });
    await user.click(await screen.findByRole("button", { name: /livre/i }));
    await user.click(screen.getByRole("button", { name: /começar sessão livre/i }));
    expect((await services.sessions.list())[0]).toMatchObject({
      mode: "free",
      status: "in_progress",
      focusMinutes: 25,
      breakMinutes: 5,
      plannedCycles: 2,
    });
    await user.type(await screen.findByPlaceholderText(/o que você está aprendendo/i), "derivadas");
    await act(async () => {
      vi.advanceTimersByTime(900);
    });
    expect((await services.sessions.list())[0].notes).toBe("derivadas");

    await act(async () => {
      vi.advanceTimersByTime(25 * 60_000 + 500);
    });
    expect(await screen.findByText(/^pausa ·/i)).toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(5 * 60_000 + 500);
    });
    expect(await screen.findByText(/sessão 2 de 2/i)).toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(25 * 60_000 + 500);
    });
    expect(await screen.findByText(/\+20 moedas/)).toBeInTheDocument();
    expect(screen.getByText(/tempo total: 50min/i)).toBeInTheDocument();
    expect((await services.sessions.list())[0]).toMatchObject({ status: "completed", completedCycles: 2 });
  });
});
