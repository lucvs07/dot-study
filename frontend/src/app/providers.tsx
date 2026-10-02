/* eslint-disable react-refresh/only-export-components */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { ServicesProvider } from "@/services/ServicesContext";
import type { AppServices } from "@/services";
import { queryKeys } from "@/app/queryKeys";
import { UNAUTHORIZED_EVENT } from "@/services/api/http";

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
  useEffect(() => {
    const onUnauthorized = () => client.setQueryData(queryKeys.me, null);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [client]);
  return (
    <ServicesProvider value={services}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </ServicesProvider>
  );
}
