import { BRAND } from "./brand";

export interface DifficultyPreset {
  id: "demo" | "easy" | "medium" | "hard";
  label: string;
  minutes: number;
  description: string;
  color: string;
}

const BASE: DifficultyPreset[] = [
  { id: "easy", label: "Fácil", minutes: 15, description: "Tema introdutório", color: BRAND.green },
  { id: "medium", label: "Médio", minutes: 25, description: "Tema intermediário", color: BRAND.yellow },
  { id: "hard", label: "Difícil", minutes: 40, description: "Tema avançado", color: BRAND.red },
];

const DEMO: DifficultyPreset = {
  id: "demo",
  label: "Demo",
  minutes: 1,
  description: "Sessão rápida para apresentação",
  color: BRAND.purple,
};

export function getDifficultyPresets(
  demoMode: boolean = import.meta.env.VITE_DEMO_MODE === "true",
): DifficultyPreset[] {
  return demoMode ? [DEMO, ...BASE] : BASE;
}

export type DifficultyId = DifficultyPreset["id"];
