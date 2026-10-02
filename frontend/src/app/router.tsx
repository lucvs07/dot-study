import { Navigate, Route, Routes } from "react-router";
import { AppLayout } from "./AppLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { LoginPage } from "@/pages/LoginPage";
import { CadastroPage } from "@/pages/CadastroPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { HistoricoPage } from "@/pages/HistoricoPage";
import { RankingPage } from "@/pages/RankingPage";
import { EstudarPage } from "@/pages/EstudarPage";
import { LeituraListaPage } from "@/pages/LeituraListaPage";
import { LeituraPage } from "@/pages/LeituraPage";
import { FeedPage } from "@/pages/FeedPage";
import { PostPage } from "@/pages/PostPage";
import { LojaPage } from "@/pages/LojaPage";
import { AjustesPage } from "@/pages/AjustesPage";
import { SpotifyCallbackPage } from "@/pages/SpotifyCallbackPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<CadastroPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="estudar" element={<EstudarPage />} />
          <Route path="leitura" element={<LeituraListaPage />} />
          <Route path="leitura/:id" element={<LeituraPage />} />
          <Route path="feed" element={<FeedPage />} />
          <Route path="feed/:postId" element={<PostPage />} />
          <Route path="ranking" element={<RankingPage />} />
          <Route path="historico" element={<HistoricoPage />} />
          <Route path="loja" element={<LojaPage />} />
          <Route path="ajustes" element={<AjustesPage />} />
          <Route path="spotify/callback" element={<SpotifyCallbackPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
