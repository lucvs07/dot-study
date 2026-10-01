import { ACCESSORIES, SUBJECTS } from "@dot-study/shared/catalog";
import type { PrismaClient } from "@prisma/client";

export async function seedCatalog(prisma: PrismaClient): Promise<void> {
  for (const s of SUBJECTS) {
    await prisma.subject.upsert({
      where: { id: s.id },
      create: { id: s.id, name: s.name, color: s.color, icon: s.icon },
      update: { name: s.name, color: s.color, icon: s.icon },
    });
    for (const t of s.themes) {
      await prisma.theme.upsert({
        where: { id: t.id },
        create: { id: t.id, title: t.title, subjectId: s.id },
        update: { title: t.title, subjectId: s.id },
      });
    }
  }
  for (const a of ACCESSORIES) {
    await prisma.accessory.upsert({ where: { id: a.id }, create: a, update: { name: a.name, cost: a.cost } });
  }
}
