import { Navigate, Outlet, useLocation } from "react-router";
import { LoadingState } from "@/components/LoadingState";
import { CurrentUserProvider, useAuth } from "@/hooks/useAuth";

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <LoadingState />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  // CurrentUserProvider: as páginas abaixo leem o usuário pelo contexto (useCurrentUser),
  // nunca direto da query `me` — assim a sessão expirar não cria uma corrida entre o
  // redirecionamento daqui e um re-render independente da página (ver comentário em
  // CurrentUserProvider, em hooks/useAuth.tsx).
  return (
    <CurrentUserProvider user={user}>
      <Outlet />
    </CurrentUserProvider>
  );
}
