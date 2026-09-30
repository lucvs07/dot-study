// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AppRoutes } from "@/app/router";
import { createTestServices, loginDemo, renderWithProviders } from "@/test/renderWithProviders";

async function open(route: string) {
  const services = createTestServices();
  await loginDemo(services);
  return renderWithProviders(<AppRoutes />, { route, services });
}

describe("Loja", () => {
  it("compra acessório, debita moedas e permite equipar", async () => {
    const { services } = await open("/loja");
    await userEvent.click(await screen.findByRole("button", { name: /comprar laço rosa/i }));
    expect(await screen.findByText("590")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /equipar laço rosa/i }));
    expect((await services.auth.me())?.activeAccessoryId).toBe("bow");
  });

  it("acessório caro aparece bloqueado", async () => {
    await open("/loja");
    expect(await screen.findByRole("button", { name: /comprar coroa dourada/i })).toBeDisabled();
  });
});

describe("Ajustes", () => {
  it("não oferece login com Google", async () => {
    await open("/ajustes");
    expect(await screen.findByRole("heading", { name: /ajustes/i })).toBeInTheDocument();
    expect(screen.queryByText(/google/i)).not.toBeInTheDocument();
  });

  it("altera o nome e sai da conta", async () => {
    const { services } = await open("/ajustes");
    const name = await screen.findByLabelText(/nome/i);
    await userEvent.clear(name);
    await userEvent.type(name, "Gui");
    await userEvent.click(screen.getByRole("button", { name: /salvar nome/i }));
    expect((await services.auth.me())?.name).toBe("Gui");
    await userEvent.click(screen.getByRole("button", { name: /sair/i }));
    expect(await screen.findByRole("heading", { name: /entrar/i })).toBeInTheDocument();
  });
});
