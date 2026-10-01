import { createApiServices } from "./api";
import type { Services } from "./contracts";
import { createMockServices } from "./mock";

export type AppServices = Services & { resetDemoData?: () => void };

export function createServices(source: string | undefined): AppServices {
  if (source === undefined || source === "" || source === "mock") return createMockServices();
  if (source === "api") return createApiServices({ baseUrl: import.meta.env.VITE_API_URL ?? "" });
  throw new Error(`VITE_DATA_SOURCE="${source}" inválido (use "mock" ou "api").`);
}

let singleton: AppServices | null = null;
export function getServices(): AppServices {
  singleton ??= createServices(import.meta.env.VITE_DATA_SOURCE);
  return singleton;
}
