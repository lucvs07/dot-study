import { SUBJECTS } from "./catalog";

export const HOUR = 3_600_000;
export const DAY = 86_400_000;

export interface DemoCommunityUser {
  id: string;
  name: string;
  dotColor: string;
  accessory: string | null;
}

export interface DemoSession {
  id: string;
  userId: string;
  subjectId: number | null;
  themeTitle: string | null;
  focusMinutes: number;
  cycles: number;
  msAgo: number;
}

export interface DemoPost {
  id: string;
  authorId: string;
  subjectId: number;
  type: "text" | "audio" | "video";
  title: string;
  content: string;
  msAgo: number;
  baseLikeCount: number;
  mediaDurationSec: number | null;
}

export interface DemoComment {
  id: string;
  postId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  msAgo: number;
}

export interface DemoDataset {
  demoUserId: "u_demo";
  demoUser: { coins: number; dotColor: string; unlockedAccessoryIds: string[]; createdMsAgo: number };
  community: DemoCommunityUser[];
  communityCreatedMsAgo: number;
  sessions: DemoSession[];
  posts: DemoPost[];
  comments: DemoComment[];
  likes: { userId: string; postId: string }[];
  saves: { userId: string; postId: string }[];
}

const COMMUNITY: DemoCommunityUser[] = [
  { id: "u_ana", name: "Ana Clara M.", dotColor: "#A35BBF", accessory: "hat" },
  { id: "u_pedro", name: "Pedro Lima", dotColor: "#22CFD5", accessory: "glasses" },
  { id: "u_beatriz", name: "Beatriz Santos", dotColor: "#FFC23D", accessory: null },
  { id: "u_lucasf", name: "Lucas Ferreira", dotColor: "#2CCD2C", accessory: "crown" },
  { id: "u_rafaelc", name: "Rafael Costa", dotColor: "#22CFD5", accessory: "crown" },
  { id: "u_carla", name: "Carla Nunes", dotColor: "#2CCD2C", accessory: "glasses" },
  { id: "u_marina", name: "Marina Reis", dotColor: "#FFC23D", accessory: "glasses" },
  { id: "u_camila", name: "Camila Duarte", dotColor: "#A35BBF", accessory: "bow" },
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

const communitySessions: DemoSession[] = [];
for (const [userId, bySubject] of Object.entries(COMMUNITY_CYCLES)) {
  for (const [subjectId, cycles] of Object.entries(bySubject)) {
    const sid = Number(subjectId);
    communitySessions.push({
      id: `seed_${userId}_${sid}`,
      userId,
      subjectId: sid,
      themeTitle: SUBJECTS[sid - 1].themes[0].title,
      focusMinutes: 25,
      cycles: cycles!,
      msAgo: 7 * DAY,
    });
  }
}

const demoSessions: DemoSession[] = [
  {
    id: "h1",
    userId: "u_demo",
    subjectId: 1,
    themeTitle: "Cálculo Diferencial",
    focusMinutes: 25,
    cycles: 1,
    msAgo: 1 * HOUR,
  },
  { id: "h2", userId: "u_demo", subjectId: 5, themeTitle: "Algoritmos", focusMinutes: 25, cycles: 1, msAgo: 3 * HOUR },
  {
    id: "h3",
    userId: "u_demo",
    subjectId: null,
    themeTitle: "Revisão geral",
    focusMinutes: 50,
    cycles: 1,
    msAgo: 5 * HOUR,
  },
  {
    id: "h4",
    userId: "u_demo",
    subjectId: 2,
    themeTitle: "Eletromagnetismo",
    focusMinutes: 25,
    cycles: 1,
    msAgo: 1 * DAY,
  },
  {
    id: "h5",
    userId: "u_demo",
    subjectId: 1,
    themeTitle: "Álgebra Linear",
    focusMinutes: 30,
    cycles: 1,
    msAgo: 1 * DAY + HOUR,
  },
  {
    id: "h6",
    userId: "u_demo",
    subjectId: 4,
    themeTitle: "Literatura Brasileira",
    focusMinutes: 25,
    cycles: 1,
    msAgo: 1 * DAY + 2 * HOUR,
  },
  {
    id: "h7",
    userId: "u_demo",
    subjectId: 5,
    themeTitle: "Desenvolvimento Web",
    focusMinutes: 45,
    cycles: 1,
    msAgo: 2 * DAY,
  },
  {
    id: "h8",
    userId: "u_demo",
    subjectId: 3,
    themeTitle: "Revolução Industrial",
    focusMinutes: 25,
    cycles: 1,
    msAgo: 2 * DAY + HOUR,
  },
  {
    id: "h9",
    userId: "u_demo",
    subjectId: 2,
    themeTitle: "Mecânica Clássica",
    focusMinutes: 25,
    cycles: 1,
    msAgo: 3 * DAY,
  },
  {
    id: "h10",
    userId: "u_demo",
    subjectId: null,
    themeTitle: null,
    focusMinutes: 25,
    cycles: 1,
    msAgo: 3 * DAY + HOUR,
  },
  {
    id: "h11",
    userId: "u_demo",
    subjectId: 1,
    themeTitle: "Probabilidade",
    focusMinutes: 25,
    cycles: 1,
    msAgo: 4 * DAY,
  },
  {
    id: "h12",
    userId: "u_demo",
    subjectId: 5,
    themeTitle: "Machine Learning",
    focusMinutes: 50,
    cycles: 1,
    msAgo: 5 * DAY,
  },
];

const posts: DemoPost[] = [
  {
    id: "p1",
    authorId: "u_ana",
    subjectId: 1,
    type: "text",
    title: "Como eu finalmente entendi Integrais",
    content:
      "Depois de 3 semanas lutando com cálculo, encontrei uma abordagem visual que mudou tudo. O segredo estava em pensar geometricamente antes de algebricamente...",
    msAgo: 2 * HOUR,
    baseLikeCount: 47,
    mediaDurationSec: null,
  },
  {
    id: "p2",
    authorId: "u_pedro",
    subjectId: 5,
    type: "text",
    title: "Por que aprendi algoritmos antes de frameworks",
    content:
      "Muita gente pula direto para React ou Django. Mas estudar algoritmos primeiro transformou minha forma de resolver problemas de verdade...",
    msAgo: 5 * HOUR,
    baseLikeCount: 88,
    mediaDurationSec: null,
  },
  {
    id: "p3",
    authorId: "u_beatriz",
    subjectId: 3,
    type: "audio",
    title: "A Revolução Industrial e o que ela ainda nos ensina",
    content: "Reflexões sobre os padrões que se repetem na era digital",
    msAgo: 1 * DAY,
    baseLikeCount: 34,
    mediaDurationSec: 134,
  },
  {
    id: "p4",
    authorId: "u_lucasf",
    subjectId: 2,
    type: "video",
    title: "Eletromagnetismo desmistificado",
    content: "Explicando campos e forças de forma visual e intuitiva",
    msAgo: 2 * DAY,
    baseLikeCount: 61,
    mediaDurationSec: 68,
  },
];

// Transcrição de INITIAL_COMMENTS do protótipo, no post p1 (o 1º comentário, que no protótipo era da
// própria autora do post, passa para Carla Nunes).
const comments: DemoComment[] = [
  {
    id: "c1",
    postId: "p1",
    authorId: "u_carla",
    parentId: null,
    content: "Adorei a abordagem visual! Eu sempre tive dificuldade com esse conceito e agora ficou muito mais claro.",
    msAgo: 1 * HOUR,
  },
  {
    id: "c11",
    postId: "p1",
    authorId: "u_pedro",
    parentId: "c1",
    content: "Concordo! Pensar geometricamente antes de algebricamente faz toda a diferença.",
    msAgo: 45 * 60_000,
  },
  {
    id: "c2",
    postId: "p1",
    authorId: "u_lucasf",
    parentId: null,
    content: "Excelente conteúdo. Você conseguiu resumir em poucas palavras o que levei semanas para entender.",
    msAgo: 2 * HOUR,
  },
  {
    id: "c21",
    postId: "p1",
    authorId: "u_beatriz",
    parentId: "c2",
    content: "Sério! Esse post merecia mais curtidas.",
    msAgo: 90 * 60_000,
  },
];

export const DEMO_DATASET: DemoDataset = {
  demoUserId: "u_demo",
  demoUser: { coins: 840, dotColor: "#22CFD5", unlockedAccessoryIds: ["hat", "glasses"], createdMsAgo: 30 * DAY },
  community: COMMUNITY,
  communityCreatedMsAgo: 60 * DAY,
  sessions: [...demoSessions, ...communitySessions],
  posts,
  comments,
  likes: [
    { userId: "u_demo", postId: "p2" },
    { userId: "u_demo", postId: "p4" },
  ],
  saves: [{ userId: "u_demo", postId: "p2" }],
};
