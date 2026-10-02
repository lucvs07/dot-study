// @vitest-environment jsdom
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AppRoutes } from "@/app/router";
import { createTestServices, loginDemo, renderWithProviders } from "@/test/renderWithProviders";

async function open(route: string) {
  const services = createTestServices();
  await loginDemo(services);
  return renderWithProviders(<AppRoutes />, { route, services });
}

describe("Dashboard", () => {
  it("cumprimenta o usuário e mostra a sequência de dias", async () => {
    await open("/");
    expect(await screen.findByText(/guilherme/i)).toBeInTheDocument();
    expect(screen.getByText(/dias? seguidos?|sequência/i)).toBeInTheDocument();
  });
});

describe("Histórico", () => {
  it("lista sessões do seed agrupadas por data e o tempo total", async () => {
    await open("/historico");
    expect(await screen.findByText("Cálculo Diferencial")).toBeInTheDocument();
    expect(screen.getAllByText(/^(Hoje|Ontem)$/).length).toBeGreaterThan(0);
    expect(screen.getByText("6h 15min")).toBeInTheDocument();
  });
});

describe("Ranking", () => {
  it("mostra Matemática por padrão e troca de assunto", async () => {
    await open("/ranking");
    const first = await screen.findByText("Ana Clara M.");
    expect(within(first.closest("li, div")!).getByText(/510/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /programação/i }));
    expect(await screen.findByText("Pedro Lima")).toBeInTheDocument();
  });
});
