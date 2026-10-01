// @vitest-environment jsdom
import { act, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createTestServices, loginDemo, renderWithProviders } from "@/test/renderWithProviders";
import { AppRoutes } from "./router";

describe("AppProviders", () => {
  it("sessão expirada (dotstudy:unauthorized) zera o usuário e volta para o login", async () => {
    const services = createTestServices();
    await loginDemo(services);
    renderWithProviders(<AppRoutes />, { route: "/ranking", services });
    await screen.findByRole("link", { name: /ranking/i });

    await act(async () => {
      window.dispatchEvent(new Event("dotstudy:unauthorized"));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(await screen.findByRole("heading", { name: /entrar/i })).toBeInTheDocument();
  });
});
