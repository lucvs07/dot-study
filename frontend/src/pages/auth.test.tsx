// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { AppRoutes } from "@/app/router";

describe("autenticação", () => {
  it("sem login, rota protegida manda para /login", async () => {
    renderWithProviders(<AppRoutes />, { route: "/ranking" });
    expect(await screen.findByRole("heading", { name: /entrar/i })).toBeInTheDocument();
  });

  it("login com o usuário demo abre o dashboard", async () => {
    renderWithProviders(<AppRoutes />, { route: "/login" });
    await userEvent.type(await screen.findByLabelText(/email/i), "demo@dotstudy.app");
    await userEvent.type(screen.getByLabelText(/senha/i), "dotstudy123");
    await userEvent.click(screen.getByRole("button", { name: /entrar/i }));
    expect(await screen.findByText(/guilherme/i)).toBeInTheDocument();
  });

  it("mostra erro de credencial inválida", async () => {
    renderWithProviders(<AppRoutes />, { route: "/login" });
    await userEvent.type(await screen.findByLabelText(/email/i), "demo@dotstudy.app");
    await userEvent.type(screen.getByLabelText(/senha/i), "errada123");
    await userEvent.click(screen.getByRole("button", { name: /entrar/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Email ou senha incorretos.");
  });

  it("cadastro cria conta e entra com 250 moedas", async () => {
    renderWithProviders(<AppRoutes />, { route: "/cadastro" });
    await userEvent.type(await screen.findByLabelText(/nome/i), "Nova Pessoa");
    await userEvent.type(screen.getByLabelText(/email/i), "nova@teste.com");
    await userEvent.type(screen.getByLabelText(/^senha/i), "segredo12");
    await userEvent.click(screen.getByRole("button", { name: /criar conta/i }));
    expect(await screen.findByText(/nova pessoa/i)).toBeInTheDocument();
    expect(screen.getByText("250")).toBeInTheDocument();
  });
});
