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

describe("Feed", () => {
  it("lista posts, filtra por assunto e abre o detalhe", async () => {
    await open("/feed");
    expect(await screen.findByText("Como eu finalmente entendi Integrais")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /^física$/i }));
    expect(await screen.findByText("Eletromagnetismo desmistificado")).toBeInTheDocument();
    expect(screen.queryByText("Como eu finalmente entendi Integrais")).not.toBeInTheDocument();
    await userEvent.click(screen.getByText("Eletromagnetismo desmistificado"));
    expect(await screen.findByRole("heading", { name: "Eletromagnetismo desmistificado" })).toBeInTheDocument();
  });

  it("curtir atualiza o contador e persiste", async () => {
    const { services } = await open("/feed/p1");
    await userEvent.click(await screen.findByRole("button", { name: /curtir/i }));
    expect(await screen.findByText("48")).toBeInTheDocument();
    expect((await services.posts.get("p1")).likedByMe).toBe(true);
  });

  it("comentar e responder", async () => {
    const { services } = await open("/feed/p2");
    await userEvent.type(await screen.findByPlaceholderText(/comentário/i), "Muito bom!");
    await userEvent.click(screen.getByRole("button", { name: /enviar/i }));
    expect(await screen.findByText("Muito bom!")).toBeInTheDocument();
    expect((await services.posts.get("p2")).commentCount).toBe(1);
  });
});
