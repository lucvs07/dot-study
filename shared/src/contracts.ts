export type ID = string;
export type ISODate = string;

export type SessionMode = "challenge" | "free";
export type SessionStatus = "in_progress" | "completed" | "abandoned";
export type PostType = "text" | "audio" | "video";
export type CoinReason = "welcome" | "cycle" | "post" | "purchase";
export type SubjectIcon = "sigma" | "atom" | "hourglass" | "pen-tool" | "code";

export interface User {
  id: ID;
  name: string;
  email: string;
  coins: number;
  dotColor: string;
  activeAccessoryId: string | null;
  unlockedAccessoryIds: string[];
  createdAt: ISODate;
}

/** Dados públicos de quem escreveu um post/comentário ou aparece no ranking. */
export interface Author {
  id: ID;
  name: string;
  dotColor: string;
  activeAccessoryId: string | null;
}

export interface Theme {
  id: number;
  title: string;
  subjectId: number;
}

export interface Subject {
  id: number;
  name: string;
  color: string;
  icon: SubjectIcon;
  themes: Theme[];
}

export interface StudySession {
  id: ID;
  userId: ID;
  mode: SessionMode;
  subjectId: number | null;
  themeId: number | null;
  label: string | null;
  focusMinutes: number;
  breakMinutes: number;
  plannedCycles: number;
  completedCycles: number;
  notes: string;
  status: SessionStatus;
  startedAt: ISODate;
  lastCycleAt: ISODate | null;
  finishedAt: ISODate | null;
  rewardedPostId: ID | null;
}

export interface Post {
  id: ID;
  author: Author;
  sessionId: ID | null;
  subjectId: number | null;
  type: PostType;
  title: string;
  content: string;
  mediaUrl: string | null;
  mediaDurationSec: number | null;
  createdAt: ISODate;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
}

export interface Comment {
  id: ID;
  postId: ID;
  author: Author;
  parentId: ID | null;
  content: string;
  createdAt: ISODate;
  replies: Comment[];
}

export interface Accessory {
  id: string;
  name: string;
  cost: number;
}

export interface RankEntry {
  position: number;
  user: Author;
  score: number;
  isMe: boolean;
}

export interface DailyMinutes {
  date: string; // YYYY-MM-DD no fuso local
  minutes: number;
}

export interface UserStats {
  streakDays: number;
  totalMinutes: number;
  completedCycles: number;
  last7Days: DailyMinutes[];
}

export interface CoinReward {
  coinsEarned: number;
  balance: number;
}

export type StartSessionInput =
  | { mode: "challenge"; subjectId: number | "random"; focusMinutes: number }
  | { mode: "free"; label: string | null; focusMinutes: number; breakMinutes: number; plannedCycles: number };

export interface CreatePostInput {
  sessionId: ID | null;
  type: PostType;
  title: string;
  content: string;
  mediaUrl?: string | null;
  mediaDurationSec?: number | null;
}

export interface PostFilter {
  subjectId?: number;
  type?: PostType;
  savedOnly?: boolean;
  cursor?: string | null;
  limit?: number;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export type ServiceErrorCode =
  | "INVALID_CREDENTIALS"
  | "EMAIL_TAKEN"
  | "VALIDATION"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "INSUFFICIENT_COINS"
  | "ALREADY_OWNED"
  | "NOT_OWNED"
  | "CYCLE_TOO_SOON"
  | "SESSION_CLOSED"
  | "MEDIA_TOO_LARGE"
  | "MEDIA_TOO_LONG"
  | "MEDIA_UNSUPPORTED"
  | "NETWORK";

export class ServiceError extends Error {
  constructor(
    public readonly code: ServiceErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export interface AuthService {
  register(input: { name: string; email: string; password: string }): Promise<User>;
  login(input: { email: string; password: string }): Promise<User>;
  logout(): Promise<void>;
  me(): Promise<User | null>;
}

export interface UserService {
  updateProfile(input: {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<User>;
  updateDot(input: { dotColor?: string; activeAccessoryId?: string | null }): Promise<User>;
  getStats(): Promise<UserStats>;
}

export interface SubjectService {
  list(): Promise<Subject[]>;
  randomTheme(subjectId: number): Promise<Theme>;
}

export interface SessionService {
  start(input: StartSessionInput): Promise<StudySession>;
  completeCycle(sessionId: ID): Promise<{ session: StudySession; reward: CoinReward }>;
  updateNotes(sessionId: ID, notes: string): Promise<StudySession>;
  finish(sessionId: ID, status: "completed" | "abandoned"): Promise<StudySession>;
  list(): Promise<StudySession[]>;
}

export interface PostService {
  list(filter?: PostFilter): Promise<Page<Post>>;
  get(id: ID): Promise<Post>;
  create(input: CreatePostInput): Promise<{ post: Post; reward: CoinReward | null }>;
  like(id: ID): Promise<Post>;
  unlike(id: ID): Promise<Post>;
  save(id: ID): Promise<Post>;
  unsave(id: ID): Promise<Post>;
  listComments(postId: ID): Promise<Comment[]>;
  addComment(postId: ID, input: { content: string; parentId?: ID | null }): Promise<Comment>;
}

export interface RankingService {
  bySubject(subjectId: number): Promise<RankEntry[]>;
}

export interface ShopService {
  listAccessories(): Promise<Accessory[]>;
  purchase(accessoryId: string): Promise<User>;
}

export interface MediaService {
  upload(blob: Blob, kind: "audio" | "video", durationSec: number): Promise<{ url: string; durationSec: number }>;
  /** Converte a URL persistida em algo tocável pelo <audio>/<video>. */
  resolveUrl(url: string): Promise<string>;
}

export interface Services {
  auth: AuthService;
  users: UserService;
  subjects: SubjectService;
  sessions: SessionService;
  posts: PostService;
  rankings: RankingService;
  shop: ShopService;
  media: MediaService;
}

export const MEDIA_LIMITS = {
  audio: { maxSeconds: 300, maxBytes: 10 * 1024 * 1024 },
  video: { maxSeconds: 120, maxBytes: 50 * 1024 * 1024 },
} as const;
