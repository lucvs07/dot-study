import type { Accessory, Subject } from "./contracts";

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
  { id: 1, name: "Matemática", icon: "sigma", color: "#22CFD5" },
  { id: 2, name: "Física", icon: "atom", color: "#FFC23D" },
  { id: 3, name: "História", icon: "hourglass", color: "#EE1B3F" },
  { id: 4, name: "Português", icon: "pen-tool", color: "#A35BBF" },
  { id: 5, name: "Programação", icon: "code", color: "#2CCD2C" },
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
