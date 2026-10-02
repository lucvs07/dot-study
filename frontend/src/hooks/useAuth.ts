import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@/services/contracts";
import { useServices } from "@/services/ServicesContext";
import { queryKeys } from "@/app/queryKeys";

export function useAuth() {
  const services = useServices();
  const queryClient = useQueryClient();
  const me = useQuery({ queryKey: queryKeys.me, queryFn: () => services.auth.me() });
  return {
    user: me.data ?? null,
    isLoading: me.isLoading,
    async login(email: string, password: string) {
      queryClient.setQueryData(queryKeys.me, await services.auth.login({ email, password }));
    },
    async register(name: string, email: string, password: string) {
      queryClient.setQueryData(queryKeys.me, await services.auth.register({ name, email, password }));
    },
    async logout() {
      await services.auth.logout();
      // Zera `me` antes de limpar o resto: `clear()` removeria a query sem avisar os
      // observers (ProtectedRoute), e a tela não voltaria para o login.
      queryClient.setQueryData(queryKeys.me, null);
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== queryKeys.me[0] });
    },
  };
}

export function useCurrentUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error("useCurrentUser fora de rota protegida");
  return user;
}
