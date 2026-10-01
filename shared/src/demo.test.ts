import { describe, expect, it } from "vitest";
import { ACCESSORIES, SUBJECTS } from "./catalog";
import { DEMO_DATASET } from "./demo";

describe("DEMO_DATASET", () => {
  it("tem 12 sessões do demo e sessões da comunidade em todos os assuntos", () => {
    expect(DEMO_DATASET.sessions.filter((s) => s.userId === "u_demo")).toHaveLength(12);
    for (const subject of SUBJECTS) {
      expect(DEMO_DATASET.sessions.some((s) => s.userId !== "u_demo" && s.subjectId === subject.id)).toBe(true);
    }
  });
  it("referencia só temas, assuntos, usuários, posts e acessórios que existem", () => {
    const users = new Set(["u_demo", ...DEMO_DATASET.community.map((c) => c.id)]);
    for (const s of DEMO_DATASET.sessions) {
      expect(users.has(s.userId)).toBe(true);
      if (s.subjectId !== null && s.themeTitle !== null) {
        expect(SUBJECTS[s.subjectId - 1].themes.some((t) => t.title === s.themeTitle)).toBe(true);
      }
    }
    const postIds = new Set(DEMO_DATASET.posts.map((p) => p.id));
    for (const c of DEMO_DATASET.comments) expect(postIds.has(c.postId)).toBe(true);
    for (const a of DEMO_DATASET.demoUser.unlockedAccessoryIds) expect(ACCESSORIES.some((x) => x.id === a)).toBe(true);
  });
});
