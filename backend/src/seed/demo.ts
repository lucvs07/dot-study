import { randomBytes } from "node:crypto";
import { DEMO_USER, SUBJECTS } from "@dot-study/shared/catalog";
import { DEMO_DATASET } from "@dot-study/shared/demo";
import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function seedDemo(prisma: PrismaClient, now: Date): Promise<{ created: boolean }> {
  const d = DEMO_DATASET;
  if (await prisma.user.findUnique({ where: { id: d.demoUserId } })) return { created: false };
  const ago = (ms: number) => new Date(now.getTime() - ms);

  await prisma.$transaction(
    async (tx) => {
      await tx.user.create({
        data: {
          id: d.demoUserId,
          name: DEMO_USER.name,
          email: DEMO_USER.email,
          passwordHash: await bcrypt.hash(DEMO_USER.password, 10),
          coins: d.demoUser.coins,
          dotColor: d.demoUser.dotColor,
          createdAt: ago(d.demoUser.createdMsAgo),
          accessories: {
            // "hat" vem antes de "glasses": unlockedAt = createdAt + i ms (i = índice em unlockedAccessoryIds).
            create: d.demoUser.unlockedAccessoryIds.map((accessoryId, i) => ({
              accessoryId,
              unlockedAt: ago(d.demoUser.createdMsAgo - i),
            })),
          },
        },
      });
      for (const c of d.community) {
        await tx.user.create({
          data: {
            id: c.id,
            name: c.name,
            email: `${c.id.slice(2)}@exemplo.dotstudy.app`,
            passwordHash: await bcrypt.hash(randomBytes(24).toString("hex"), 10),
            dotColor: c.dotColor,
            activeAccessoryId: c.accessory,
            createdAt: ago(d.communityCreatedMsAgo),
            accessories: c.accessory
              ? { create: [{ accessoryId: c.accessory, unlockedAt: ago(d.communityCreatedMsAgo) }] }
              : undefined,
          },
        });
      }
      for (const s of d.sessions) {
        const theme = s.subjectId
          ? (SUBJECTS[s.subjectId - 1].themes.find((t) => t.title === s.themeTitle) ?? null)
          : null;
        const end = ago(s.msAgo);
        await tx.studySession.create({
          data: {
            id: s.id,
            userId: s.userId,
            mode: s.subjectId ? "challenge" : "free",
            subjectId: s.subjectId,
            themeId: theme?.id ?? null,
            label: s.subjectId ? null : s.themeTitle,
            focusMinutes: s.focusMinutes,
            breakMinutes: s.subjectId ? 0 : 5,
            plannedCycles: s.cycles,
            completedCycles: s.cycles,
            status: "completed",
            startedAt: new Date(end.getTime() - s.focusMinutes * s.cycles * 60_000),
            lastCycleAt: end,
            finishedAt: end,
          },
        });
      }
      for (const p of d.posts) {
        await tx.post.create({
          data: {
            id: p.id,
            authorId: p.authorId,
            subjectId: p.subjectId,
            type: p.type,
            title: p.title,
            content: p.content,
            mediaDurationSec: p.mediaDurationSec,
            baseLikeCount: p.baseLikeCount,
            createdAt: ago(p.msAgo),
          },
        });
      }
      // comentários pais antes das respostas
      for (const c of [...d.comments].sort((a, b) => Number(a.parentId !== null) - Number(b.parentId !== null))) {
        await tx.comment.create({
          data: {
            id: c.id,
            postId: c.postId,
            authorId: c.authorId,
            parentId: c.parentId,
            content: c.content,
            createdAt: ago(c.msAgo),
          },
        });
      }
      await tx.like.createMany({ data: d.likes });
      await tx.save.createMany({ data: d.saves });
    },
    { timeout: 30_000 },
  );
  return { created: true };
}
