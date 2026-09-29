import type { Services } from "@/services/contracts";
import { createAuthService } from "./auth";
import type { MockContext } from "./context";
import { MockDb } from "./db";
import { latency } from "./latency";
import { createMediaService, indexedDbMediaStore, type MediaStore } from "./media";
import { createPostService } from "./posts";
import { createRankingService } from "./rankings";
import { createSessionService } from "./sessions";
import { createShopService } from "./shop";
import { browserStorage, type KeyValueStorage } from "./storage";
import { createSubjectService } from "./subjects";
import { createUserService } from "./users";

export interface MockOptions {
  storage?: KeyValueStorage;
  mediaStore?: MediaStore;
  latencyRange?: [number, number];
  now?: () => number;
  random?: () => number;
}

export function createMockServices(opts: MockOptions = {}): Services & { resetDemoData(): void } {
  const ctx: MockContext = {
    db: new MockDb(opts.storage ?? browserStorage()),
    now: opts.now ?? Date.now,
    random: opts.random ?? Math.random,
    wait: () => latency(opts.latencyRange),
  };
  return {
    auth: createAuthService(ctx),
    users: createUserService(ctx),
    subjects: createSubjectService(ctx),
    sessions: createSessionService(ctx),
    posts: createPostService(ctx),
    rankings: createRankingService(ctx),
    shop: createShopService(ctx),
    media: createMediaService(ctx, opts.mediaStore ?? indexedDbMediaStore()),
    resetDemoData: () => ctx.db.reset(),
  };
}
