import type { User, UserService, UserStats } from "@/services/contracts";
import type { HttpClient } from "./http";

export function createApiUserService(http: HttpClient): UserService {
  return {
    updateProfile: (input) => http.request<User>("PATCH", "/users/me", { body: input }),
    updateDot: (input) => http.request<User>("PATCH", "/users/me/dot", { body: input }),
    getStats: () =>
      http.request<UserStats>("GET", "/users/me/stats", { query: { tzOffset: new Date().getTimezoneOffset() } }),
  };
}
