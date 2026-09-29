import type { Services } from "./contracts";
import { createMockServices } from "./mock";

export type AppServices = Services & { resetDemoData?: () => void };

export function createServices(source: string | undefined): AppServices {
  if (source === undefined || source === "mock") return createMockServices();
  throw new Error(`VITE_DATA_SOURCE="${source}" ainda não está disponível neste checkpoint (use "mock").`);
}

let singleton: AppServices | null = null;
export function getServices(): AppServices {
  singleton ??= createServices(import.meta.env.VITE_DATA_SOURCE);
  return singleton;
}
