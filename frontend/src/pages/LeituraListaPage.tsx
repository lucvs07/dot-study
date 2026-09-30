import { ArticlesView } from "@/content/ArticlesView";
import { StudyFloatingTimer } from "@/content/StudyFloatingTimer";
import { useStudy } from "@/content/StudyContext";

export function LeituraListaPage() {
  const { challenge, setSelectedArticle } = useStudy();
  return (
    <>
      <ArticlesView challenge={challenge} setSelectedArticle={setSelectedArticle} />
      <StudyFloatingTimer />
    </>
  );
}
