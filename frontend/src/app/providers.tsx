/* eslint-disable react-refresh/only-export-components */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { ServicesProvider } from "@/services/ServicesContext";
import type { AppServices } from "@/services";

export const THEME_KEY = "dotstudy:theme";

export function readTheme(): "light" | "dark" {
  try {
    return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function applyTheme(theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // navegação privada sem storage: o tema só não persiste
  }
}

export function AppProviders({
  services,
  children,
  queryClient,
}: {
  services: AppServices;
  children: ReactNode;
  queryClient?: QueryClient;
}) {
  const [client] = useState(
    () => queryClient ?? new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } }),
  );
  useEffect(() => applyTheme(readTheme()), []);
  return (
    <ServicesProvider value={services}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </ServicesProvider>
  );
}
