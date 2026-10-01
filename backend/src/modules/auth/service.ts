import { COINS } from "@dot-study/shared/rules";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Deps } from "../../deps";
import { AppError, isUniqueViolation } from "../../errors";
import { signToken } from "../../middleware/auth";
import { toUser, userInclude } from "../../serialize";
import { parse } from "../../validate";

export const emailSchema = z
  .string({ required_error: "Informe um email válido." })
  .trim()
  .toLowerCase()
  .email("Informe um email válido.");
export const passwordSchema = z
  .string({ required_error: "A senha precisa ter pelo menos 8 caracteres." })
  .min(8, "A senha precisa ter pelo menos 8 caracteres.")
  .max(72, "A senha pode ter no máximo 72 caracteres.");
export const nameSchema = z
  .string({ required_error: "Informe seu nome (mínimo 2 letras)." })
  .trim()
  .min(2, "Informe seu nome (mínimo 2 letras).")
  .max(60, "O nome pode ter no máximo 60 caracteres.");

const registerSchema = z.object({ name: nameSchema, email: emailSchema, password: passwordSchema });
const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ required_error: "Informe sua senha." }).min(1, "Informe sua senha."),
});

export function createAuthService(deps: Deps) {
  const { prisma, env } = deps;
  return {
    async register(body: unknown) {
      const { name, email, password } = parse(registerSchema, body);
      if (await prisma.user.findUnique({ where: { email } }))
        throw new AppError("EMAIL_TAKEN", "Já existe uma conta com esse email.");
      const passwordHash = await bcrypt.hash(password, 10);
      const now = deps.now();
      try {
        const user = await prisma.$transaction(async (tx) => {
          const created = await tx.user.create({
            data: { name, email, passwordHash, coins: COINS.welcome, createdAt: now },
            include: userInclude,
          });
          await tx.coinTransaction.create({
            data: { userId: created.id, amount: COINS.welcome, reason: "welcome", createdAt: now },
          });
          return created;
        });
        return { token: signToken(env, user.id), user: toUser(user) };
      } catch (error) {
        if (isUniqueViolation(error)) throw new AppError("EMAIL_TAKEN", "Já existe uma conta com esse email.");
        throw error;
      }
    },

    async login(body: unknown) {
      const { email, password } = parse(loginSchema, body);
      const user = await prisma.user.findUnique({ where: { email }, include: userInclude });
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        throw new AppError("INVALID_CREDENTIALS", "Email ou senha incorretos.");
      }
      return { token: signToken(env, user.id), user: toUser(user) };
    },

    async me(userId: string) {
      const user = await prisma.user.findUnique({ where: { id: userId }, include: userInclude });
      if (!user) throw new AppError("UNAUTHORIZED", "Sua sessão expirou. Faça login de novo.");
      return toUser(user);
    },
  };
}
