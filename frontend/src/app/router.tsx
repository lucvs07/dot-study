import { Navigate, Route, Routes } from "react-router";
import { AppLayout } from "./AppLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { LoginPage } from "@/pages/LoginPage";
import { CadastroPage } from "@/pages/CadastroPage";
import {
  ArticlesView,
  DashboardView,
  FeedView,
  HistoryView,
  PostDetailView,
  RankingView,
  ReaderView,
  SettingsView,
  ShopView,
  TimerView,
} from "./App";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<CadastroPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardView />} />
          <Route path="estudar" element={<TimerView />} />
          <Route path="feed" element={<FeedView />} />
          {/* LEGADO: removido na Task 15 — rotas das views do protótipo ainda sem página própria */}
          <Route path="feed/post" element={<PostDetailView />} />
          <Route path="leitura" element={<ArticlesView />} />
          <Route path="leitura/artigo" element={<ReaderView />} />
          <Route path="ranking" element={<RankingView />} />
          <Route path="historico" element={<HistoryView />} />
          <Route path="loja" element={<ShopView />} />
          <Route path="ajustes" element={<SettingsView />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
