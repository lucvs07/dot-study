import { render } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router";
import { AppProviders } from "@/app/providers";
import type { AppServices } from "@/services";
import { createMockServices } from "@/services/mock";
import { createMemoryMediaStore } from "@/services/mock/media";
import { createMemoryStorage } from "@/services/mock/storage";

export function createTestServices(): AppServices {
  return createMockServices({
    storage: createMemoryStorage(),
    mediaStore: createMemoryMediaStore(),
    latencyRange: [0, 0],
  });
}

export function renderWithProviders(
  ui: ReactElement,
  { route = "/", services = createTestServices() }: { route?: string; services?: AppServices } = {},
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return {
    services,
    ...render(
      <AppProviders services={services} queryClient={queryClient}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </AppProviders>,
    ),
  };
}

export async function loginDemo(services: AppServices) {
  await services.auth.login({ email: "demo@dotstudy.app", password: "dotstudy123" });
}
