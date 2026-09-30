// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { createTestServices, loginDemo, renderWithProviders } from "@/test/renderWithProviders";
import { useAuth } from "@/hooks/useAuth";
import { AppRoutes } from "./router";

function LogoutButton() {
  const { logout } = useAuth();
  return <button onClick={() => void logout()}>Sair</button>;
}

async function renderLogged(route: string) {
  const services = createTestServices();
  await loginDemo(services);
  return renderWithProviders(<AppRoutes />, { route, services });
}

describe("rotas do app", () => {
  it.each(["/", "/estudar", "/feed", "/ranking", "/historico", "/loja", "/ajustes", "/leitura"])(
    "logado, %s monta a view dentro do layout com a navegação",
    async (route) => {
      await renderLogged(route);
      expect(await screen.findByRole("link", { name: /ranking/i })).toBeInTheDocument();
      expect(screen.getAllByText("840").length).toBeGreaterThan(0);
    },
  );

  it("a navegação inferior troca de rota e marca a aba ativa", async () => {
    await renderLogged("/");
    await userEvent.click(await screen.findByRole("link", { name: /ranking/i }));
    expect(screen.getByRole("link", { name: /ranking/i })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /início/i })).not.toHaveAttribute("aria-current");
  });

  it("post e artigo sem seleção voltam para a lista", async () => {
    await renderLogged("/feed/post");
    expect(await screen.findByRole("link", { name: /feed/i })).toHaveAttribute("aria-current", "page");
  });

  it("rota desconhecida cai no dashboard", async () => {
    await renderLogged("/nao-existe");
    expect(await screen.findByText(/guilherme/i)).toBeInTheDocument();
  });

  it("sair da conta volta para o login", async () => {
    const services = createTestServices();
    await loginDemo(services);
    renderWithProviders(
      <>
        <AppRoutes />
        <LogoutButton />
      </>,
      { route: "/ranking", services },
    );
    await screen.findByRole("link", { name: /ranking/i });
    await userEvent.click(screen.getByRole("button", { name: "Sair" }));
    expect(await screen.findByRole("heading", { name: /entrar/i })).toBeInTheDocument();
  });
});
