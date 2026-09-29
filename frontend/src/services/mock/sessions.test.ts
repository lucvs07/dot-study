import { describe, expect, it } from "vitest";
import { createAuthService } from "./auth";
import { createTestContext, type MockContext } from "./context";
import { createSessionService } from "./sessions";
import { createSubjectService } from "./subjects";
import { DEMO_USER } from "./seed";

async function setup() {
  let now = Date.parse("2026-09-29T12:00:00.000Z");
  const ctx: MockContext = createTestContext({ now: () => now, random: () => 0.99 });
  await createAuthService(ctx).login({ email: DEMO_USER.email, password: DEMO_USER.password });
  return {
    ctx,
    sessions: createSessionService(ctx),
    advance: (ms: number) => {
      now += ms;
    },
  };
}

describe("SubjectService (mock)", () => {
  it("lista 5 assuntos e sorteia tema do assunto", async () => {
    const subjects = createSubjectService(createTestContext({ random: () => 0 }));
    expect(await subjects.list()).toHaveLength(5);
    expect(await subjects.randomTheme(2)).toMatchObject({ subjectId: 2, title: "Mecânica Clássica" });
    await expect(subjects.randomTheme(99)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("SessionService (mock)", () => {
  it("desafio com assunto aleatório sorteia assunto e tema, 1 ciclo sem pausa", async () => {
    const { sessions } = await setup();
    const s = await sessions.start({ mode: "challenge", subjectId: "random", focusMinutes: 25 });
    expect(s).toMatchObject({
      mode: "challenge",
      subjectId: 5,
      plannedCycles: 1,
      breakMinutes: 0,
      status: "in_progress",
    });
    expect(s.themeId).toBe(506);
  });

  it("livre guarda rótulo, pausa e ciclos planejados", async () => {
    const { sessions } = await setup();
    const s = await sessions.start({
      mode: "free",
      label: "Revisão",
      focusMinutes: 30,
      breakMinutes: 5,
      plannedCycles: 3,
    });
    expect(s).toMatchObject({ mode: "free", subjectId: null, label: "Revisão", plannedCycles: 3 });
  });

  it("valida durações (1–120 min) e ciclos (1–12)", async () => {
    const { sessions } = await setup();
    await expect(sessions.start({ mode: "challenge", subjectId: 1, focusMinutes: 0 })).rejects.toMatchObject({
      code: "VALIDATION",
    });
    await expect(
      sessions.start({ mode: "free", label: null, focusMinutes: 25, breakMinutes: 5, plannedCycles: 0 }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("concluir ciclo cedo demais é recusado; no tempo dá +10 moedas", async () => {
    const { ctx, sessions, advance } = await setup();
    const s = await sessions.start({ mode: "challenge", subjectId: 1, focusMinutes: 25 });
    advance(60_000);
    await expect(sessions.completeCycle(s.id)).rejects.toMatchObject({ code: "CYCLE_TOO_SOON" });
    advance(24 * 60_000);
    const { session, reward } = await sessions.completeCycle(s.id);
    expect(reward).toEqual({ coinsEarned: 10, balance: 850 });
    expect(session).toMatchObject({ completedCycles: 1, status: "completed" });
    expect(ctx.db.read().transactions.at(-1)).toMatchObject({ amount: 10, reason: "cycle", refId: s.id });
  });

  it("sessão livre só fecha no último ciclo", async () => {
    const { sessions, advance } = await setup();
    const s = await sessions.start({ mode: "free", label: null, focusMinutes: 10, breakMinutes: 2, plannedCycles: 2 });
    advance(10 * 60_000);
    expect((await sessions.completeCycle(s.id)).session.status).toBe("in_progress");
    advance(12 * 60_000);
    expect((await sessions.completeCycle(s.id)).session.status).toBe("completed");
    await expect(sessions.completeCycle(s.id)).rejects.toMatchObject({ code: "SESSION_CLOSED" });
  });

  it("iniciar nova sessão abandona a anterior em andamento (ex.: recarregou a página)", async () => {
    const { sessions, advance } = await setup();
    const old = await sessions.start({ mode: "challenge", subjectId: 1, focusMinutes: 25 });
    await sessions.start({ mode: "challenge", subjectId: 2, focusMinutes: 25 });
    advance(30 * 60_000);
    await expect(sessions.completeCycle(old.id)).rejects.toMatchObject({ code: "SESSION_CLOSED" });
    expect((await sessions.list()).find((s) => s.id === old.id)?.status).toBe("abandoned");
  });

  it("anotações e finalizar", async () => {
    const { sessions } = await setup();
    const s = await sessions.start({ mode: "challenge", subjectId: 1, focusMinutes: 25 });
    expect((await sessions.updateNotes(s.id, "limites e derivadas")).notes).toBe("limites e derivadas");
    expect((await sessions.finish(s.id, "abandoned")).status).toBe("abandoned");
  });

  it("não mexe em sessão de outro usuário", async () => {
    const { sessions } = await setup();
    await expect(sessions.updateNotes("seed_u_ana_1", "x")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("list devolve só as minhas, mais recentes primeiro", async () => {
    const { sessions } = await setup();
    const list = await sessions.list();
    expect(list.every((s) => s.userId === "u_demo")).toBe(true);
    expect(list[0].id).toBe("h1");
  });
});
