import { describe, expect, it } from "vitest";
import { MockDb, STORAGE_KEY } from "./db";
import { createMemoryStorage } from "./storage";
import { ACCESSORIES, SUBJECTS, buildSeed } from "./seed";

describe("MockDb", () => {
  it("cria o banco a partir do seed quando está vazio e persiste", () => {
    const storage = createMemoryStorage();
    const db = new MockDb(storage);
    const state = db.read();
    expect(state.version).toBe(1);
    expect(state.users.some((u) => u.email === "demo@dotstudy.app")).toBe(true);
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!).version).toBe(1);
  });

  it("recria o seed quando o JSON está corrompido", () => {
    const storage = createMemoryStorage();
    storage.setItem(STORAGE_KEY, "{not json");
    expect(new MockDb(storage).read().users.length).toBeGreaterThan(0);
  });

  it("recria o seed quando a versão é diferente ou falta campo", () => {
    const storage = createMemoryStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 99, users: [] }));
    expect(new MockDb(storage).read().version).toBe(1);
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, users: [] }));
    expect(new MockDb(storage).read().posts.length).toBeGreaterThan(0);
  });

  it("write aplica a mudança e salva; reset volta ao seed", () => {
    const storage = createMemoryStorage();
    const db = new MockDb(storage);
    db.write((s) => {
      s.currentUserId = "x";
    });
    expect(new MockDb(storage).read().currentUserId).toBe("x");
    db.reset();
    expect(db.read().currentUserId).toBeNull();
  });

  it("read devolve cópia (mutar não altera o banco)", () => {
    const db = new MockDb(createMemoryStorage());
    db.read().users.length = 0;
    expect(db.read().users.length).toBeGreaterThan(0);
  });
});

describe("seed", () => {
  it("tem os 5 assuntos com 6 temas e os 10 acessórios do protótipo", () => {
    expect(SUBJECTS.map((s) => s.name)).toEqual(["Matemática", "Física", "História", "Português", "Programação"]);
    expect(SUBJECTS.every((s) => s.themes.length === 6)).toBe(true);
    expect(ACCESSORIES).toHaveLength(10);
  });
  it("usuário demo começa com 840 moedas e chapéu + óculos", () => {
    const demo = buildSeed().users.find((u) => u.email === "demo@dotstudy.app")!;
    expect(demo.coins).toBe(840);
    expect(demo.unlockedAccessoryIds).toEqual(["hat", "glasses"]);
  });
  it("gera ranking em todos os assuntos", () => {
    const seed = buildSeed();
    for (const subject of SUBJECTS) {
      expect(seed.sessions.some((s) => s.subjectId === subject.id && s.completedCycles > 0)).toBe(true);
    }
  });
});
