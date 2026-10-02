import { computeSubjectScores } from "@dot-study/shared/rules";
import type { StudySession } from "@dot-study/shared/contracts";
import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it } from "vitest";
import { seedDemo } from "../src/seed/demo";
import { getTestPrisma, resetDb } from "./helpers";

const NOW = new Date("2026-09-29T12:00:00.000Z");

describe("seed", () => {
  beforeEach(resetDb);

  it("catálogo tem 5 assuntos, 30 temas e 10 acessórios", async () => {
    const prisma = getTestPrisma();
    expect(await prisma.subject.count()).toBe(5);
    expect(await prisma.theme.count()).toBe(30);
    expect(await prisma.accessory.count()).toBe(10);
  });

  it("cria o usuário demo igual ao mock", async () => {
    const prisma = getTestPrisma();
    expect(await seedDemo(prisma, NOW)).toEqual({ created: true });
    const demo = await prisma.user.findUniqueOrThrow({
      where: { email: "demo@dotstudy.app" },
      include: { accessories: true },
    });
    expect(demo).toMatchObject({ id: "u_demo", name: "Guilherme", coins: 840 });
    expect(demo.accessories.map((a) => a.accessoryId).sort()).toEqual(["glasses", "hat"]);
    expect(await bcrypt.compare("dotstudy123", demo.passwordHash)).toBe(true);
    expect(await prisma.post.count()).toBe(4);
    expect(await prisma.comment.count()).toBe(4);
    expect(await prisma.studySession.count({ where: { userId: "u_demo" } })).toBe(12);
  });

  it("ranking de Matemática bate com o do mock (Ana 510, Rafael 420, Carla 360, demo 30)", async () => {
    const prisma = getTestPrisma();
    await seedDemo(prisma, NOW);
    const sessions = await prisma.studySession.findMany();
    const posts = await prisma.post.findMany({
      select: { id: true, authorId: true, subjectId: true, sessionId: true },
    });
    const scores = computeSubjectScores(
      1,
      sessions.map((s) => ({
        ...s,
        startedAt: s.startedAt.toISOString(),
        lastCycleAt: s.lastCycleAt?.toISOString() ?? null,
        finishedAt: s.finishedAt?.toISOString() ?? null,
      })) as StudySession[],
      posts,
    );
    expect(scores.get("u_ana")).toBe(510);
    expect(scores.get("u_rafaelc")).toBe(420);
    expect(scores.get("u_carla")).toBe(360);
    expect(scores.get("u_demo")).toBe(30);
  });

  it("rodar de novo não duplica nada (Compose reiniciando)", async () => {
    const prisma = getTestPrisma();
    await seedDemo(prisma, NOW);
    const before = {
      users: await prisma.user.count(),
      posts: await prisma.post.count(),
      sessions: await prisma.studySession.count(),
    };
    expect(await seedDemo(prisma, new Date(NOW.getTime() + 3_600_000))).toEqual({ created: false });
    expect({
      users: await prisma.user.count(),
      posts: await prisma.post.count(),
      sessions: await prisma.studySession.count(),
    }).toEqual(before);
  });

  it("usuários da comunidade não conseguem logar (senha aleatória)", async () => {
    const prisma = getTestPrisma();
    await seedDemo(prisma, NOW);
    const ana = await prisma.user.findUniqueOrThrow({ where: { id: "u_ana" } });
    expect(await bcrypt.compare("dotstudy123", ana.passwordHash)).toBe(false);
  });
});
