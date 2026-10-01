/* eslint-disable react-refresh/only-export-components */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, type ReactNode } from "react";
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

const CurrentUserContext = createContext<User | null>(null);

/**
 * Fornecido só pelo `ProtectedRoute`, em volta do `<Outlet/>`: dá para as páginas
 * protegidas o usuário atual sem que elas precisem observar a query `me` diretamente.
 *
 * Isso importa porque a sessão pode expirar (evento `dotstudy:unauthorized`) enquanto
 * uma página protegida está montada: se a página também assinasse a query `me` (como
 * fazia antes via `useAuth()` dentro de `useCurrentUser`), ela ganharia seu próprio
 * re-render independente do `ProtectedRoute`, e nada garante que o redirecionamento
 * para `/login` vença essa corrida antes da página tentar ler `user` como `null` (tela
 * em branco, sem error boundary). Como `useCurrentUser` só lê este contexto, o único
 * jeito dele mudar é o `ProtectedRoute` re-renderizar — e quando a sessão expira, o
 * `ProtectedRoute` simplesmente para de renderizar este provider/Outlet (troca para
 * `<Navigate/>`), então a página protegida nunca chega a observar um usuário nulo.
 */
export function CurrentUserProvider({ user, children }: { user: User; children: ReactNode }) {
  return <CurrentUserContext.Provider value={user}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser(): User {
  const user = useContext(CurrentUserContext);
  if (!user) throw new Error("useCurrentUser fora de rota protegida");
  return user;
}
