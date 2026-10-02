import { type AuthService, ServiceError } from "@/services/contracts";
import { COINS } from "@/domain/rules";
import { addCoins, findCurrentUser, normalizeEmail, toUser, type MockContext } from "./context";
import { hashPassword } from "./seed";
import { newId } from "./latency";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD = 8;

export function validateCredentials(name: string | undefined, email: string, password: string | undefined) {
  if (name !== undefined && name.trim().length < 2)
    throw new ServiceError("VALIDATION", "Informe seu nome (mínimo 2 letras).");
  if (!EMAIL_RE.test(email)) throw new ServiceError("VALIDATION", "Informe um email válido.");
  if (password !== undefined && password.length < MIN_PASSWORD) {
    throw new ServiceError("VALIDATION", `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.`);
  }
}

export function createAuthService(ctx: MockContext): AuthService {
  return {
    async register({ name, email, password }) {
      await ctx.wait();
      const normalized = normalizeEmail(email);
      const passwordHash = await hashPassword(normalized, password);
      return ctx.db.write((draft) => {
        if (draft.users.some((u) => u.email === normalized)) {
          throw new ServiceError("EMAIL_TAKEN", "Já existe uma conta com esse email.");
        }
        validateCredentials(name, normalized, password);
        const nowIso = new Date(ctx.now()).toISOString();
        const record = {
          id: newId("u"),
          name: name.trim(),
          email: normalized,
          passwordHash,
          coins: 0,
          dotColor: "#22CFD5",
          activeAccessoryId: null,
          unlockedAccessoryIds: [],
          createdAt: nowIso,
        };
        draft.users.push(record);
        addCoins(draft, record.id, COINS.welcome, "welcome", null, nowIso);
        draft.currentUserId = record.id;
        return toUser(draft.users.find((u) => u.id === record.id)!);
      });
    },

    async login({ email, password }) {
      await ctx.wait();
      const normalized = normalizeEmail(email);
      const hash = await hashPassword(normalized, password);
      return ctx.db.write((draft) => {
        const user = draft.users.find((u) => u.email === normalized && u.passwordHash === hash);
        if (!user) throw new ServiceError("INVALID_CREDENTIALS", "Email ou senha incorretos.");
        draft.currentUserId = user.id;
        return toUser(user);
      });
    },

    async logout() {
      await ctx.wait();
      ctx.db.write((draft) => {
        draft.currentUserId = null;
      });
    },

    async me() {
      const user = findCurrentUser(ctx.db.read());
      return user ? toUser(user) : null;
    },
  };
}
