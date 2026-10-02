import type { CoinReason, ID, ISODate, PostType, StudySession, User } from "@/services/contracts";
import type { KeyValueStorage } from "./storage";
import { buildSeed } from "./seed";

export const STORAGE_KEY = "dotstudy:v1";

export interface UserRecord extends User {
  passwordHash: string;
}
export interface PostRecord {
  id: ID;
  authorId: ID;
  sessionId: ID | null;
  subjectId: number | null;
  type: PostType;
  title: string;
  content: string;
  mediaUrl: string | null;
  mediaDurationSec: number | null;
  createdAt: ISODate;
  seedLikeCount: number;
}
export interface CommentRecord {
  id: ID;
  postId: ID;
  authorId: ID;
  parentId: ID | null;
  content: string;
  createdAt: ISODate;
}
export interface CoinTransaction {
  id: ID;
  userId: ID;
  amount: number;
  reason: CoinReason;
  refId: ID | null;
  createdAt: ISODate;
}
export interface DbState {
  version: 1;
  currentUserId: ID | null;
  users: UserRecord[];
  sessions: StudySession[];
  posts: PostRecord[];
  comments: CommentRecord[];
  likes: { userId: ID; postId: ID }[];
  saves: { userId: ID; postId: ID }[];
  transactions: CoinTransaction[];
}

const ARRAY_KEYS = ["users", "sessions", "posts", "comments", "likes", "saves", "transactions"] as const;

function isValid(value: unknown): value is DbState {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    v.version === 1 &&
    ARRAY_KEYS.every((k) => Array.isArray(v[k])) &&
    (v.currentUserId === null || typeof v.currentUserId === "string")
  );
}

export class MockDb {
  private state: DbState;

  constructor(
    private readonly storage: KeyValueStorage,
    private readonly seedFactory: () => DbState = () => buildSeed(),
  ) {
    this.state = this.load();
  }

  private load(): DbState {
    const raw = this.storage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (isValid(parsed)) return parsed;
      } catch {
        // JSON corrompido: cai no seed abaixo
      }
    }
    const fresh = this.seedFactory();
    this.persist(fresh);
    return fresh;
  }

  private persist(state: DbState) {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  read(): DbState {
    return structuredClone(this.state);
  }

  /** Aplica `fn` numa cópia e só grava se não lançar erro (atomicidade simples). */
  write<T>(fn: (draft: DbState) => T): T {
    const draft = structuredClone(this.state);
    const result = fn(draft);
    // Grava primeiro: se o storage falhar (ex.: cota cheia), a memória não diverge do que foi salvo.
    this.persist(draft);
    this.state = draft;
    return result;
  }

  reset(): void {
    const fresh = this.seedFactory();
    this.persist(fresh);
    this.state = fresh;
  }
}
