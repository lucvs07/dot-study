import { ArrowLeft, Lock, Clock, BookOpen } from "lucide-react";
import { MOCK_ARTICLES, type Article } from "./articleData";

type ReaderChallenge = {
  subjectName: string;
  subjectColor: string;
  theme: string;
};

const SOURCE_COLORS: Record<string, string> = {
  arXiv: "#B91C1C",
  "Semantic Scholar": "#1D4ED8",
  CORE: "#065F46",
};

export function ArticlesView({
  challenge,
  setView,
  setSelectedArticle,
}: {
  challenge: ReaderChallenge | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setView: (v: any) => void;
  setSelectedArticle: (a: Article) => void;
}) {
  const articles = MOCK_ARTICLES.slice(0, 6);

  return (
    <div className="flex flex-col p-6 gap-6" style={{ minHeight: "100vh" }}>
      {/* Header */}
      <div>
        <button
          onClick={() => setView("timer")}
          className="flex items-center gap-1.5 mb-5 hover:opacity-70 transition-opacity"
          style={{ fontFamily: "Inter", fontSize: "0.82rem", color: "var(--muted-foreground)" }}
        >
          <ArrowLeft size={15} /> Voltar ao timer
        </button>

        <div className="flex items-start gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: "1.2rem",
                  color: "var(--foreground)",
                  lineHeight: 1.25,
                }}
              >
                {challenge?.theme ?? "Artigos"}
              </h2>
              {challenge && (
                <span
                  style={{
                    fontFamily: "Inter",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: challenge.subjectColor,
                    background: `${challenge.subjectColor}18`,
                    padding: "2px 8px",
                    borderRadius: 6,
                  }}
                >
                  {challenge.subjectName}
                </span>
              )}
            </div>
            <p
              style={{
                fontFamily: "Inter",
                fontSize: "0.78rem",
                color: "var(--muted-foreground)",
                marginTop: 6,
              }}
            >
              Artigos encontrados para esta sessão — selecione um para ler
            </p>
          </div>
          <BookOpen size={18} color="var(--muted-foreground)" style={{ flexShrink: 0, marginTop: 2 }} />
        </div>
      </div>

      {/* Article cards */}
      <div className="flex flex-col gap-3">
        {articles.map((article) => (
          <button
            key={article.id}
            onClick={() => {
              setSelectedArticle(article);
              setView("reader");
            }}
            className="text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: "var(--card)",
              border: "1px solid rgba(17,24,39,0.08)",
              borderRadius: 16,
              padding: "16px 18px",
            }}
          >
            {/* Title */}
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 600,
                fontSize: "0.92rem",
                color: "var(--foreground)",
                lineHeight: 1.4,
                marginBottom: 4,
              }}
            >
              {article.title}
            </p>

            {/* Authors */}
            <p
              style={{
                fontFamily: "Inter",
                fontSize: "0.74rem",
                color: "var(--muted-foreground)",
                marginBottom: 12,
              }}
            >
              {article.authors.join(", ")}
            </p>

            {/* Footer row: badges + read time */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Source badge */}
              <span
                style={{
                  fontFamily: "Inter",
                  fontSize: "0.68rem",
                  fontWeight: 600,
                  color: SOURCE_COLORS[article.source] ?? "#374151",
                  background: `${SOURCE_COLORS[article.source] ?? "#374151"}14`,
                  padding: "2px 7px",
                  borderRadius: 5,
                }}
              >
                {article.source}
              </span>

              {/* Year badge */}
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.7rem",
                  color: "var(--muted-foreground)",
                  background: "rgba(17,24,39,0.05)",
                  padding: "2px 7px",
                  borderRadius: 5,
                }}
              >
                {article.year}
              </span>

              {/* Abstract-only lock */}
              {article.abstractOnly && (
                <span
                  className="flex items-center gap-1"
                  style={{
                    fontFamily: "Inter",
                    fontSize: "0.68rem",
                    color: "var(--muted-foreground)",
                  }}
                >
                  <Lock size={10} /> Resumo
                </span>
              )}

              {/* Read time — pushed right */}
              <span
                className="flex items-center gap-1 ml-auto"
                style={{
                  fontFamily: "Inter",
                  fontSize: "0.72rem",
                  color: "var(--muted-foreground)",
                }}
              >
                <Clock size={11} />
                {article.readTime} min
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}