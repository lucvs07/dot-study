import type { Services } from "@/services/contracts";
import { createApiAuthService } from "./auth";
import { createHttpClient } from "./http";
import { createApiMediaService } from "./media";
import { createApiPostService } from "./posts";
import { createApiRankingService } from "./rankings";
import { createApiSessionService } from "./sessions";
import { createApiShopService } from "./shop";
import { createApiSubjectService } from "./subjects";
import { browserTokenStore, type TokenStore } from "./tokens";
import { createApiUserService } from "./users";

export function createApiServices({
  baseUrl,
  tokens = browserTokenStore(),
  fetchFn,
}: {
  baseUrl: string;
  tokens?: TokenStore;
  fetchFn?: (input: string, init?: RequestInit) => Promise<Response>;
}): Services {
  const http = createHttpClient({ baseUrl, tokens, fetchFn });
  return {
    auth: createApiAuthService(http),
    users: createApiUserService(http),
    subjects: createApiSubjectService(http),
    sessions: createApiSessionService(http),
    posts: createApiPostService(http),
    rankings: createApiRankingService(http),
    shop: createApiShopService(http),
    media: createApiMediaService(http),
  };
}
