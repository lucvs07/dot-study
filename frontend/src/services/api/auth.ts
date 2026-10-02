import { ServiceError, type AuthService, type User } from "@/services/contracts";
import type { HttpClient } from "./http";

export function createApiAuthService(http: HttpClient): AuthService {
  const authenticate = async (path: string, body: object) => {
    const res = await http.request<{ token: string; user: User }>("POST", path, { body });
    http.tokens.set(res.token);
    return res.user;
  };
  return {
    register: (input) => authenticate("/auth/register", input),
    login: (input) => authenticate("/auth/login", input),
    async logout() {
      http.tokens.set(null);
    },
    async me() {
      if (!http.tokens.get()) return null;
      try {
        return await http.request<User>("GET", "/auth/me");
      } catch (error) {
        if (error instanceof ServiceError && error.code === "UNAUTHORIZED") return null;
        throw error;
      }
    },
  };
}
