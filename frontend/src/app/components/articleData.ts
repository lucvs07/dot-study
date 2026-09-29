export type Article = {
  id: string;
  title: string;
  titlePt: string;
  authors: string[];
  year: number;
  source: "arXiv" | "Semantic Scholar" | "CORE";
  readTime: number;
  abstractOnly: boolean;
  abstract: string;
  abstractPt: string;
  content?: string[];
  contentPt?: string[];
};

export const MOCK_ARTICLES: Article[] = [
  {
    id: "art1",
    title: "Quantum Decoherence and the Emergence of Classical Reality in Open Systems",
    titlePt: "Decoerência Quântica e o Surgimento da Realidade Clássica em Sistemas Abertos",
    authors: ["W. H. Zurek", "J. P. Paz", "S. Habib"],
    year: 2023,
    source: "arXiv",
    readTime: 7,
    abstractOnly: true,
    abstract:
      "We present a comprehensive analysis of quantum decoherence as the mechanism underlying the transition from quantum superpositions to classical definiteness in macroscopic systems. Through interaction with environmental degrees of freedom, quantum coherences are suppressed on timescales far shorter than any experimentally accessible measurement. We demonstrate that preferred 'pointer states' emerge naturally from the system-environment Hamiltonian and correspond precisely to the classical states observed in everyday experience. Our results provide a rigorous foundation for understanding why the quantum-to-classical transition occurs without invoking wave function collapse, placing decoherence theory on a firm theoretical footing consistent with standard unitary quantum mechanics. Furthermore, we quantify the decoherence timescale for mesoscopic systems and discuss implications for quantum computing architectures where maintaining coherence is essential for computation.",
    abstractPt:
      "Apresentamos uma análise abrangente da decoerência quântica como o mecanismo subjacente à transição de superposições quânticas para a definição clássica em sistemas macroscópicos. Através da interação com graus de liberdade ambientais, as coerências quânticas são suprimidas em escalas de tempo muito menores do que qualquer medição experimentalmente acessível. Demonstramos que os 'estados ponteiros' preferenciais emergem naturalmente do Hamiltoniano sistema-ambiente e correspondem precisamente aos estados clássicos observados na experiência cotidiana. Nossos resultados fornecem uma base rigorosa para compreender por que a transição quântico-clássica ocorre sem invocar o colapso da função de onda, colocando a teoria da decoerência em uma base teórica sólida, consistente com a mecânica quântica unitária padrão. Além disso, quantificamos a escala de tempo de decoerência para sistemas mesoscópicos e discutimos implicações para arquiteturas de computação quântica.",
  },
  {
    id: "art2",
    title: "Efficient Attention Mechanisms for Long-Sequence Transformers: A Comparative Study",
    titlePt: "Mecanismos de Atenção Eficientes para Transformers de Sequências Longas: Um Estudo Comparativo",
    authors: ["A. Katharopoulos", "A. Vyas", "N. Pappas", "F. Fleuret"],
    year: 2022,
    source: "Semantic Scholar",
    readTime: 10,
    abstractOnly: false,
    abstract:
      "Standard self-attention mechanisms in transformer models exhibit quadratic complexity with respect to sequence length, limiting their applicability to long documents and genomic sequences. In this paper, we conduct a systematic comparison of seven efficient attention variants — including Longformer, BigBird, Performer, and Linformer — across twelve benchmarks spanning natural language understanding, code generation, and scientific document classification. We introduce a novel evaluation framework that measures not only accuracy but also memory footprint, wall-clock training time, and scalability to sequences of 32,768 tokens. Our analysis reveals that sparse attention patterns offer the best accuracy-efficiency trade-off for most NLP tasks, while linear approximations excel in streaming scenarios requiring fixed memory consumption.",
    abstractPt:
      "Os mecanismos de autoatenção padrão em modelos transformadores exibem complexidade quadrática em relação ao comprimento da sequência, limitando sua aplicabilidade a documentos longos e sequências genômicas. Neste artigo, conduzimos uma comparação sistemática de sete variantes eficientes de atenção — incluindo Longformer, BigBird, Performer e Linformer — em doze benchmarks abrangendo compreensão de linguagem natural, geração de código e classificação de documentos científicos. Nossa análise revela que padrões de atenção esparsa oferecem o melhor equilíbrio entre precisão e eficiência para a maioria das tarefas de PLN, enquanto aproximações lineares se destacam em cenários de streaming que exigem consumo de memória fixo.",
    content: [
      "The quadratic bottleneck of self-attention has been one of the most active areas of research in the transformer literature since the seminal 'Attention is All You Need' paper in 2017. While the original O(n²) complexity is manageable for sentence-level tasks with sequences under 512 tokens, the demand for models capable of processing entire documents, codebases, or genomic strings has made scalability a first-class concern.",
      "Among the approaches we evaluate, sparse attention methods like Longformer and BigBird selectively attend to a combination of local windows and global tokens, reducing complexity to O(n·w) where w is the window size. These methods preserve the expressiveness of full attention for most practical inputs while dramatically reducing memory requirements. BigBird's random attention component additionally provides theoretical guarantees of universal approximation.",
      "Linear attention mechanisms reformulate the attention operation by approximating the softmax kernel with feature maps, achieving O(n) complexity at the cost of introducing approximation error. Our experiments show this error is particularly pronounced on tasks requiring precise long-range dependency modeling, such as cross-document question answering, where the model must track specific entities across thousands of tokens.",
      "We conclude that no single efficient attention variant dominates across all settings. Practitioners should select based on sequence length distribution, memory constraints, and task structure. For sequences under 4,096 tokens, full attention remains competitive. For longer inputs, Longformer's sliding window approach provides a favorable default, while streaming applications should consider linear variants for their constant memory footprint.",
    ],
    contentPt: [
      "O gargalo quadrático da autoatenção tem sido uma das áreas mais ativas de pesquisa na literatura de transformers desde o artigo seminal de 2017. Embora a complexidade O(n²) original seja gerenciável para tarefas em nível de sentença com sequências abaixo de 512 tokens, a demanda por modelos capazes de processar documentos inteiros tornou a escalabilidade uma preocupação prioritária.",
      "Entre as abordagens avaliadas, métodos de atenção esparsa como Longformer e BigBird atendem seletivamente a uma combinação de janelas locais e tokens globais, reduzindo a complexidade para O(n·w) onde w é o tamanho da janela. Esses métodos preservam a expressividade da atenção completa enquanto reduzem drasticamente os requisitos de memória.",
      "Mecanismos de atenção linear reformulam a operação de atenção aproximando o kernel softmax com mapas de características, alcançando complexidade O(n) ao custo de introduzir erro de aproximação. Nossos experimentos mostram que esse erro é particularmente pronunciado em tarefas que exigem modelagem precisa de dependências de longo alcance.",
      "Concluímos que nenhuma variante única de atenção eficiente domina em todos os contextos. Os profissionais devem selecionar com base na distribuição do comprimento da sequência, restrições de memória e estrutura da tarefa. Para sequências abaixo de 4.096 tokens, a atenção completa permanece competitiva.",
    ],
  },
  {
    id: "art3",
    title: "Persistent Homology Methods for Feature Extraction in High-Dimensional Neural Activation Spaces",
    titlePt:
      "Métodos de Homologia Persistente para Extração de Características em Espaços de Ativação Neurais de Alta Dimensão",
    authors: ["G. Carlsson", "V. de Silva", "L. Guibas"],
    year: 2023,
    source: "CORE",
    readTime: 8,
    abstractOnly: true,
    abstract:
      "We investigate the application of persistent homology — a central tool in Topological Data Analysis (TDA) — to the analysis of high-dimensional activation spaces in deep neural networks. By constructing Vietoris-Rips filtrations over minibatch activation vectors, we compute persistence diagrams that capture the multiscale topological structure of learned representations. We demonstrate empirically that these topological signatures correlate with generalization performance and can serve as diagnostic tools for detecting overfitting, training instability, and adversarial vulnerability. Our method provides a mathematically principled, geometry-aware alternative to purely statistical approaches. We validate our approach on CIFAR-10, ImageNet, and several graph classification benchmarks, consistently outperforming previous TDA-based neural network analysis methods in interpretability and computational efficiency.",
    abstractPt:
      "Investigamos a aplicação da homologia persistente — uma ferramenta central na Análise de Dados Topológicos (TDA) — à análise de espaços de ativação de alta dimensionalidade em redes neurais profundas. Ao construir filtrações de Vietoris-Rips sobre vetores de ativação de minilotes, computamos diagramas de persistência que capturam a estrutura topológica multiescala das representações aprendidas. Demonstramos empiricamente que essas assinaturas topológicas se correlacionam com o desempenho de generalização e podem servir como ferramentas de diagnóstico para detectar sobreajuste, instabilidade de treinamento e vulnerabilidade adversarial. Nosso método fornece uma alternativa matematicamente fundamentada e consciente da geometria para abordagens puramente estatísticas.",
  },
  {
    id: "art4",
    title: "Computational Stylometry and Authorship Attribution in Brazilian Portuguese: A Corpus-Based Approach",
    titlePt:
      "Estilometria Computacional e Atribuição de Autoria em Português Brasileiro: Uma Abordagem Baseada em Corpus",
    authors: ["C. R. Souza", "R. L. Mendes", "L. F. Carvalho"],
    year: 2022,
    source: "Semantic Scholar",
    readTime: 9,
    abstractOnly: false,
    abstract:
      "We present a computational methodology for stylometric analysis and authorship attribution in Brazilian Portuguese, addressing the particular challenges posed by the morphological richness and syntactic flexibility of the language. Our approach combines character n-gram features, syntactic dependency profiles, and semantic embeddings trained on a 2.3-billion-word corpus of contemporary Brazilian text. Evaluated on a gold-standard dataset of 120 authors spanning journalism, fiction, and academic writing, our method achieves 94.2% accuracy at identifying the correct author from a closed set of 50 candidates — a 7-point improvement over previous state-of-the-art methods. We further demonstrate the method's utility for literary scholarship by applying it to disputed authorship cases from the Brazilian Modernist period.",
    abstractPt:
      "Apresentamos uma metodologia computacional para análise estilométrica e atribuição de autoria em português brasileiro, abordando os desafios particulares impostos pela riqueza morfológica e flexibilidade sintática do idioma. Nossa abordagem combina características de n-gramas de caracteres, perfis de dependência sintática e embeddings semânticos treinados em um corpus de 2,3 bilhões de palavras de texto brasileiro contemporâneo. Avaliado em um conjunto de dados padrão-ouro de 120 autores abrangendo jornalismo, ficção e escrita acadêmica, nosso método alcança 94,2% de precisão na identificação do autor correto — uma melhoria de 7 pontos em relação aos métodos anteriores do estado da arte.",
    content: [
      "Stylometry — the quantitative analysis of writing style — has a long history in literary scholarship, dating back to Mendenhall's 1887 study of Shakespeare's vocabulary. What has changed dramatically in recent decades is the availability of large digital text corpora and the computational power to extract and analyze thousands of stylistic features simultaneously. The application of these methods to Portuguese presents particular opportunities: the language's rich morphological system creates a larger stylistic feature space than analytic languages like English.",
      "Our training corpus was assembled from five primary sources: Folha de São Paulo (1990–2022), Estadão digital archive, Projeto Gutenberg Brasil, CAPES thesis repository, and a curated dataset of social media posts with verified authorship. Preprocessing included diacritical normalization, tokenization adapted for Brazilian informal writing conventions, and stratified sampling to balance genre and decade representation.",
      "The feature extraction pipeline operates at three levels. At the lexical level, we extract character n-grams (n = 2–5), function word frequency distributions, and vocabulary richness metrics including type-token ratio and hapax legomena density. At the syntactic level, we parse each document and extract 47 structural features encoding sentence complexity, subordination patterns, and punctuation habits. At the semantic level, we use sentence embeddings from a Portuguese RoBERTa model fine-tuned on Brazilian web text.",
      "The most discriminating features for Brazilian authorship attribution, measured by mutual information with author identity, are punctuation-to-sentence-length ratios, frequency of diminutive suffix usage — a culturally specific feature of Brazilian informal writing — and the distribution of verb moods, particularly the subjunctive, whose use varies substantially across registers and individual authors. These findings align with expert literary critics' intuitions while grounding them in quantitative evidence.",
    ],
    contentPt: [
      "A estilometria — a análise quantitativa do estilo de escrita — tem uma longa história na academia literária, remontando ao estudo de Mendenhall sobre o vocabulário de Shakespeare em 1887. O que mudou dramaticamente nas últimas décadas é a disponibilidade de grandes corpora de texto digital e o poder computacional para extrair e analisar milhares de características estilísticas simultaneamente.",
      "Nosso corpus de treinamento foi montado a partir de cinco fontes principais: Folha de São Paulo (1990–2022), arquivo digital do Estadão, Projeto Gutenberg Brasil, repositório de teses da CAPES e um conjunto curado de posts de redes sociais com autoria verificada. O pré-processamento incluiu normalização diacrítica e tokenização adaptada para convenções de escrita informais brasileiras.",
      "O pipeline de extração de características opera em três níveis: no nível lexical, extraímos n-gramas de caracteres e distribuições de frequência de palavras funcionais; no nível sintático, extraímos 47 características estruturais que codificam complexidade de sentença e padrões de subordinação; no nível semântico, usamos embeddings de sentença de um modelo RoBERTa em português.",
      "As características mais discriminantes para atribuição de autoria em português brasileiro são proporções de pontuação por comprimento de sentença, frequência de uso do sufixo diminutivo e a distribuição de modos verbais — particularmente o subjuntivo, cujo uso varia substancialmente entre registros e autores individuais.",
    ],
  },
];
