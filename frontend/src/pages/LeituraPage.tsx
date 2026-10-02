import { Navigate, useParams } from "react-router";
import { ReaderView } from "@/content/ReaderView";
import { MOCK_ARTICLES, articlesForTheme, type Article } from "@/content/articleData";
import { StudyFloatingTimer } from "@/content/StudyFloatingTimer";
import { useStudy } from "@/content/StudyContext";

function findArticle(id: string, selected: Article | null, theme: string | null): Article | null {
  if (selected?.id === id) return selected;
  return (
    MOCK_ARTICLES.find((a) => a.id === id) ?? (theme ? articlesForTheme(theme).find((a) => a.id === id) : null) ?? null
  );
}

export function LeituraPage() {
  const { id = "" } = useParams();
  const { challenge, selectedArticle } = useStudy();
  const article = findArticle(id, selectedArticle, challenge?.theme ?? null);
  if (!article) return <Navigate to="/leitura" replace />;
  return (
    <>
      <ReaderView key={article.id} article={article} challenge={challenge} />
      <StudyFloatingTimer />
    </>
  );
}
