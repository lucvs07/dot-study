// @vitest-environment jsdom
import { act, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createTestServices, loginDemo, renderWithProviders } from "@/test/renderWithProviders";
import { AppRoutes } from "./router";

async function expectLandsOnLogin() {
  expect(await screen.findByRole("heading", { name: /entrar/i })).toBeInTheDocument();
}

describe("AppProviders", () => {
  it("sessão expirada (dotstudy:unauthorized) disparada de forma síncrona zera o usuário e volta para o login, sem tela em branco", async () => {
    const services = createTestServices();
    await loginDemo(services);
    renderWithProviders(<AppRoutes />, { route: "/ranking", services });
    await screen.findByRole("link", { name: /ranking/i });

    act(() => {
      window.dispatchEvent(new Event("dotstudy:unauthorized"));
    });

    await expectLandsOnLogin();
  });

  it("sessão expirada disparada de forma assíncrona (como um 401 vindo de uma queryFn) também volta para o login, sem tela em branco", async () => {
    const services = createTestServices();
    await loginDemo(services);
    renderWithProviders(<AppRoutes />, { route: "/ranking", services });
    await screen.findByRole("link", { name: /ranking/i });

    await act(async () => {
      await Promise.resolve().then(() => window.dispatchEvent(new Event("dotstudy:unauthorized")));
    });

    await expectLandsOnLogin();
  });
});
