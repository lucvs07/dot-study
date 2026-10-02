import type { Accessory, Subject, StudySession } from "@/services/contracts";
import { BRAND } from "@/domain/brand";
import type { CommentRecord, DbState, PostRecord, UserRecord } from "./db";

const THEMES: Record<number, string[]> = {
  1: [
    "Álgebra Linear",
    "Cálculo Diferencial",
    "Geometria Analítica",
    "Probabilidade",
    "Matrizes e Determinantes",
    "Funções de Múltiplas Variáveis",
  ],
  2: ["Mecânica Clássica", "Eletromagnetismo", "Termodinâmica", "Óptica", "Física Quântica", "Relatividade Especial"],
  3: [
    "Brasil Colônia",
    "Segunda Guerra Mundial",
    "Revolução Industrial",
    "Idade Média",
    "Revolução Francesa",
    "Primeira República Brasileira",
  ],
  4: [
    "Análise Sintática",
    "Literatura Brasileira",
    "Redação Dissertativa",
    "Figuras de Linguagem",
    "Modernismo",
    "Concordância Verbal e Nominal",
  ],
  5: [
    "Algoritmos",
    "Desenvolvimento Web",
    "Banco de Dados",
    "Machine Learning",
    "Estruturas de Dados",
    "Sistemas Operacionais",
  ],
};

const SUBJECT_BASE = [
  { id: 1, name: "Matemática", icon: "sigma", color: BRAND.teal },
  { id: 2, name: "Física", icon: "atom", color: BRAND.yellow },
  { id: 3, name: "História", icon: "hourglass", color: BRAND.red },
  { id: 4, name: "Português", icon: "pen-tool", color: BRAND.purple },
  { id: 5, name: "Programação", icon: "code", color: BRAND.green },
] as const;

export const SUBJECTS: Subject[] = SUBJECT_BASE.map((s) => ({
  ...s,
  themes: THEMES[s.id].map((title, i) => ({ id: s.id * 100 + i + 1, title, subjectId: s.id })),
}));

export const ACCESSORIES: Accessory[] = [
  { id: "hat", name: "Chapéu de Formatura", cost: 500 },
  { id: "glasses", name: "Óculos Nerd", cost: 300 },
  { id: "crown", name: "Coroa Dourada", cost: 1200 },
  { id: "halo", name: "Auréola", cost: 800 },
  { id: "bow", name: "Laço Rosa", cost: 250 },
  { id: "horns", name: "Chifres", cost: 450 },
  { id: "bowler", name: "Chapéu Coco", cost: 600 },
  { id: "witch", name: "Chapéu de Bruxa", cost: 750 },
  { id: "party", name: "Chapéu de Festa", cost: 400 },
  { id: "shades", name: "Óculos Escuros", cost: 350 },
];

export const DEMO_USER = { email: "demo@dotstudy.app", password: "dotstudy123", name: "Guilherme" } as const;

/** Hash SHA-256 (hex) — é mock, mas a senha não fica em texto puro no navegador. */
export async function hashPassword(email: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(`dotstudy:${email.trim().toLowerCase()}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Hash pré-calculado de DEMO_USER (hashPassword("demo@dotstudy.app", "dotstudy123")).
// O teste de auth (Task 5) confere que este valor bate com hashPassword.
export const DEMO_PASSWORD_HASH = "999ce4586f06f6f721ebca3eee099d952587ff21b8ea1415f2d8f03895963b77";

const COMMUNITY: { id: string; name: string; dotColor: string; accessory: string | null }[] = [
  { id: "u_ana", name: "Ana Clara M.", dotColor: BRAND.purple, accessory: "hat" },
  { id: "u_pedro", name: "Pedro Lima", dotColor: BRAND.teal, accessory: "glasses" },
  { id: "u_beatriz", name: "Beatriz Santos", dotColor: BRAND.yellow, accessory: null },
  { id: "u_lucasf", name: "Lucas Ferreira", dotColor: BRAND.green, accessory: "crown" },
  { id: "u_rafaelc", name: "Rafael Costa", dotColor: BRAND.teal, accessory: "crown" },
  { id: "u_carla", name: "Carla Nunes", dotColor: BRAND.green, accessory: "glasses" },
  { id: "u_marina", name: "Marina Reis", dotColor: BRAND.yellow, accessory: "glasses" },
  { id: "u_camila", name: "Camila Duarte", dotColor: BRAND.purple, accessory: "bow" },
];

// Ciclos históricos por assunto → pontuação = ciclos × 10 (+ 30 por post). Valores baixos para
// que uma conta nova consiga subir no ranking durante a demo.
const COMMUNITY_CYCLES: Record<string, Partial<Record<number, number>>> = {
  u_ana: { 1: 48, 5: 20 },
  u_pedro: { 3: 30, 5: 60 },
  u_beatriz: { 3: 36 },
  u_lucasf: { 2: 51, 5: 55 },
  u_rafaelc: { 1: 42, 4: 33 },
  u_carla: { 1: 36 },
  u_marina: { 2: 43 },
  u_camila: { 4: 41 },
};

export function buildSeed(now: number = Date.now()): DbState {
  const iso = (msAgo: number) => new Date(now - msAgo).toISOString();
  const H = 3_600_000;
  const D = 24 * H;
  const demoId = "u_demo";

  const users: UserRecord[] = [
    {
      id: demoId,
      name: DEMO_USER.name,
      email: DEMO_USER.email,
      passwordHash: DEMO_PASSWORD_HASH,
      coins: 840,
      dotColor: BRAND.teal,
      activeAccessoryId: null,
      unlockedAccessoryIds: ["hat", "glasses"],
      createdAt: iso(30 * D),
    },
    ...COMMUNITY.map((c) => ({
      id: c.id,
      name: c.name,
      email: `${c.id.slice(2)}@exemplo.dotstudy.app`,
      passwordHash: "seed-sem-login",
      coins: 0,
      dotColor: c.dotColor,
      activeAccessoryId: c.accessory,
      unlockedAccessoryIds: c.accessory ? [c.accessory] : [],
      createdAt: iso(60 * D),
    })),
  ];

  const session = (
    id: string,
    userId: string,
    subjectId: number | null,
    themeTitle: string | null,
    focus: number,
    cycles: number,
    msAgo: number,
  ): StudySession => {
    const theme = subjectId ? (SUBJECTS[subjectId - 1].themes.find((t) => t.title === themeTitle) ?? null) : null;
    return {
      id,
      userId,
      mode: subjectId ? "challenge" : "free",
      subjectId,
      themeId: theme?.id ?? null,
      label: subjectId ? null : themeTitle,
      focusMinutes: focus,
      breakMinutes: subjectId ? 0 : 5,
      plannedCycles: cycles,
      completedCycles: cycles,
      notes: "",
      status: "completed",
      startedAt: iso(msAgo + focus * cycles * 60_000),
      lastCycleAt: iso(msAgo),
      finishedAt: iso(msAgo),
      rewardedPostId: null,
    };
  };

  const sessions: StudySession[] = [
    session("h1", demoId, 1, "Cálculo Diferencial", 25, 1, 1 * H),
    session("h2", demoId, 5, "Algoritmos", 25, 1, 3 * H),
    session("h3", demoId, null, "Revisão geral", 50, 1, 5 * H),
    session("h4", demoId, 2, "Eletromagnetismo", 25, 1, 1 * D),
    session("h5", demoId, 1, "Álgebra Linear", 30, 1, 1 * D + H),
    session("h6", demoId, 4, "Literatura Brasileira", 25, 1, 1 * D + 2 * H),
    session("h7", demoId, 5, "Desenvolvimento Web", 45, 1, 2 * D),
    session("h8", demoId, 3, "Revolução Industrial", 25, 1, 2 * D + H),
    session("h9", demoId, 2, "Mecânica Clássica", 25, 1, 3 * D),
    session("h10", demoId, null, null, 25, 1, 3 * D + H),
    session("h11", demoId, 1, "Probabilidade", 25, 1, 4 * D),
    session("h12", demoId, 5, "Machine Learning", 50, 1, 5 * D),
  ];
  for (const [userId, bySubject] of Object.entries(COMMUNITY_CYCLES)) {
    for (const [subjectId, cycles] of Object.entries(bySubject)) {
      const sid = Number(subjectId);
      sessions.push(
        session(`seed_${userId}_${sid}`, userId, sid, SUBJECTS[sid - 1].themes[0].title, 25, cycles!, 7 * D),
      );
    }
  }

  const post = (
    p: Omit<PostRecord, "mediaUrl" | "mediaDurationSec" | "sessionId"> & { mediaDurationSec?: number },
  ): PostRecord => ({
    sessionId: null,
    mediaUrl: null,
    mediaDurationSec: p.mediaDurationSec ?? null,
    ...p,
  });
  const posts: PostRecord[] = [
    post({
      id: "p1",
      authorId: "u_ana",
      subjectId: 1,
      type: "text",
      title: "Como eu finalmente entendi Integrais",
      content:
        "Depois de 3 semanas lutando com cálculo, encontrei uma abordagem visual que mudou tudo. O segredo estava em pensar geometricamente antes de algebricamente...",
      createdAt: iso(2 * H),
      seedLikeCount: 47,
    }),
    post({
      id: "p2",
      authorId: "u_pedro",
      subjectId: 5,
      type: "text",
      title: "Por que aprendi algoritmos antes de frameworks",
      content:
        "Muita gente pula direto para React ou Django. Mas estudar algoritmos primeiro transformou minha forma de resolver problemas de verdade...",
      createdAt: iso(5 * H),
      seedLikeCount: 88,
    }),
    post({
      id: "p3",
      authorId: "u_beatriz",
      subjectId: 3,
      type: "audio",
      title: "A Revolução Industrial e o que ela ainda nos ensina",
      content: "Reflexões sobre os padrões que se repetem na era digital",
      createdAt: iso(1 * D),
      seedLikeCount: 34,
      mediaDurationSec: 134,
    }),
    post({
      id: "p4",
      authorId: "u_lucasf",
      subjectId: 2,
      type: "video",
      title: "Eletromagnetismo desmistificado",
      content: "Explicando campos e forças de forma visual e intuitiva",
      createdAt: iso(2 * D),
      seedLikeCount: 61,
      mediaDurationSec: 68,
    }),
  ];

  // Transcrição de INITIAL_COMMENTS do protótipo, no post p1 (o 1º comentário, que no protótipo era da
  // própria autora do post, passa para Carla Nunes).
  const comments: CommentRecord[] = [
    {
      id: "c1",
      postId: "p1",
      authorId: "u_carla",
      parentId: null,
      createdAt: iso(1 * H),
      content:
        "Adorei a abordagem visual! Eu sempre tive dificuldade com esse conceito e agora ficou muito mais claro.",
    },
    {
      id: "c11",
      postId: "p1",
      authorId: "u_pedro",
      parentId: "c1",
      createdAt: iso(45 * 60_000),
      content: "Concordo! Pensar geometricamente antes de algebricamente faz toda a diferença.",
    },
    {
      id: "c2",
      postId: "p1",
      authorId: "u_lucasf",
      parentId: null,
      createdAt: iso(2 * H),
      content: "Excelente conteúdo. Você conseguiu resumir em poucas palavras o que levei semanas para entender.",
    },
    {
      id: "c21",
      postId: "p1",
      authorId: "u_beatriz",
      parentId: "c2",
      createdAt: iso(90 * 60_000),
      content: "Sério! Esse post merecia mais curtidas.",
    },
  ];

  return {
    version: 1,
    currentUserId: null,
    users,
    sessions,
    posts,
    comments,
    likes: [
      { userId: demoId, postId: "p2" },
      { userId: demoId, postId: "p4" },
    ],
    saves: [{ userId: demoId, postId: "p2" }],
    transactions: [],
  };
}
