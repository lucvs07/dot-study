import { describe, expect, it } from "vitest";
import type { Author, StudySession } from "./contracts";
import {
  COINS,
  POINTS,
  calculateStreak,
  canCompleteCycle,
  computeSubjectScores,
  offsetDayKey,
  rankEntries,
  sessionMinutes,
} from "./rules";

const base: StudySession = {
  id: "s1",
  userId: "u1",
  mode: "challenge",
  subjectId: 1,
  themeId: 1,
  label: null,
  focusMinutes: 25,
  breakMinutes: 0,
  plannedCycles: 1,
  completedCycles: 0,
  notes: "",
  status: "in_progress",
  startedAt: "2026-09-29T10:00:00.000Z",
  lastCycleAt: null,
  finishedAt: null,
  rewardedPostId: null,
};
const at = (iso: string) => new Date(iso).getTime();

describe("valores de pontuação", () => {
  it("segue a spec", () => {
    expect(COINS).toEqual({ welcome: 250, cycle: 10, post: 30 });
    expect(POINTS).toEqual({ cycle: 10, post: 30 });
  });
});

describe("canCompleteCycle", () => {
  it("recusa antes de 90% do tempo de foco", () => {
    expect(canCompleteCycle(base, at("2026-09-29T10:22:29.000Z"))).toEqual({ ok: false, reason: "CYCLE_TOO_SOON" });
  });
  it("aceita com 90% do tempo de foco", () => {
    expect(canCompleteCycle(base, at("2026-09-29T10:22:30.000Z"))).toEqual({ ok: true });
  });
  it("mede a partir do último ciclo concluído", () => {
    const s = { ...base, plannedCycles: 2, completedCycles: 1, lastCycleAt: "2026-09-29T10:30:00.000Z" };
    expect(canCompleteCycle(s, at("2026-09-29T10:40:00.000Z"))).toEqual({ ok: false, reason: "CYCLE_TOO_SOON" });
    expect(canCompleteCycle(s, at("2026-09-29T10:52:30.000Z"))).toEqual({ ok: true });
  });
  it("recusa sessão encerrada ou com todos os ciclos feitos", () => {
    expect(canCompleteCycle({ ...base, status: "abandoned" }, at("2026-09-29T12:00:00.000Z"))).toEqual({
      ok: false,
      reason: "SESSION_CLOSED",
    });
    expect(canCompleteCycle({ ...base, completedCycles: 1 }, at("2026-09-29T12:00:00.000Z"))).toEqual({
      ok: false,
      reason: "SESSION_CLOSED",
    });
  });
});

describe("sessionMinutes", () => {
  it("é ciclos concluídos × minutos de foco", () => {
    expect(sessionMinutes({ ...base, completedCycles: 3, focusMinutes: 25 })).toBe(75);
  });
});

describe("calculateStreak", () => {
  const now = new Date(2026, 8, 29, 15, 0, 0).getTime(); // 29/09 local
  const day = (d: number, h = 10) => new Date(2026, 8, d, h).toISOString();
  it("conta dias consecutivos terminando hoje", () => {
    expect(calculateStreak([day(29), day(28), day(28, 20), day(27), day(25)], now)).toBe(3);
  });
  it("é zero se não estudou hoje", () => {
    expect(calculateStreak([day(28), day(27)], now)).toBe(0);
  });
});

describe("dias no fuso do usuário", () => {
  it("offsetDayKey usa a convenção do getTimezoneOffset (Brasil = 180)", () => {
    const d = new Date("2026-09-30T01:00:00.000Z"); // 22h de 29/09 em São Paulo
    expect(offsetDayKey(d, 180)).toBe("2026-09-29");
    expect(offsetDayKey(d, 0)).toBe("2026-09-30");
  });
  it("calculateStreak aceita a função de dia", () => {
    const now = Date.parse("2026-09-30T02:00:00.000Z"); // 23h de 29/09 em SP
    const dates = ["2026-09-30T01:00:00.000Z", "2026-09-28T23:00:00.000Z"]; // 29/09 22h e 28/09 20h em SP
    expect(calculateStreak(dates, now, (d) => offsetDayKey(d, 180))).toBe(2);
    expect(calculateStreak(dates, now, (d) => offsetDayKey(d, 0))).toBe(1);
  });
});

describe("ranking", () => {
  const ana: Author = { id: "u2", name: "Ana", dotColor: "#000", activeAccessoryId: null };
  const eu: Author = { id: "u1", name: "Eu", dotColor: "#111", activeAccessoryId: null };
  it("soma 10 por ciclo e 30 por post no assunto", () => {
    const scores = computeSubjectScores(
      1,
      [
        { ...base, userId: "u1", completedCycles: 1 },
        { ...base, id: "s2", userId: "u2", completedCycles: 4 },
        { ...base, id: "s3", userId: "u2", subjectId: 2, completedCycles: 9 },
      ],
      [
        { id: "p1", authorId: "u1", subjectId: 1, sessionId: null },
        { id: "p2", authorId: "u1", subjectId: 1, sessionId: null },
        { id: "p3", authorId: "u2", subjectId: 2, sessionId: null },
      ],
    );
    expect(scores.get("u1")).toBe(70);
    expect(scores.get("u2")).toBe(40);
  });
  it("post de sessão só pontua se for o recompensado; post sem sessão (seed) pontua", () => {
    const scores = computeSubjectScores(
      1,
      [
        { ...base, id: "s1", userId: "u1", completedCycles: 1, rewardedPostId: "p1" },
        { ...base, id: "s2", userId: "u2", completedCycles: 0, rewardedPostId: null },
      ],
      [
        { id: "p1", authorId: "u1", subjectId: 1, sessionId: "s1" },
        { id: "p2", authorId: "u1", subjectId: 1, sessionId: "s1" },
        { id: "p3", authorId: "u1", subjectId: 1, sessionId: "s1" },
        { id: "p4", authorId: "u2", subjectId: 1, sessionId: "s2" },
        { id: "p5", authorId: "u2", subjectId: 1, sessionId: null },
      ],
    );
    expect(scores.get("u1")).toBe(10 + 30);
    expect(scores.get("u2")).toBe(30);
  });
  it("ordena por pontuação, marca o usuário atual e ignora zero", () => {
    const entries = rankEntries(
      new Map([
        ["u1", 70],
        ["u2", 40],
        ["u3", 0],
      ]),
      new Map([
        ["u1", eu],
        ["u2", ana],
      ]),
      "u1",
    );
    expect(entries).toEqual([
      { position: 1, user: eu, score: 70, isMe: true },
      { position: 2, user: ana, score: 40, isMe: false },
    ]);
  });
});
