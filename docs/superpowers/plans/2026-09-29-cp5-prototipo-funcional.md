# CP5 — Protótipo Funcional (dados mockados) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o protótipo do Figma Make em um app React navegável, com cadastro/login, sessão de estudo, publicação (texto/áudio/vídeo), feed, ranking, loja, ajustes e player Spotify — tudo sobre uma camada de serviços mockada em localStorage/IndexedDB, pronta para ser trocada pela API no CP6.

**Architecture:** Monorepo npm workspaces; `frontend/` é o protótipo portado e quebrado em `pages/`, `components/`, `hooks/`, `services/`. As telas só conhecem as interfaces de `services/contracts.ts`; a implementação `mock/` é escolhida por `VITE_DATA_SOURCE=mock`. Regras de pontuação ficam puras em `domain/rules.ts` e são testadas isoladamente.

**Tech Stack:** Node 24, npm 11 workspaces, Vite 6, React 18.3, TypeScript 5.6 (strict), Tailwind 4, react-router 7, TanStack Query 5, lucide-react, recharts, Vitest 3 + Testing Library + jsdom + fake-indexeddb, ESLint 9 + Prettier 3, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-29-dot-study-cp5-cp6-design.md` (ler §2–§5, §8, §9, §11, §12 antes de começar).

**Fonte do protótipo:** o zip `/home/asaas/Downloads/Interface prototipação .study.zip`, já extraído em `/tmp/claude-1000/-home-asaas-projects-dot-study/8b4fc660-7d32-4eb7-b80b-4321d014c8f3/scratchpad/proto/` (se não existir, extrair o zip de novo nesse caminho com `unzip -q "<zip>" -d <caminho>`). A Task 1 copia o protótipo para `frontend/`; a partir daí **a referência é `frontend/src/app/App.tsx` no próprio repo**, e as tasks citam funções pelo nome (ex.: `function TimerView`), não por número de linha.

## Global Constraints

- Idioma: toda UI, mensagens de erro, commits e docs em **pt-BR**. Identificadores de código em inglês (como no protótipo).
- Visual do protótipo preservado: paleta `BRAND` (`teal #22CFD5`, `yellow #FFC23D`, `purple #A35BBF`, `red #EE1B3F`, `green #2CCD2C`, `dark #111827`, `offwhite #FFFFF6`), fontes Outfit/Inter, `styles/theme.css` sem alteração de tokens.
- TypeScript `strict: true`; `npm run lint`, `npm test` e `npm run build` na raiz precisam passar ao fim de toda task.
- Sem MUI, emotion, radix, shadcn/ui, pnpm. Dependências novas só as listadas no Tech Stack.
- Login com Google **removido** por completo (inclusive opção em Ajustes). "Esqueci minha senha" removido.
- Pontuação (spec §4): ciclo concluído **+10 moedas / +10 pontos** (pontos só com assunto); post publicado **+30 / +30** (máx. 1 recompensa por sessão); cadastro **+250 moedas**; compra **−custo**.
- Anti-trapaça: ciclo aceito só se `agora − (lastCycleAt ?? startedAt) ≥ 0,9 × focusMinutes × 60 000 ms`; `completedCycles ≤ plannedCycles`.
- Limites de mídia: áudio ≤ 300 s e ≤ 10 MB; vídeo ≤ 120 s e ≤ 50 MB.
- Chave do localStorage: `dotstudy:v1`. Banco de mídia IndexedDB: `dotstudy-media`, store `blobs`.
- Usuário de demo (dado de teste, documentado no README): `demo@dotstudy.app` / `dotstudy123`, nome "Guilherme".
- `VITE_DEMO_MODE=true` adiciona a dificuldade "Demo" (1 min). Padrão desligado.
- Nada de segredo commitado; só `.env.example`.
- **Commits:** sem coautoria do Claude e sem "Generated with Claude Code". Cada task define autor e coautor. Formato obrigatório:

```bash
git commit --author="<Autor> <<email>>" -m "<tipo>: <mensagem em pt-BR>" -m "Co-Authored-By: <Coautor> <<email>>"
```

| Integrante | Identidade |
|---|---|
| Lucas | `Lucas Rodrigues Grecco <79089727+lucvs07@users.noreply.github.com>` |
| Monique | `Monique Ferreira dos Anjos <anjos.moniqueferreira@gmail.com>` |
| Tiago | `Tiago Brito Nário <tiago.tibi.nario@gmail.com>` |
| Rafael | `Rafael Augusto Oliveira Silva <rafael.a.os@hotmail.com>` |
| Felipe | `Felipe Wapf Fettback <wapffelipe@gmail.com>` |
| Leonardo | `Leonardo Tanaka Cortez <leonardotanaka0513@gmail.com>` |

- Branch de trabalho: `feat/cp5` (já existe). Não fazer push nem abrir PR sem confirmação do usuário (Task 18).

## Review Focus

1. **Aba em segundo plano / timer atrasado** — navegadores estrangulam `setInterval` em abas inativas; o timer deve se basear em horário-alvo (`deadline`), não em decremento, e terminar na hora certa ao voltar para a aba. Teste em Task 12 (`useCountdown` com relógio avançado de uma vez).
2. **Recarregar a página no meio de uma sessão** — ao iniciar uma nova sessão, sessões `in_progress` antigas do usuário viram `abandoned` e não geram recompensa depois. Teste em Task 6.
3. **localStorage corrompido ou de outra versão** — JSON inválido ou `version` diferente não pode dar tela branca: o banco é recriado a partir do seed. Teste em Task 4.
4. **Email com maiúsculas/espaços** — `" Ana@X.com "` e `"ana@x.com"` são o mesmo usuário no cadastro (conflito) e no login. Teste em Task 5.
5. **Microfone/câmera negados ou `MediaRecorder` indisponível** — mensagem clara em pt-BR, o post em texto continua funcionando. Teste em Task 14.

Além desses, a Task 7 testa compra duplicada em paralelo (clique duplo) debitando só uma vez.

---

## Mapa de arquivos (estado ao fim do CP5)

```
package.json                     # workspaces + scripts raiz
.gitignore                       # + node_modules, dist, .env
.github/workflows/ci.yml
eslint.config.js  .prettierrc.json
frontend/
  package.json  tsconfig.json  vite.config.ts  vitest.setup.ts  index.html  postcss.config.mjs
  vercel.json  .env.example  ATTRIBUTIONS.md
  src/
    main.tsx
    vite-env.d.ts
    styles/{index,fonts,tailwind,theme}.css
    assets/accessories/{glasses,party-hat,witch-hat}.ts   # SVGs usados pelo DotAvatar
    domain/
      brand.ts                   # BRAND, DOT_COLORS, SUBJECT_ICONS
      rules.ts                   # pontuação, anti-trapaça, streak, ranking (puro)
      format.ts                  # formatTotalTime, formatRecTime, getDateLabel, relativeTime
      difficulty.ts              # DIFFICULTY_PRESETS (+ Demo)
    services/
      contracts.ts               # tipos + interfaces + ServiceError
      index.ts                   # createServices(dataSource)
      ServicesContext.tsx        # provider + useServices()
      mock/
        storage.ts               # KeyValueStorage (localStorage | memória)
        db.ts                    # MockDb: load/validate/seed/write/reset
        seed.ts                  # dados iniciais (do protótipo)
        latency.ts
        auth.ts  users.ts  subjects.ts  sessions.ts  posts.ts  rankings.ts  shop.ts  media.ts
        index.ts                 # createMockServices(opts)
    app/
      router.tsx  providers.tsx  AppLayout.tsx  ProtectedRoute.tsx  queryKeys.ts
    hooks/
      useAuth.ts  useCountdown.ts  useMediaRecorder.ts  useMediaUrl.ts
    components/
      DotAvatar.tsx  StudyLogo.tsx  CircularTimer.tsx  DurationPicker.tsx  AudioWave.tsx
      FloatingTimer.tsx  FreeSessionSummary.tsx  PostPublisher.tsx  BottomNav.tsx
      ChartTooltip.tsx  ErrorMessage.tsx  LoadingState.tsx
      spotify/SpotifyPlayer.tsx
    pages/
      LoginPage.tsx  CadastroPage.tsx  DashboardPage.tsx  EstudarPage.tsx  FeedPage.tsx
      PostPage.tsx  RankingPage.tsx  HistoricoPage.tsx  LojaPage.tsx  AjustesPage.tsx
      LeituraListaPage.tsx  LeituraPage.tsx  SpotifyCallbackPage.tsx
    content/
      articleData.ts  ArticlesView.tsx  ReaderView.tsx   # conteúdo editorial (movidos do protótipo)
    spotify/
      playlists.ts  pkce.ts  spotifyApi.ts  embedController.ts
    test/
      renderWithProviders.tsx
docs/
  02-requisitos.md  03-escopo.md  04-modelagem-uml.md  08-jornada.md  11-roteiros-video.md
README.md
```

---

### Task 1: Importar o protótipo do Figma Make como app React no monorepo

**Autor:** Monique · **Coautor:** Tiago

**Files:**
- Create: `package.json`, `frontend/package.json`, `frontend/tsconfig.json`, `frontend/src/vite-env.d.ts`
- Create (cópia do protótipo): `frontend/index.html`, `frontend/vite.config.ts`, `frontend/postcss.config.mjs`, `frontend/ATTRIBUTIONS.md`, `frontend/src/main.tsx`, `frontend/src/styles/*.css`, `frontend/src/app/App.tsx`, `frontend/src/app/components/{ArticlesView.tsx,ReaderView.tsx,articleData.ts}`, `frontend/src/imports/{Group26-1,Group27-1,Group29-2}/*`
- Modify: `.gitignore`
- Delete: `frontend/.gitkeep`, `backend/.gitkeep` se existirem (verificar com `ls -a frontend backend`; manter `backend/` com `.gitkeep`)

**Interfaces:**
- Produces: `npm run dev -w frontend`, `npm run build`, `npm run typecheck` funcionando; `frontend/src/app/App.tsx` idêntico ao protótipo (salvo os 2 ajustes de tipo abaixo).

- [ ] **Step 1: Copiar só o que é usado**

```bash
P=/tmp/claude-1000/-home-asaas-projects-dot-study/8b4fc660-7d32-4eb7-b80b-4321d014c8f3/scratchpad/proto
cd /home/asaas/projects/dot-study
mkdir -p frontend/src/app/components frontend/src/imports frontend/src/styles
cp "$P/index.html" "$P/vite.config.ts" "$P/postcss.config.mjs" "$P/ATTRIBUTIONS.md" frontend/
cp "$P/src/main.tsx" frontend/src/
cp "$P"/src/styles/*.css frontend/src/styles/
cp "$P/src/app/App.tsx" frontend/src/app/
cp "$P"/src/app/components/{ArticlesView.tsx,ReaderView.tsx,articleData.ts} frontend/src/app/components/
cp -r "$P"/src/imports/{Group26-1,Group27-1,Group29-2} frontend/src/imports/
```

Não copiar: `fix_*`, `*.sh`, `test_*`, `new_*.tsx`, `replacement.jsx`, `plan.txt`, `default_shadcn_theme.css`, `pnpm-workspace.yaml`, `guidelines/`, `src/app/components/ui/`, `src/app/components/figma/`, demais pastas de `src/imports/` (não são referenciadas).

- [ ] **Step 2: Criar `package.json` da raiz**

```json
{
  "name": "dot-study",
  "private": true,
  "workspaces": ["frontend"],
  "scripts": {
    "dev": "npm run dev -w frontend",
    "build": "npm run build -w frontend",
    "typecheck": "npm run typecheck -w frontend",
    "test": "npm test -w frontend",
    "lint": "npm run lint -w frontend"
  },
  "engines": { "node": ">=20" }
}
```

- [ ] **Step 3: Criar `frontend/package.json`**

```json
{
  "name": "@dot-study/frontend",
  "private": true,
  "version": "0.5.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -p tsconfig.json && vite build",
    "preview": "vite preview",
    "typecheck": "tsc -p tsconfig.json",
    "test": "echo \"sem testes ainda\"",
    "lint": "echo \"sem lint ainda\""
  },
  "dependencies": {
    "lucide-react": "0.487.0",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "recharts": "2.15.2",
    "tw-animate-css": "1.3.8"
  },
  "devDependencies": {
    "@tailwindcss/vite": "4.1.12",
    "@types/node": "22.10.0",
    "@types/react": "18.3.12",
    "@types/react-dom": "18.3.1",
    "@vitejs/plugin-react": "4.7.0",
    "tailwindcss": "4.1.12",
    "typescript": "5.6.3",
    "vite": "6.3.5"
  }
}
```

- [ ] **Step 4: Criar `frontend/tsconfig.json` e `frontend/src/vite-env.d.ts`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "types": ["vite/client"],
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src"]
}
```

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_SOURCE?: "mock" | "api";
  readonly VITE_DEMO_MODE?: string;
  readonly VITE_SPOTIFY_CLIENT_ID?: string;
  readonly VITE_API_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

- [ ] **Step 5: Ajustes mínimos para compilar em modo strict**

  - Em `frontend/vite.config.ts`, remover a função `figmaAssetResolver` e seu uso em `plugins` (não há `figma:asset/` no código copiado). Remover também os comentários do Figma Make.
  - Em `frontend/src/app/components/ReaderView.tsx`, o `tsc` acusa `Parameter 'editing' implicitly has an 'any' type` (por volta da linha 396). Tipar o parâmetro com o tipo do estado que ele recebe (ler o `useState` correspondente no mesmo componente e usar o mesmo tipo).
  - Em `frontend/index.html`: `lang="pt-BR"`, `<title>dot.study</title>`, `<meta name="description" content="Plataforma gamificada de estudos: foco com pomodoro, publicação e recompensas.">`, remover `noindex`.

- [ ] **Step 6: Ajustar `.gitignore`**

Garantir estas linhas (manter as existentes):

```
node_modules/
dist/
.env
.env.*
!.env.example
coverage/
```

- [ ] **Step 7: Instalar, tipar e buildar**

Run: `npm install && npm run typecheck && npm run build`
Expected: `typecheck` sem erros; `vite build` termina com `✓ built` (o aviso de chunk > 500 kB é aceitável).

- [ ] **Step 8: Conferir no navegador**

Run: `npm run dev` e abrir `http://localhost:5173`. Expected: dashboard do protótipo com "Guilherme", navegação inferior funcionando. Encerrar o servidor.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json .gitignore frontend
git commit --author="Monique Ferreira dos Anjos <anjos.moniqueferreira@gmail.com>" \
  -m "feat: importar protótipo do Figma Make como app React" \
  -m "Traz a interface de alta fidelidade para frontend/ em um monorepo npm, sem os scripts auxiliares do Figma Make e sem dependências não utilizadas (MUI, radix, shadcn)." \
  -m "Co-Authored-By: Tiago Brito Nário <tiago.tibi.nario@gmail.com>"
```

---

### Task 2: Ferramentas de qualidade — ESLint, Prettier, Vitest e CI

**Autor:** Lucas · **Coautor:** Leonardo

**Files:**
- Create: `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `frontend/vitest.setup.ts`, `frontend/src/test/smoke.test.ts`, `.github/workflows/ci.yml`
- Modify: `frontend/package.json` (scripts + devDeps), `frontend/vite.config.ts` (bloco `test`), `package.json` raiz (devDeps de lint)

**Interfaces:**
- Produces: `npm run lint`, `npm test`, `npm run format` na raiz; ambiente Vitest `node` por padrão e `jsdom` via comentário `// @vitest-environment jsdom`; `vitest.setup.ts` carrega `@testing-library/jest-dom/vitest` e `fake-indexeddb/auto`.

- [ ] **Step 1: Instalar dependências**

```bash
npm i -D -w frontend vitest@3.0.5 @vitest/coverage-v8@3.0.5 jsdom@25.0.1 @testing-library/react@16.1.0 @testing-library/user-event@14.5.2 @testing-library/jest-dom@6.6.3 fake-indexeddb@6.0.0
npm i -D eslint@9.17.0 @eslint/js@9.17.0 typescript-eslint@8.18.2 eslint-plugin-react-hooks@5.1.0 eslint-plugin-react-refresh@0.4.16 globals@15.14.0 prettier@3.4.2
```

- [ ] **Step 2: `eslint.config.js` (raiz)**

```js
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/dist", "**/node_modules", "**/coverage", "frontend/src/imports/**"] },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { ecmaVersion: 2022, globals: { ...globals.browser, ...globals.node } },
    plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
);
```

Adicionar `"type": "module"` ao `package.json` raiz.

- [ ] **Step 3: Prettier**

`.prettierrc.json`:

```json
{ "printWidth": 120, "semi": true, "singleQuote": false, "trailingComma": "all" }
```

`.prettierignore`:

```
dist
node_modules
coverage
frontend/src/imports
package-lock.json
```

- [ ] **Step 4: Vitest**

Em `frontend/vite.config.ts`, trocar o import para `import { defineConfig } from "vitest/config";` e adicionar dentro do objeto:

```ts
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    restoreMocks: true,
  },
```

`frontend/vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
```

Adicionar `"types": ["vite/client", "vitest/globals"]` não é necessário (usar imports explícitos de `vitest`). Incluir `"vitest.setup.ts"` em `include` do `tsconfig.json` do frontend.

Scripts em `frontend/package.json`:

```json
"test": "vitest run",
"test:watch": "vitest",
"lint": "eslint src --max-warnings=0"
```

Scripts na raiz (Prettier só no código — as docs em Markdown ficam como estão):

```json
"format": "prettier --write \"frontend/**/*.{ts,tsx,css,json}\" \"*.{js,json}\" \".github/**/*.yml\"",
"format:check": "prettier --check \"frontend/**/*.{ts,tsx,css,json}\" \"*.{js,json}\" \".github/**/*.yml\"",
"lint": "npm run lint -w frontend && npm run format:check"
```

- [ ] **Step 5: Teste de fumaça**

`frontend/src/test/smoke.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("ambiente de testes", () => {
  it("tem IndexedDB falso disponível", () => {
    expect(typeof indexedDB.open).toBe("function");
  });
});
```

Run: `npm test`
Expected: `1 passed`.

- [ ] **Step 6: Deixar o lint passar**

Run: `npm run format && npm run lint`
Expected: sem erros. O `App.tsx` do protótipo pode acusar `react-hooks/exhaustive-deps` ou variáveis não usadas: corrigir removendo imports/variáveis não usados; para avisos de dependências de efeito que exigiriam mudar comportamento, adicionar `// eslint-disable-next-line react-hooks/exhaustive-deps` **apenas no `App.tsx`** (ele será desmontado nas Tasks 9–15). Não mudar comportamento.

- [ ] **Step 7: CI**

`.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
```

- [ ] **Step 8: Verificar tudo e commitar**

Run: `npm run lint && npm run typecheck && npm test && npm run build`
Expected: tudo verde.

```bash
git add -A
git commit --author="Lucas Rodrigues Grecco <79089727+lucvs07@users.noreply.github.com>" \
  -m "chore: configurar ESLint, Prettier, Vitest e CI" \
  -m "Co-Authored-By: Leonardo Tanaka Cortez <leonardotanaka0513@gmail.com>"
```

---

### Task 3: Contrato de dados e regras de negócio puras

**Autor:** Felipe · **Coautor:** Lucas

**Files:**
- Create: `frontend/src/services/contracts.ts`, `frontend/src/domain/rules.ts`, `frontend/src/domain/rules.test.ts`, `frontend/src/domain/brand.ts`, `frontend/src/domain/difficulty.ts`

**Interfaces:**
- Produces (usado por todas as tasks seguintes): todos os tipos e interfaces de `contracts.ts` abaixo; de `rules.ts`: `COINS`, `POINTS`, `CYCLE_MIN_FRACTION`, `canCompleteCycle`, `sessionMinutes`, `calculateStreak`, `computeSubjectScores`, `rankEntries`; de `brand.ts`: `BRAND`, `DOT_COLORS`; de `difficulty.ts`: `DIFFICULTY_PRESETS`, `DifficultyId`.

- [ ] **Step 1: `frontend/src/services/contracts.ts`**

```ts
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
  updateProfile(input: { name?: string; email?: string; currentPassword?: string; newPassword?: string }): Promise<User>;
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
```

- [ ] **Step 2: `frontend/src/domain/brand.ts`**

```ts
export const BRAND = {
  teal: "#22CFD5",
  yellow: "#FFC23D",
  purple: "#A35BBF",
  red: "#EE1B3F",
  green: "#2CCD2C",
  dark: "#111827",
  offwhite: "#FFFFF6",
} as const;

export const DOT_COLORS: string[] = [
  BRAND.teal, BRAND.yellow, BRAND.purple, BRAND.red, BRAND.green, BRAND.dark, "#EC6F00", "#2563EB",
];
```

- [ ] **Step 3: `frontend/src/domain/difficulty.ts`**

```ts
import { BRAND } from "./brand";

export interface DifficultyPreset {
  id: "demo" | "easy" | "medium" | "hard";
  label: string;
  minutes: number;
  description: string;
  color: string;
}

const BASE: DifficultyPreset[] = [
  { id: "easy", label: "Fácil", minutes: 15, description: "Tema introdutório", color: BRAND.green },
  { id: "medium", label: "Médio", minutes: 25, description: "Tema intermediário", color: BRAND.yellow },
  { id: "hard", label: "Difícil", minutes: 40, description: "Tema avançado", color: BRAND.red },
];

const DEMO: DifficultyPreset = { id: "demo", label: "Demo", minutes: 1, description: "Sessão rápida para apresentação", color: BRAND.purple };

export function getDifficultyPresets(demoMode: boolean = import.meta.env.VITE_DEMO_MODE === "true"): DifficultyPreset[] {
  return demoMode ? [DEMO, ...BASE] : BASE;
}

export type DifficultyId = DifficultyPreset["id"];
```

- [ ] **Step 4: Escrever os testes de `rules.ts` (falhando)**

`frontend/src/domain/rules.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Author, StudySession } from "@/services/contracts";
import { COINS, POINTS, calculateStreak, canCompleteCycle, computeSubjectScores, rankEntries, sessionMinutes } from "./rules";

const base: StudySession = {
  id: "s1", userId: "u1", mode: "challenge", subjectId: 1, themeId: 1, label: null,
  focusMinutes: 25, breakMinutes: 0, plannedCycles: 1, completedCycles: 0, notes: "",
  status: "in_progress", startedAt: "2026-09-29T10:00:00.000Z", lastCycleAt: null, finishedAt: null, rewardedPostId: null,
};
const at = (iso: string) => new Date(iso).getTime();

describe("valores de pontuação", () => {
  it("segue a spec", () => {
    expect(COINS).toEqual({ welcome: 250, cycle: 10, post: 30 });
    expect(POINTS).toEqual({ cycle: 10, post: 30 });
  });
});

describe("canCompleteCycle", () => {
  it("recusa antes de 90% do tempo de foco", () => {
    expect(canCompleteCycle(base, at("2026-09-29T10:22:29.000Z"))).toEqual({ ok: false, reason: "CYCLE_TOO_SOON" });
  });
  it("aceita com 90% do tempo de foco", () => {
    expect(canCompleteCycle(base, at("2026-09-29T10:22:30.000Z"))).toEqual({ ok: true });
  });
  it("mede a partir do último ciclo concluído", () => {
    const s = { ...base, plannedCycles: 2, completedCycles: 1, lastCycleAt: "2026-09-29T10:30:00.000Z" };
    expect(canCompleteCycle(s, at("2026-09-29T10:40:00.000Z"))).toEqual({ ok: false, reason: "CYCLE_TOO_SOON" });
    expect(canCompleteCycle(s, at("2026-09-29T10:52:30.000Z"))).toEqual({ ok: true });
  });
  it("recusa sessão encerrada ou com todos os ciclos feitos", () => {
    expect(canCompleteCycle({ ...base, status: "abandoned" }, at("2026-09-29T12:00:00.000Z"))).toEqual({ ok: false, reason: "SESSION_CLOSED" });
    expect(canCompleteCycle({ ...base, completedCycles: 1 }, at("2026-09-29T12:00:00.000Z"))).toEqual({ ok: false, reason: "SESSION_CLOSED" });
  });
});

describe("sessionMinutes", () => {
  it("é ciclos concluídos × minutos de foco", () => {
    expect(sessionMinutes({ ...base, completedCycles: 3, focusMinutes: 25 })).toBe(75);
  });
});

describe("calculateStreak", () => {
  const now = new Date(2026, 8, 29, 15, 0, 0).getTime(); // 29/09 local
  const day = (d: number, h = 10) => new Date(2026, 8, d, h).toISOString();
  it("conta dias consecutivos terminando hoje", () => {
    expect(calculateStreak([day(29), day(28), day(28, 20), day(27), day(25)], now)).toBe(3);
  });
  it("é zero se não estudou hoje", () => {
    expect(calculateStreak([day(28), day(27)], now)).toBe(0);
  });
});

describe("ranking", () => {
  const ana: Author = { id: "u2", name: "Ana", dotColor: "#000", activeAccessoryId: null };
  const eu: Author = { id: "u1", name: "Eu", dotColor: "#111", activeAccessoryId: null };
  it("soma 10 por ciclo e 30 por post no assunto", () => {
    const scores = computeSubjectScores(
      1,
      [
        { ...base, userId: "u1", completedCycles: 1 },
        { ...base, id: "s2", userId: "u2", completedCycles: 4 },
        { ...base, id: "s3", userId: "u2", subjectId: 2, completedCycles: 9 },
      ],
      [{ authorId: "u1", subjectId: 1 }, { authorId: "u1", subjectId: 1 }, { authorId: "u2", subjectId: 2 }],
    );
    expect(scores.get("u1")).toBe(70);
    expect(scores.get("u2")).toBe(40);
  });
  it("ordena por pontuação, marca o usuário atual e ignora zero", () => {
    const entries = rankEntries(new Map([["u1", 70], ["u2", 40], ["u3", 0]]), new Map([["u1", eu], ["u2", ana]]), "u1");
    expect(entries).toEqual([
      { position: 1, user: eu, score: 70, isMe: true },
      { position: 2, user: ana, score: 40, isMe: false },
    ]);
  });
});
```

Run: `npm test -- rules`
Expected: FAIL (`Cannot find module './rules'`).

- [ ] **Step 5: Implementar `frontend/src/domain/rules.ts`**

```ts
import type { Author, ID, ISODate, RankEntry, StudySession } from "@/services/contracts";

export const COINS = { welcome: 250, cycle: 10, post: 30 } as const;
export const POINTS = { cycle: 10, post: 30 } as const;
export const CYCLE_MIN_FRACTION = 0.9;

export type CycleCheck = { ok: true } | { ok: false; reason: "CYCLE_TOO_SOON" | "SESSION_CLOSED" };

export function canCompleteCycle(session: StudySession, nowMs: number): CycleCheck {
  if (session.status !== "in_progress" || session.completedCycles >= session.plannedCycles) {
    return { ok: false, reason: "SESSION_CLOSED" };
  }
  const since = new Date(session.lastCycleAt ?? session.startedAt).getTime();
  const minMs = CYCLE_MIN_FRACTION * session.focusMinutes * 60_000;
  return nowMs - since >= minMs ? { ok: true } : { ok: false, reason: "CYCLE_TOO_SOON" };
}

export function sessionMinutes(session: StudySession): number {
  return session.completedCycles * session.focusMinutes;
}

export function localDayKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

/** Dias consecutivos com estudo, contando a partir de hoje (fuso local). */
export function calculateStreak(studyDates: ISODate[], nowMs: number): number {
  const days = new Set(studyDates.map((iso) => localDayKey(new Date(iso))));
  const cursor = new Date(nowMs);
  let streak = 0;
  while (days.has(localDayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function computeSubjectScores(
  subjectId: number,
  sessions: StudySession[],
  posts: { authorId: ID; subjectId: number | null }[],
): Map<ID, number> {
  const scores = new Map<ID, number>();
  const add = (userId: ID, value: number) => scores.set(userId, (scores.get(userId) ?? 0) + value);
  for (const s of sessions) if (s.subjectId === subjectId) add(s.userId, s.completedCycles * POINTS.cycle);
  for (const p of posts) if (p.subjectId === subjectId) add(p.authorId, POINTS.post);
  return scores;
}

export function rankEntries(scores: Map<ID, number>, authors: Map<ID, Author>, meId: ID | null): RankEntry[] {
  return [...scores.entries()]
    .filter(([id, score]) => score > 0 && authors.has(id))
    .sort((a, b) => b[1] - a[1] || authors.get(a[0])!.name.localeCompare(authors.get(b[0])!.name))
    .map(([id, score], i) => ({ position: i + 1, user: authors.get(id)!, score, isMe: id === meId }));
}
```

Adicionar alias `@` no Vitest: em `vite.config.ts` o `resolve.alias` já existe e vale para os testes.

- [ ] **Step 6: Rodar os testes**

Run: `npm test -- rules && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/services/contracts.ts frontend/src/domain
git commit --author="Felipe Wapf Fettback <wapffelipe@gmail.com>" \
  -m "feat: definir contrato de dados e regras de pontuação" \
  -m "Contrato único dos serviços (RNF04) e regras puras: moedas, pontos por assunto, anti-trapaça de ciclo, sequência de dias e ranking." \
  -m "Co-Authored-By: Lucas Rodrigues Grecco <79089727+lucvs07@users.noreply.github.com>"
```

---

### Task 4: Banco mock — armazenamento, seed e recuperação de dados corrompidos

**Autor:** Leonardo · **Coautor:** Felipe

**Files:**
- Create: `frontend/src/services/mock/storage.ts`, `frontend/src/services/mock/seed.ts`, `frontend/src/services/mock/db.ts`, `frontend/src/services/mock/latency.ts`, `frontend/src/services/mock/db.test.ts`

**Interfaces:**
- Consumes: tipos de `contracts.ts`; `BRAND` de `brand.ts`.
- Produces:
  - `interface KeyValueStorage { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void }`, `createMemoryStorage(): KeyValueStorage`, `browserStorage(): KeyValueStorage`
  - `interface UserRecord extends Omit<User, "unlockedAccessoryIds"> { passwordHash: string; unlockedAccessoryIds: string[] }`
  - `interface PostRecord { id; authorId; sessionId; subjectId; type; title; content; mediaUrl; mediaDurationSec; createdAt; seedLikeCount: number }`
  - `interface CommentRecord { id; postId; authorId; parentId; content; createdAt }`
  - `interface CoinTransaction { id; userId; amount; reason: CoinReason; refId: string | null; createdAt }`
  - `interface DbState { version: 1; currentUserId: ID | null; users: UserRecord[]; sessions: StudySession[]; posts: PostRecord[]; comments: CommentRecord[]; likes: { userId: ID; postId: ID }[]; saves: { userId: ID; postId: ID }[]; transactions: CoinTransaction[] }`
  - `class MockDb { constructor(storage, seedFactory = buildSeed); read(): DbState; write<T>(fn: (draft: DbState) => T): T; reset(): void }`
  - `STORAGE_KEY = "dotstudy:v1"`
  - `SUBJECTS: Subject[]`, `ACCESSORIES: Accessory[]`, `buildSeed(now = Date.now()): DbState`, `DEMO_USER = { email: "demo@dotstudy.app", password: "dotstudy123" }`, `hashPassword(email, password): Promise<string>`
  - `latency(range?: [number, number]): Promise<void>` e `newId(prefix): string`

- [ ] **Step 1: Testes do banco (falhando)**

`frontend/src/services/mock/db.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MockDb, STORAGE_KEY } from "./db";
import { createMemoryStorage } from "./storage";
import { ACCESSORIES, SUBJECTS, buildSeed } from "./seed";

describe("MockDb", () => {
  it("cria o banco a partir do seed quando está vazio e persiste", () => {
    const storage = createMemoryStorage();
    const db = new MockDb(storage);
    const state = db.read();
    expect(state.version).toBe(1);
    expect(state.users.some((u) => u.email === "demo@dotstudy.app")).toBe(true);
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!).version).toBe(1);
  });

  it("recria o seed quando o JSON está corrompido", () => {
    const storage = createMemoryStorage();
    storage.setItem(STORAGE_KEY, "{not json");
    expect(new MockDb(storage).read().users.length).toBeGreaterThan(0);
  });

  it("recria o seed quando a versão é diferente ou falta campo", () => {
    const storage = createMemoryStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 99, users: [] }));
    expect(new MockDb(storage).read().version).toBe(1);
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, users: [] }));
    expect(new MockDb(storage).read().posts.length).toBeGreaterThan(0);
  });

  it("write aplica a mudança e salva; reset volta ao seed", () => {
    const storage = createMemoryStorage();
    const db = new MockDb(storage);
    db.write((s) => { s.currentUserId = "x"; });
    expect(new MockDb(storage).read().currentUserId).toBe("x");
    db.reset();
    expect(db.read().currentUserId).toBeNull();
  });

  it("read devolve cópia (mutar não altera o banco)", () => {
    const db = new MockDb(createMemoryStorage());
    db.read().users.length = 0;
    expect(db.read().users.length).toBeGreaterThan(0);
  });
});

describe("seed", () => {
  it("tem os 5 assuntos com 6 temas e os 10 acessórios do protótipo", () => {
    expect(SUBJECTS.map((s) => s.name)).toEqual(["Matemática", "Física", "História", "Português", "Programação"]);
    expect(SUBJECTS.every((s) => s.themes.length === 6)).toBe(true);
    expect(ACCESSORIES).toHaveLength(10);
  });
  it("usuário demo começa com 840 moedas e chapéu + óculos", () => {
    const demo = buildSeed().users.find((u) => u.email === "demo@dotstudy.app")!;
    expect(demo.coins).toBe(840);
    expect(demo.unlockedAccessoryIds).toEqual(["hat", "glasses"]);
  });
  it("gera ranking em todos os assuntos", () => {
    const seed = buildSeed();
    for (const subject of SUBJECTS) {
      expect(seed.sessions.some((s) => s.subjectId === subject.id && s.completedCycles > 0)).toBe(true);
    }
  });
});
```

Run: `npm test -- db`
Expected: FAIL (módulos inexistentes).

- [ ] **Step 2: `storage.ts` e `latency.ts`**

```ts
// storage.ts
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function createMemoryStorage(): KeyValueStorage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

export function browserStorage(): KeyValueStorage {
  return window.localStorage;
}
```

```ts
// latency.ts
export function latency(range: [number, number] = [100, 300]): Promise<void> {
  const [min, max] = range;
  if (max <= 0) return Promise.resolve();
  const ms = min + Math.random() * (max - min);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}
```

- [ ] **Step 3: `seed.ts`**

Construir a partir das constantes do protótipo em `frontend/src/app/App.tsx` (`SUBJECTS`, `THEMES_BY_SUBJECT`, `ACCESSORIES_LIST`, `INITIAL_ARTICLES`, `INITIAL_COMMENTS`, `INITIAL_SESSIONS`, `RANKINGS`). Código completo:

```ts
import type { Accessory, Subject, StudySession } from "@/services/contracts";
import { BRAND } from "@/domain/brand";
import type { CommentRecord, DbState, PostRecord, UserRecord } from "./db";

const THEMES: Record<number, string[]> = {
  1: ["Álgebra Linear", "Cálculo Diferencial", "Geometria Analítica", "Probabilidade", "Matrizes e Determinantes", "Funções de Múltiplas Variáveis"],
  2: ["Mecânica Clássica", "Eletromagnetismo", "Termodinâmica", "Óptica", "Física Quântica", "Relatividade Especial"],
  3: ["Brasil Colônia", "Segunda Guerra Mundial", "Revolução Industrial", "Idade Média", "Revolução Francesa", "Primeira República Brasileira"],
  4: ["Análise Sintática", "Literatura Brasileira", "Redação Dissertativa", "Figuras de Linguagem", "Modernismo", "Concordância Verbal e Nominal"],
  5: ["Algoritmos", "Desenvolvimento Web", "Banco de Dados", "Machine Learning", "Estruturas de Dados", "Sistemas Operacionais"],
};

const SUBJECT_BASE = [
  { id: 1, name: "Matemática", icon: "sigma", color: BRAND.teal },
  { id: 2, name: "Física", icon: "atom", color: BRAND.yellow },
  { id: 3, name: "História", icon: "hourglass", color: BRAND.red },
  { id: 4, name: "Português", icon: "pen-tool", color: BRAND.purple },
  { id: 5, name: "Programação", icon: "code", color: BRAND.green },
] as const;

export const SUBJECTS: Subject[] = SUBJECT_BASE.map((s) => ({
  ...s,
  themes: THEMES[s.id].map((title, i) => ({ id: s.id * 100 + i + 1, title, subjectId: s.id })),
}));

export const ACCESSORIES: Accessory[] = [
  { id: "hat", name: "Chapéu de Formatura", cost: 500 },
  { id: "glasses", name: "Óculos Nerd", cost: 300 },
  { id: "crown", name: "Coroa Dourada", cost: 1200 },
  { id: "halo", name: "Auréola", cost: 800 },
  { id: "bow", name: "Laço Rosa", cost: 250 },
  { id: "horns", name: "Chifres", cost: 450 },
  { id: "bowler", name: "Chapéu Coco", cost: 600 },
  { id: "witch", name: "Chapéu de Bruxa", cost: 750 },
  { id: "party", name: "Chapéu de Festa", cost: 400 },
  { id: "shades", name: "Óculos Escuros", cost: 350 },
];

export const DEMO_USER = { email: "demo@dotstudy.app", password: "dotstudy123", name: "Guilherme" } as const;

/** Hash SHA-256 (hex) — é mock, mas a senha não fica em texto puro no navegador. */
export async function hashPassword(email: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(`dotstudy:${email.trim().toLowerCase()}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Hash pré-calculado de DEMO_USER (hashPassword("demo@dotstudy.app", "dotstudy123")).
// O teste de auth (Task 5) confere que este valor bate com hashPassword.
export const DEMO_PASSWORD_HASH = "999ce4586f06f6f721ebca3eee099d952587ff21b8ea1415f2d8f03895963b77";

const COMMUNITY: { id: string; name: string; dotColor: string; accessory: string | null }[] = [
  { id: "u_ana", name: "Ana Clara M.", dotColor: BRAND.purple, accessory: "hat" },
  { id: "u_pedro", name: "Pedro Lima", dotColor: BRAND.teal, accessory: "glasses" },
  { id: "u_beatriz", name: "Beatriz Santos", dotColor: BRAND.yellow, accessory: null },
  { id: "u_lucasf", name: "Lucas Ferreira", dotColor: BRAND.green, accessory: "crown" },
  { id: "u_rafaelc", name: "Rafael Costa", dotColor: BRAND.teal, accessory: "crown" },
  { id: "u_carla", name: "Carla Nunes", dotColor: BRAND.green, accessory: "glasses" },
  { id: "u_marina", name: "Marina Reis", dotColor: BRAND.yellow, accessory: "glasses" },
  { id: "u_camila", name: "Camila Duarte", dotColor: BRAND.purple, accessory: "bow" },
];

// Ciclos históricos por assunto → pontuação = ciclos × 10 (+ 30 por post). Valores baixos para
// que uma conta nova consiga subir no ranking durante a demo.
const COMMUNITY_CYCLES: Record<string, Partial<Record<number, number>>> = {
  u_ana: { 1: 48, 5: 20 },
  u_pedro: { 3: 30, 5: 60 },
  u_beatriz: { 3: 36 },
  u_lucasf: { 2: 51, 5: 55 },
  u_rafaelc: { 1: 42, 4: 33 },
  u_carla: { 1: 36 },
  u_marina: { 2: 43 },
  u_camila: { 4: 41 },
};

export function buildSeed(now: number = Date.now()): DbState {
  const iso = (msAgo: number) => new Date(now - msAgo).toISOString();
  const H = 3_600_000;
  const D = 24 * H;
  const demoId = "u_demo";

  const users: UserRecord[] = [
    {
      id: demoId, name: DEMO_USER.name, email: DEMO_USER.email, passwordHash: DEMO_PASSWORD_HASH,
      coins: 840, dotColor: BRAND.teal, activeAccessoryId: null, unlockedAccessoryIds: ["hat", "glasses"], createdAt: iso(30 * D),
    },
    ...COMMUNITY.map((c) => ({
      id: c.id, name: c.name, email: `${c.id.slice(2)}@exemplo.dotstudy.app`, passwordHash: "seed-sem-login",
      coins: 0, dotColor: c.dotColor, activeAccessoryId: c.accessory,
      unlockedAccessoryIds: c.accessory ? [c.accessory] : [], createdAt: iso(60 * D),
    })),
  ];

  const session = (id: string, userId: string, subjectId: number | null, themeTitle: string | null, focus: number, cycles: number, msAgo: number): StudySession => {
    const theme = subjectId ? SUBJECTS[subjectId - 1].themes.find((t) => t.title === themeTitle) ?? null : null;
    return {
      id, userId, mode: subjectId ? "challenge" : "free", subjectId, themeId: theme?.id ?? null,
      label: subjectId ? null : themeTitle, focusMinutes: focus, breakMinutes: subjectId ? 0 : 5,
      plannedCycles: cycles, completedCycles: cycles, notes: "", status: "completed",
      startedAt: iso(msAgo + focus * cycles * 60_000), lastCycleAt: iso(msAgo), finishedAt: iso(msAgo), rewardedPostId: null,
    };
  };

  const sessions: StudySession[] = [
    session("h1", demoId, 1, "Cálculo Diferencial", 25, 1, 1 * H),
    session("h2", demoId, 5, "Algoritmos", 25, 1, 3 * H),
    session("h3", demoId, null, "Revisão geral", 50, 1, 5 * H),
    session("h4", demoId, 2, "Eletromagnetismo", 25, 1, 1 * D),
    session("h5", demoId, 1, "Álgebra Linear", 30, 1, 1 * D + H),
    session("h6", demoId, 4, "Literatura Brasileira", 25, 1, 1 * D + 2 * H),
    session("h7", demoId, 5, "Desenvolvimento Web", 45, 1, 2 * D),
    session("h8", demoId, 3, "Revolução Industrial", 25, 1, 2 * D + H),
    session("h9", demoId, 2, "Mecânica Clássica", 25, 1, 3 * D),
    session("h10", demoId, null, null, 25, 1, 3 * D + H),
    session("h11", demoId, 1, "Probabilidade", 25, 1, 4 * D),
    session("h12", demoId, 5, "Machine Learning", 50, 1, 5 * D),
  ];
  for (const [userId, bySubject] of Object.entries(COMMUNITY_CYCLES)) {
    for (const [subjectId, cycles] of Object.entries(bySubject)) {
      const sid = Number(subjectId);
      sessions.push(session(`seed_${userId}_${sid}`, userId, sid, SUBJECTS[sid - 1].themes[0].title, 25, cycles!, 7 * D));
    }
  }

  const post = (p: Omit<PostRecord, "mediaUrl" | "mediaDurationSec" | "sessionId"> & { mediaDurationSec?: number }): PostRecord => ({
    sessionId: null, mediaUrl: null, mediaDurationSec: p.mediaDurationSec ?? null, ...p,
  });
  const posts: PostRecord[] = [
    post({ id: "p1", authorId: "u_ana", subjectId: 1, type: "text", title: "Como eu finalmente entendi Integrais",
      content: "Depois de 3 semanas lutando com cálculo, encontrei uma abordagem visual que mudou tudo. O segredo estava em pensar geometricamente antes de algebricamente...",
      createdAt: iso(2 * H), seedLikeCount: 47 }),
    post({ id: "p2", authorId: "u_pedro", subjectId: 5, type: "text", title: "Por que aprendi algoritmos antes de frameworks",
      content: "Muita gente pula direto para React ou Django. Mas estudar algoritmos primeiro transformou minha forma de resolver problemas de verdade...",
      createdAt: iso(5 * H), seedLikeCount: 88 }),
    post({ id: "p3", authorId: "u_beatriz", subjectId: 3, type: "audio", title: "A Revolução Industrial e o que ela ainda nos ensina",
      content: "Reflexões sobre os padrões que se repetem na era digital", createdAt: iso(1 * D), seedLikeCount: 34, mediaDurationSec: 134 }),
    post({ id: "p4", authorId: "u_lucasf", subjectId: 2, type: "video", title: "Eletromagnetismo desmistificado",
      content: "Explicando campos e forças de forma visual e intuitiva", createdAt: iso(2 * D), seedLikeCount: 61, mediaDurationSec: 68 }),
  ];

  // Transcrição de INITIAL_COMMENTS do protótipo, no post p1 (o 1º comentário, que no protótipo era da
  // própria autora do post, passa para Carla Nunes).
  const comments: CommentRecord[] = [
    { id: "c1", postId: "p1", authorId: "u_carla", parentId: null, createdAt: iso(1 * H),
      content: "Adorei a abordagem visual! Eu sempre tive dificuldade com esse conceito e agora ficou muito mais claro." },
    { id: "c11", postId: "p1", authorId: "u_pedro", parentId: "c1", createdAt: iso(45 * 60_000),
      content: "Concordo! Pensar geometricamente antes de algebricamente faz toda a diferença." },
    { id: "c2", postId: "p1", authorId: "u_lucasf", parentId: null, createdAt: iso(2 * H),
      content: "Excelente conteúdo. Você conseguiu resumir em poucas palavras o que levei semanas para entender." },
    { id: "c21", postId: "p1", authorId: "u_beatriz", parentId: "c2", createdAt: iso(90 * 60_000),
      content: "Sério! Esse post merecia mais curtidas." },
  ];

  return {
    version: 1,
    currentUserId: null,
    users,
    sessions,
    posts,
    comments,
    likes: [{ userId: demoId, postId: "p2" }, { userId: demoId, postId: "p4" }],
    saves: [{ userId: demoId, postId: "p2" }],
    transactions: [],
  };
}
```

Observações:
- `seedLikeCount` de p2 e p4 é 1 a menos que no protótipo porque o demo já curtiu (o total exibido continua 89 e 62).

- [ ] **Step 4: Conferir o hash da senha demo**

Run:

```bash
node -e 'const c=require("crypto");console.log(c.createHash("sha256").update("dotstudy:demo@dotstudy.app:dotstudy123").digest("hex"))'
```

Expected: `999ce4586f06f6f721ebca3eee099d952587ff21b8ea1415f2d8f03895963b77` (igual a `DEMO_PASSWORD_HASH`).

- [ ] **Step 5: `db.ts`**

```ts
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
  return v.version === 1 && ARRAY_KEYS.every((k) => Array.isArray(v[k])) && (v.currentUserId === null || typeof v.currentUserId === "string");
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
    this.state = draft;
    this.persist(draft);
    return result;
  }

  reset(): void {
    this.state = this.seedFactory();
    this.persist(this.state);
  }
}
```

- [ ] **Step 6: Rodar testes**

Run: `npm test -- db && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/services/mock
git commit --author="Leonardo Tanaka Cortez <leonardotanaka0513@gmail.com>" \
  -m "feat: criar banco mock com seed do protótipo e recuperação de dados" \
  -m "Co-Authored-By: Felipe Wapf Fettback <wapffelipe@gmail.com>"
```

---

### Task 5: Serviços mock de autenticação e usuário

**Autor:** Felipe · **Coautor:** Lucas

**Files:**
- Create: `frontend/src/services/mock/context.ts`, `frontend/src/services/mock/auth.ts`, `frontend/src/services/mock/users.ts`, `frontend/src/services/mock/auth.test.ts`, `frontend/src/services/mock/users.test.ts`

**Interfaces:**
- Consumes: `MockDb`, `UserRecord`, `hashPassword`, `DEMO_PASSWORD_HASH`, `DEMO_USER`, `latency`, `newId`, `COINS`, `calculateStreak`, `sessionMinutes`, `localDayKey`.
- Produces:
  - `interface MockContext { db: MockDb; now: () => number; random: () => number; wait: () => Promise<void> }`
  - `requireUser(ctx): UserRecord` (lança `ServiceError("UNAUTHORIZED", "Faça login para continuar.")`), `toUser(record): User`, `toAuthor(record): Author`, `addCoins(draft, userId, amount, reason, refId, nowIso): number` (retorna saldo)
  - `createAuthService(ctx): AuthService`, `createUserService(ctx): UserService`
  - Helper de teste `createTestContext(overrides?)` exportado de `context.ts`: banco em memória com seed gerado no mesmo relógio (`now` padrão `2026-09-29T12:00:00.000Z`), `random` padrão `() => 0`, `wait` imediato.

- [ ] **Step 1: `context.ts`**

```ts
import { type Author, ServiceError, type User, type CoinReason, type ID } from "@/services/contracts";
import { MockDb, type DbState, type UserRecord } from "./db";
import { createMemoryStorage } from "./storage";
import { newId } from "./latency";
import { buildSeed } from "./seed";

export interface MockContext {
  db: MockDb;
  now: () => number;
  random: () => number;
  wait: () => Promise<void>;
}

/** Contexto de teste: banco em memória com seed gerado no MESMO relógio do contexto. */
export function createTestContext(overrides: Partial<MockContext> = {}): MockContext {
  const now = overrides.now ?? (() => Date.parse("2026-09-29T12:00:00.000Z"));
  return {
    db: overrides.db ?? new MockDb(createMemoryStorage(), () => buildSeed(now())),
    now,
    random: overrides.random ?? (() => 0),
    wait: overrides.wait ?? (async () => {}),
  };
}

export function findCurrentUser(state: DbState): UserRecord | null {
  return state.users.find((u) => u.id === state.currentUserId) ?? null;
}

export function requireUser(state: DbState): UserRecord {
  const user = findCurrentUser(state);
  if (!user) throw new ServiceError("UNAUTHORIZED", "Faça login para continuar.");
  return user;
}

export function toUser({ passwordHash: _hash, ...user }: UserRecord): User {
  return structuredClone(user);
}

export function toAuthor(u: UserRecord): Author {
  return { id: u.id, name: u.name, dotColor: u.dotColor, activeAccessoryId: u.activeAccessoryId };
}

export function addCoins(draft: DbState, userId: ID, amount: number, reason: CoinReason, refId: ID | null, nowIso: string): number {
  const user = draft.users.find((u) => u.id === userId)!;
  user.coins += amount;
  draft.transactions.push({ id: newId("tx"), userId, amount, reason, refId, createdAt: nowIso });
  return user.coins;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
```

- [ ] **Step 2: Testes de auth (falhando)**

`frontend/src/services/mock/auth.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createAuthService } from "./auth";
import { createTestContext } from "./context";
import { DEMO_PASSWORD_HASH, DEMO_USER, hashPassword } from "./seed";

describe("AuthService (mock)", () => {
  it("hash da senha demo bate com o seed", async () => {
    expect(await hashPassword(DEMO_USER.email, DEMO_USER.password)).toBe(DEMO_PASSWORD_HASH);
  });

  it("login do usuário demo", async () => {
    const auth = createAuthService(createTestContext());
    const user = await auth.login({ email: DEMO_USER.email, password: DEMO_USER.password });
    expect(user.name).toBe("Guilherme");
    expect(await auth.me()).toEqual(user);
  });

  it("login ignora maiúsculas e espaços no email", async () => {
    const auth = createAuthService(createTestContext());
    await expect(auth.login({ email: "  DEMO@dotstudy.APP ", password: "dotstudy123" })).resolves.toMatchObject({ name: "Guilherme" });
  });

  it("senha errada dá INVALID_CREDENTIALS", async () => {
    const auth = createAuthService(createTestContext());
    await expect(auth.login({ email: DEMO_USER.email, password: "x" })).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
  });

  it("cadastro cria usuário com 250 moedas de boas-vindas e já loga", async () => {
    const ctx = createTestContext();
    const auth = createAuthService(ctx);
    const user = await auth.register({ name: "Nova Pessoa", email: " Nova@Teste.com ", password: "segredo12" });
    expect(user).toMatchObject({ name: "Nova Pessoa", email: "nova@teste.com", coins: 250, unlockedAccessoryIds: [] });
    expect(ctx.db.read().transactions).toEqual([expect.objectContaining({ userId: user.id, amount: 250, reason: "welcome" })]);
    expect((await auth.me())?.id).toBe(user.id);
  });

  it("cadastro com email existente (qualquer caixa) dá EMAIL_TAKEN", async () => {
    const auth = createAuthService(createTestContext());
    await expect(auth.register({ name: "X", email: "Demo@DotStudy.app", password: "segredo12" })).rejects.toMatchObject({ code: "EMAIL_TAKEN" });
  });

  it("valida nome, email e senha", async () => {
    const auth = createAuthService(createTestContext());
    await expect(auth.register({ name: " ", email: "a@b.com", password: "segredo12" })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(auth.register({ name: "A", email: "sem-arroba", password: "segredo12" })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(auth.register({ name: "A", email: "a@b.com", password: "123" })).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("logout limpa a sessão", async () => {
    const auth = createAuthService(createTestContext());
    await auth.login({ email: DEMO_USER.email, password: DEMO_USER.password });
    await auth.logout();
    expect(await auth.me()).toBeNull();
  });
});
```

Run: `npm test -- auth` → Expected: FAIL.

- [ ] **Step 3: Implementar `auth.ts`**

```ts
import { type AuthService, ServiceError } from "@/services/contracts";
import { COINS } from "@/domain/rules";
import { addCoins, findCurrentUser, normalizeEmail, toUser, type MockContext } from "./context";
import { hashPassword } from "./seed";
import { newId } from "./latency";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD = 8;

export function validateCredentials(name: string | undefined, email: string, password: string | undefined) {
  if (name !== undefined && name.trim().length < 2) throw new ServiceError("VALIDATION", "Informe seu nome (mínimo 2 letras).");
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
      validateCredentials(name, normalized, password);
      const passwordHash = await hashPassword(normalized, password);
      return ctx.db.write((draft) => {
        if (draft.users.some((u) => u.email === normalized)) {
          throw new ServiceError("EMAIL_TAKEN", "Já existe uma conta com esse email.");
        }
        const nowIso = new Date(ctx.now()).toISOString();
        const record = {
          id: newId("u"), name: name.trim(), email: normalized, passwordHash, coins: 0,
          dotColor: "#22CFD5", activeAccessoryId: null, unlockedAccessoryIds: [], createdAt: nowIso,
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
```

Run: `npm test -- auth` → Expected: PASS.

- [ ] **Step 4: Testes de users (falhando)**

`frontend/src/services/mock/users.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createAuthService } from "./auth";
import { createTestContext } from "./context";
import { createUserService } from "./users";
import { DEMO_USER } from "./seed";

async function loggedIn(now = Date.parse("2026-09-29T12:00:00.000Z")) {
  const ctx = createTestContext({ now: () => now });
  await createAuthService(ctx).login({ email: DEMO_USER.email, password: DEMO_USER.password });
  return { ctx, users: createUserService(ctx) };
}

describe("UserService (mock)", () => {
  it("exige login", async () => {
    await expect(createUserService(createTestContext()).getStats()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("atualiza nome", async () => {
    const { users } = await loggedIn();
    expect((await users.updateProfile({ name: "  Gui  " })).name).toBe("Gui");
  });

  it("trocar email ou senha exige a senha atual correta", async () => {
    const { users } = await loggedIn();
    await expect(users.updateProfile({ newPassword: "novasenha1" })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(users.updateProfile({ newPassword: "novasenha1", currentPassword: "errada" })).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
    await expect(users.updateProfile({ email: "novo@x.com", currentPassword: "dotstudy123" })).resolves.toMatchObject({ email: "novo@x.com" });
  });

  it("não troca para email já usado", async () => {
    const { users } = await loggedIn();
    await expect(users.updateProfile({ email: "ana@exemplo.dotstudy.app", currentPassword: "dotstudy123" })).rejects.toMatchObject({ code: "EMAIL_TAKEN" });
  });

  it("depois de trocar email e senha, o login antigo deixa de funcionar e o novo funciona", async () => {
    const { ctx, users } = await loggedIn();
    await users.updateProfile({ email: "novo@x.com", currentPassword: "dotstudy123", newPassword: "novasenha1" });
    const auth = createAuthService(ctx);
    await expect(auth.login({ email: DEMO_USER.email, password: DEMO_USER.password })).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
    await expect(auth.login({ email: "novo@x.com", password: "novasenha1" })).resolves.toBeTruthy();
  });

  it("updateDot só aceita acessório desbloqueado (ou null)", async () => {
    const { users } = await loggedIn();
    await expect(users.updateDot({ activeAccessoryId: "crown" })).rejects.toMatchObject({ code: "NOT_OWNED" });
    expect((await users.updateDot({ activeAccessoryId: "hat", dotColor: "#A35BBF" }))).toMatchObject({ activeAccessoryId: "hat", dotColor: "#A35BBF" });
    expect((await users.updateDot({ activeAccessoryId: null })).activeAccessoryId).toBeNull();
  });

  it("getStats usa as sessões do seed", async () => {
    const { users } = await loggedIn();
    const stats = await users.getStats();
    expect(stats.completedCycles).toBe(12);
    expect(stats.totalMinutes).toBe(25 * 8 + 30 + 45 + 50 + 50);
    expect(stats.last7Days).toHaveLength(7);
    expect(stats.streakDays).toBeGreaterThanOrEqual(1);
  });
});
```

(Conferir `totalMinutes` somando `focusMinutes` das 12 sessões `h1..h12` do seed: 25×8 + 30 + 45 + 50 + 50 = 375.)

Run: `npm test -- users` → Expected: FAIL.

- [ ] **Step 5: Implementar `users.ts`**

```ts
import { ServiceError, type UserService } from "@/services/contracts";
import { calculateStreak, localDayKey, sessionMinutes } from "@/domain/rules";
import { normalizeEmail, requireUser, toUser, type MockContext } from "./context";
import { validateCredentials } from "./auth";
import { hashPassword } from "./seed";

export function createUserService(ctx: MockContext): UserService {
  return {
    async updateProfile({ name, email, currentPassword, newPassword }) {
      await ctx.wait();
      const current = requireUser(ctx.db.read());
      const nextEmail = email !== undefined ? normalizeEmail(email) : current.email;
      const sensitive = nextEmail !== current.email || newPassword !== undefined;
      if (name !== undefined) validateCredentials(name, nextEmail, undefined);
      if (sensitive) {
        validateCredentials(undefined, nextEmail, newPassword);
        if (!currentPassword) throw new ServiceError("VALIDATION", "Informe sua senha atual.");
        if ((await hashPassword(current.email, currentPassword)) !== current.passwordHash) {
          throw new ServiceError("INVALID_CREDENTIALS", "Senha atual incorreta.");
        }
      }
      const nextHash = sensitive ? await hashPassword(nextEmail, newPassword ?? currentPassword!) : current.passwordHash;
      return ctx.db.write((draft) => {
        if (draft.users.some((u) => u.id !== current.id && u.email === nextEmail)) {
          throw new ServiceError("EMAIL_TAKEN", "Já existe uma conta com esse email.");
        }
        const user = requireUser(draft);
        if (name !== undefined) user.name = name.trim();
        user.email = nextEmail;
        user.passwordHash = nextHash;
        return toUser(user);
      });
    },

    async updateDot({ dotColor, activeAccessoryId }) {
      await ctx.wait();
      return ctx.db.write((draft) => {
        const user = requireUser(draft);
        if (activeAccessoryId !== undefined && activeAccessoryId !== null && !user.unlockedAccessoryIds.includes(activeAccessoryId)) {
          throw new ServiceError("NOT_OWNED", "Você ainda não desbloqueou esse acessório.");
        }
        if (dotColor !== undefined) user.dotColor = dotColor;
        if (activeAccessoryId !== undefined) user.activeAccessoryId = activeAccessoryId;
        return toUser(user);
      });
    },

    async getStats() {
      await ctx.wait();
      const state = ctx.db.read();
      const user = requireUser(state);
      const mine = state.sessions.filter((s) => s.userId === user.id && s.completedCycles > 0);
      const now = ctx.now();
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        const key = localDayKey(d);
        const minutes = mine
          .filter((s) => localDayKey(new Date(s.lastCycleAt ?? s.startedAt)) === key)
          .reduce((sum, s) => sum + sessionMinutes(s), 0);
        return { date: key, minutes };
      });
      return {
        streakDays: calculateStreak(mine.map((s) => s.lastCycleAt ?? s.startedAt), now),
        totalMinutes: mine.reduce((sum, s) => sum + sessionMinutes(s), 0),
        completedCycles: mine.reduce((sum, s) => sum + s.completedCycles, 0),
        last7Days,
      };
    },
  };
}
```

- [ ] **Step 6: Rodar e commitar**

Run: `npm test -- mock && npm run typecheck && npm run lint` → Expected: PASS.

```bash
git add frontend/src/services/mock
git commit --author="Felipe Wapf Fettback <wapffelipe@gmail.com>" \
  -m "feat: implementar cadastro, login e perfil no serviço mock" \
  -m "Co-Authored-By: Lucas Rodrigues Grecco <79089727+lucvs07@users.noreply.github.com>"
```

---

### Task 6: Serviços mock de assuntos e sessões de estudo

**Autor:** Leonardo · **Coautor:** Lucas

**Files:**
- Create: `frontend/src/services/mock/subjects.ts`, `frontend/src/services/mock/sessions.ts`, `frontend/src/services/mock/sessions.test.ts`

**Interfaces:**
- Consumes: `MockContext`, `requireUser`, `addCoins`, `SUBJECTS`, `canCompleteCycle`, `COINS`.
- Produces: `createSubjectService(ctx): SubjectService`, `createSessionService(ctx): SessionService`, `pickIndex(random: () => number, length: number): number`.

- [ ] **Step 1: Testes (falhando)**

`frontend/src/services/mock/sessions.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createAuthService } from "./auth";
import { createTestContext, type MockContext } from "./context";
import { createSessionService } from "./sessions";
import { createSubjectService } from "./subjects";
import { DEMO_USER } from "./seed";

async function setup() {
  let now = Date.parse("2026-09-29T12:00:00.000Z");
  const ctx: MockContext = createTestContext({ now: () => now, random: () => 0.99 });
  await createAuthService(ctx).login({ email: DEMO_USER.email, password: DEMO_USER.password });
  return { ctx, sessions: createSessionService(ctx), advance: (ms: number) => { now += ms; } };
}

describe("SubjectService (mock)", () => {
  it("lista 5 assuntos e sorteia tema do assunto", async () => {
    const subjects = createSubjectService(createTestContext({ random: () => 0 }));
    expect(await subjects.list()).toHaveLength(5);
    expect(await subjects.randomTheme(2)).toMatchObject({ subjectId: 2, title: "Mecânica Clássica" });
    await expect(subjects.randomTheme(99)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("SessionService (mock)", () => {
  it("desafio com assunto aleatório sorteia assunto e tema, 1 ciclo sem pausa", async () => {
    const { sessions } = await setup();
    const s = await sessions.start({ mode: "challenge", subjectId: "random", focusMinutes: 25 });
    expect(s).toMatchObject({ mode: "challenge", subjectId: 5, plannedCycles: 1, breakMinutes: 0, status: "in_progress" });
    expect(s.themeId).toBe(506);
  });

  it("livre guarda rótulo, pausa e ciclos planejados", async () => {
    const { sessions } = await setup();
    const s = await sessions.start({ mode: "free", label: "Revisão", focusMinutes: 30, breakMinutes: 5, plannedCycles: 3 });
    expect(s).toMatchObject({ mode: "free", subjectId: null, label: "Revisão", plannedCycles: 3 });
  });

  it("valida durações (1–120 min) e ciclos (1–12)", async () => {
    const { sessions } = await setup();
    await expect(sessions.start({ mode: "challenge", subjectId: 1, focusMinutes: 0 })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(sessions.start({ mode: "free", label: null, focusMinutes: 25, breakMinutes: 5, plannedCycles: 0 })).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("concluir ciclo cedo demais é recusado; no tempo dá +10 moedas", async () => {
    const { ctx, sessions, advance } = await setup();
    const s = await sessions.start({ mode: "challenge", subjectId: 1, focusMinutes: 25 });
    advance(60_000);
    await expect(sessions.completeCycle(s.id)).rejects.toMatchObject({ code: "CYCLE_TOO_SOON" });
    advance(24 * 60_000);
    const { session, reward } = await sessions.completeCycle(s.id);
    expect(reward).toEqual({ coinsEarned: 10, balance: 850 });
    expect(session).toMatchObject({ completedCycles: 1, status: "completed" });
    expect(ctx.db.read().transactions.at(-1)).toMatchObject({ amount: 10, reason: "cycle", refId: s.id });
  });

  it("sessão livre só fecha no último ciclo", async () => {
    const { sessions, advance } = await setup();
    const s = await sessions.start({ mode: "free", label: null, focusMinutes: 10, breakMinutes: 2, plannedCycles: 2 });
    advance(10 * 60_000);
    expect((await sessions.completeCycle(s.id)).session.status).toBe("in_progress");
    advance(12 * 60_000);
    expect((await sessions.completeCycle(s.id)).session.status).toBe("completed");
    await expect(sessions.completeCycle(s.id)).rejects.toMatchObject({ code: "SESSION_CLOSED" });
  });

  it("iniciar nova sessão abandona a anterior em andamento (ex.: recarregou a página)", async () => {
    const { sessions, advance } = await setup();
    const old = await sessions.start({ mode: "challenge", subjectId: 1, focusMinutes: 25 });
    await sessions.start({ mode: "challenge", subjectId: 2, focusMinutes: 25 });
    advance(30 * 60_000);
    await expect(sessions.completeCycle(old.id)).rejects.toMatchObject({ code: "SESSION_CLOSED" });
    expect((await sessions.list()).find((s) => s.id === old.id)?.status).toBe("abandoned");
  });

  it("anotações e finalizar", async () => {
    const { sessions } = await setup();
    const s = await sessions.start({ mode: "challenge", subjectId: 1, focusMinutes: 25 });
    expect((await sessions.updateNotes(s.id, "limites e derivadas")).notes).toBe("limites e derivadas");
    expect((await sessions.finish(s.id, "abandoned")).status).toBe("abandoned");
  });

  it("não mexe em sessão de outro usuário", async () => {
    const { sessions } = await setup();
    await expect(sessions.updateNotes("seed_u_ana_1", "x")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("list devolve só as minhas, mais recentes primeiro", async () => {
    const { sessions } = await setup();
    const list = await sessions.list();
    expect(list.every((s) => s.userId === "u_demo")).toBe(true);
    expect(list[0].id).toBe("h1");
  });
});
```

Run: `npm test -- sessions` → Expected: FAIL.

- [ ] **Step 2: `subjects.ts`**

```ts
import { ServiceError, type SubjectService } from "@/services/contracts";
import type { MockContext } from "./context";
import { SUBJECTS } from "./seed";

export function pickIndex(random: () => number, length: number): number {
  return Math.min(length - 1, Math.floor(random() * length));
}

export function createSubjectService(ctx: MockContext): SubjectService {
  return {
    async list() {
      await ctx.wait();
      return structuredClone(SUBJECTS);
    },
    async randomTheme(subjectId) {
      await ctx.wait();
      const subject = SUBJECTS.find((s) => s.id === subjectId);
      if (!subject) throw new ServiceError("NOT_FOUND", "Assunto não encontrado.");
      return { ...subject.themes[pickIndex(ctx.random, subject.themes.length)] };
    },
  };
}
```

- [ ] **Step 3: `sessions.ts`**

```ts
import { ServiceError, type SessionService, type StudySession } from "@/services/contracts";
import { COINS, canCompleteCycle } from "@/domain/rules";
import { addCoins, requireUser, type MockContext } from "./context";
import type { DbState } from "./db";
import { newId } from "./latency";
import { SUBJECTS } from "./seed";
import { pickIndex } from "./subjects";

function assertRange(value: number, min: number, max: number, label: string) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new ServiceError("VALIDATION", `${label} deve estar entre ${min} e ${max}.`);
  }
}

function findMine(draft: DbState, sessionId: string): StudySession {
  const user = requireUser(draft);
  const session = draft.sessions.find((s) => s.id === sessionId && s.userId === user.id);
  if (!session) throw new ServiceError("NOT_FOUND", "Sessão não encontrada.");
  return session;
}

export function createSessionService(ctx: MockContext): SessionService {
  const nowIso = () => new Date(ctx.now()).toISOString();
  return {
    async start(input) {
      await ctx.wait();
      assertRange(input.focusMinutes, 1, 120, "O tempo de foco");
      if (input.mode === "free") {
        assertRange(input.breakMinutes, 1, 60, "A pausa");
        assertRange(input.plannedCycles, 1, 12, "O número de ciclos");
      }
      return ctx.db.write((draft) => {
        const user = requireUser(draft);
        for (const s of draft.sessions) {
          if (s.userId === user.id && s.status === "in_progress") {
            s.status = "abandoned";
            s.finishedAt = nowIso();
          }
        }
        let subjectId: number | null = null;
        let themeId: number | null = null;
        if (input.mode === "challenge") {
          const subject = input.subjectId === "random"
            ? SUBJECTS[pickIndex(ctx.random, SUBJECTS.length)]
            : SUBJECTS.find((s) => s.id === input.subjectId);
          if (!subject) throw new ServiceError("NOT_FOUND", "Assunto não encontrado.");
          subjectId = subject.id;
          themeId = subject.themes[pickIndex(ctx.random, subject.themes.length)].id;
        }
        const session: StudySession = {
          id: newId("s"), userId: user.id, mode: input.mode, subjectId, themeId,
          label: input.mode === "free" ? input.label?.trim() || null : null,
          focusMinutes: input.focusMinutes,
          breakMinutes: input.mode === "free" ? input.breakMinutes : 0,
          plannedCycles: input.mode === "free" ? input.plannedCycles : 1,
          completedCycles: 0, notes: "", status: "in_progress", startedAt: nowIso(),
          lastCycleAt: null, finishedAt: null, rewardedPostId: null,
        };
        draft.sessions.unshift(session);
        return structuredClone(session);
      });
    },

    async completeCycle(sessionId) {
      await ctx.wait();
      return ctx.db.write((draft) => {
        const session = findMine(draft, sessionId);
        const check = canCompleteCycle(session, ctx.now());
        if (!check.ok) {
          throw new ServiceError(check.reason, check.reason === "CYCLE_TOO_SOON"
            ? "Esse ciclo ainda não terminou."
            : "Essa sessão já foi encerrada.");
        }
        session.completedCycles += 1;
        session.lastCycleAt = nowIso();
        if (session.completedCycles === session.plannedCycles) {
          session.status = "completed";
          session.finishedAt = nowIso();
        }
        const balance = addCoins(draft, session.userId, COINS.cycle, "cycle", session.id, nowIso());
        return { session: structuredClone(session), reward: { coinsEarned: COINS.cycle, balance } };
      });
    },

    async updateNotes(sessionId, notes) {
      await ctx.wait();
      return ctx.db.write((draft) => {
        const session = findMine(draft, sessionId);
        session.notes = notes.slice(0, 5000);
        return structuredClone(session);
      });
    },

    async finish(sessionId, status) {
      await ctx.wait();
      return ctx.db.write((draft) => {
        const session = findMine(draft, sessionId);
        if (session.status === "in_progress") {
          session.status = status;
          session.finishedAt = nowIso();
        }
        return structuredClone(session);
      });
    },

    async list() {
      await ctx.wait();
      const state = ctx.db.read();
      const user = requireUser(state);
      return state.sessions
        .filter((s) => s.userId === user.id)
        .sort((a, b) => (b.lastCycleAt ?? b.startedAt).localeCompare(a.lastCycleAt ?? a.startedAt));
    },
  };
}
```

- [ ] **Step 4: Rodar e commitar**

Run: `npm test -- sessions && npm run typecheck && npm run lint` → Expected: PASS.

```bash
git add frontend/src/services/mock
git commit --author="Leonardo Tanaka Cortez <leonardotanaka0513@gmail.com>" \
  -m "feat: implementar sessões de estudo com regra anti-trapaça no mock" \
  -m "Co-Authored-By: Lucas Rodrigues Grecco <79089727+lucvs07@users.noreply.github.com>"
```

---

### Task 7: Serviços mock de posts, ranking e loja

**Autor:** Felipe · **Coautor:** Leonardo

**Files:**
- Create: `frontend/src/services/mock/posts.ts`, `frontend/src/services/mock/rankings.ts`, `frontend/src/services/mock/shop.ts`, `frontend/src/services/mock/posts.test.ts`, `frontend/src/services/mock/rankings-shop.test.ts`

**Interfaces:**
- Consumes: `MockContext`, `requireUser`, `toAuthor`, `toUser`, `addCoins`, `COINS`, `computeSubjectScores`, `rankEntries`, `ACCESSORIES`.
- Produces: `createPostService(ctx)`, `createRankingService(ctx)`, `createShopService(ctx)`. Paginação: cursor = `createdAt|id` do último item; `limit` padrão 10, máx. 50.

- [ ] **Step 1: Testes de posts (falhando)**

`frontend/src/services/mock/posts.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createAuthService } from "./auth";
import { createTestContext } from "./context";
import { createPostService } from "./posts";
import { createSessionService } from "./sessions";
import { DEMO_USER } from "./seed";

async function setup() {
  let now = Date.parse("2026-09-29T12:00:00.000Z");
  const ctx = createTestContext({ now: () => now });
  await createAuthService(ctx).login({ email: DEMO_USER.email, password: DEMO_USER.password });
  return { ctx, posts: createPostService(ctx), sessions: createSessionService(ctx), advance: (ms: number) => { now += ms; } };
}

describe("PostService (mock)", () => {
  it("lista o feed do mais novo para o mais antigo com contadores do seed", async () => {
    const { posts } = await setup();
    const page = await posts.list();
    expect(page.items.map((p) => p.id)).toEqual(["p1", "p2", "p3", "p4"]);
    expect(page.items[1]).toMatchObject({ likeCount: 89, likedByMe: true, savedByMe: true });
    expect(page.nextCursor).toBeNull();
  });

  it("filtra por assunto, tipo e salvos; pagina com cursor", async () => {
    const { posts } = await setup();
    expect((await posts.list({ subjectId: 5 })).items.map((p) => p.id)).toEqual(["p2"]);
    expect((await posts.list({ type: "audio" })).items.map((p) => p.id)).toEqual(["p3"]);
    expect((await posts.list({ savedOnly: true })).items.map((p) => p.id)).toEqual(["p2"]);
    const first = await posts.list({ limit: 2 });
    expect(first.items).toHaveLength(2);
    const second = await posts.list({ limit: 2, cursor: first.nextCursor });
    expect(second.items.map((p) => p.id)).toEqual(["p3", "p4"]);
  });

  it("publicar a partir da sessão concluída dá +30 uma única vez", async () => {
    const { posts, sessions, advance } = await setup();
    const s = await sessions.start({ mode: "challenge", subjectId: 1, focusMinutes: 25 });
    advance(25 * 60_000);
    await sessions.completeCycle(s.id);
    const first = await posts.create({ sessionId: s.id, type: "text", title: "Aprendi limites", content: "..." });
    expect(first.reward).toEqual({ coinsEarned: 30, balance: 880 });
    expect(first.post).toMatchObject({ subjectId: 1, likeCount: 0, author: { name: "Guilherme" } });
    const second = await posts.create({ sessionId: s.id, type: "text", title: "De novo", content: "" });
    expect(second.reward).toBeNull();
    expect((await posts.list()).items[0].id).toBe(second.post.id);
  });

  it("publicar sem sessão ou de sessão sem ciclo concluído não dá recompensa", async () => {
    const { posts, sessions } = await setup();
    expect((await posts.create({ sessionId: null, type: "text", title: "Solto", content: "" })).reward).toBeNull();
    const s = await sessions.start({ mode: "challenge", subjectId: 1, focusMinutes: 25 });
    expect((await posts.create({ sessionId: s.id, type: "text", title: "Cedo", content: "" })).reward).toBeNull();
  });

  it("valida título e mídia", async () => {
    const { posts } = await setup();
    await expect(posts.create({ sessionId: null, type: "text", title: "ab", content: "" })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(posts.create({ sessionId: null, type: "audio", title: "Áudio", content: "" })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(posts.create({ sessionId: null, type: "audio", title: "Áudio", content: "", mediaUrl: "idb://x", mediaDurationSec: 301 })).rejects.toMatchObject({ code: "MEDIA_TOO_LONG" });
  });

  it("curtir/descurtir e salvar/remover são idempotentes", async () => {
    const { posts } = await setup();
    expect((await posts.like("p1")).likeCount).toBe(48);
    expect((await posts.like("p1")).likeCount).toBe(48);
    expect((await posts.unlike("p1")).likeCount).toBe(47);
    expect((await posts.save("p1")).savedByMe).toBe(true);
    expect((await posts.unsave("p1")).savedByMe).toBe(false);
    await expect(posts.like("nao-existe")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("comentários com respostas aninhadas e contador", async () => {
    const { posts } = await setup();
    const c = await posts.addComment("p2", { content: "Ótimo post!" });
    await posts.addComment("p2", { content: "Concordo", parentId: c.id });
    const list = await posts.listComments("p2");
    const mine = list.find((x) => x.id === c.id)!;
    expect(mine.replies.map((r) => r.content)).toEqual(["Concordo"]);
    expect((await posts.get("p2")).commentCount).toBe(2);
    await expect(posts.addComment("p2", { content: "   " })).rejects.toMatchObject({ code: "VALIDATION" });
  });
});
```

Run: `npm test -- posts` → Expected: FAIL.

- [ ] **Step 2: Implementar `posts.ts`**

```ts
import { MEDIA_LIMITS, ServiceError, type Comment, type Post, type PostService } from "@/services/contracts";
import { COINS } from "@/domain/rules";
import { addCoins, findCurrentUser, requireUser, toAuthor, type MockContext } from "./context";
import type { CommentRecord, DbState, PostRecord } from "./db";
import { newId } from "./latency";

function cursorOf(p: PostRecord) {
  return `${p.createdAt}|${p.id}`;
}

function toPost(state: DbState, p: PostRecord, meId: string | null): Post {
  const author = state.users.find((u) => u.id === p.authorId)!;
  const likes = state.likes.filter((l) => l.postId === p.id);
  return {
    id: p.id, author: toAuthor(author), sessionId: p.sessionId, subjectId: p.subjectId, type: p.type,
    title: p.title, content: p.content, mediaUrl: p.mediaUrl, mediaDurationSec: p.mediaDurationSec, createdAt: p.createdAt,
    likeCount: p.seedLikeCount + likes.length,
    commentCount: state.comments.filter((c) => c.postId === p.id).length,
    likedByMe: likes.some((l) => l.userId === meId),
    savedByMe: state.saves.some((s) => s.postId === p.id && s.userId === meId),
  };
}

function findPost(state: DbState, id: string): PostRecord {
  const post = state.posts.find((p) => p.id === id);
  if (!post) throw new ServiceError("NOT_FOUND", "Post não encontrado.");
  return post;
}

function buildTree(state: DbState, records: CommentRecord[]): Comment[] {
  const byId = new Map<string, Comment>();
  for (const r of records) {
    const author = state.users.find((u) => u.id === r.authorId)!;
    byId.set(r.id, { id: r.id, postId: r.postId, author: toAuthor(author), parentId: r.parentId, content: r.content, createdAt: r.createdAt, replies: [] });
  }
  const roots: Comment[] = [];
  for (const c of byId.values()) {
    const parent = c.parentId ? byId.get(c.parentId) : undefined;
    (parent ? parent.replies : roots).push(c);
  }
  return roots;
}

export function createPostService(ctx: MockContext): PostService {
  const nowIso = () => new Date(ctx.now()).toISOString();

  const toggle = async (id: string, list: "likes" | "saves", on: boolean): Promise<Post> => {
    await ctx.wait();
    return ctx.db.write((draft) => {
      const me = requireUser(draft);
      const post = findPost(draft, id);
      draft[list] = draft[list].filter((x) => !(x.postId === id && x.userId === me.id));
      if (on) draft[list].push({ userId: me.id, postId: id });
      return toPost(draft, post, me.id);
    });
  };

  return {
    async list(filter = {}) {
      await ctx.wait();
      const state = ctx.db.read();
      const me = requireUser(state);
      const limit = Math.min(Math.max(filter.limit ?? 10, 1), 50);
      const sorted = state.posts
        .filter((p) => filter.subjectId === undefined || p.subjectId === filter.subjectId)
        .filter((p) => filter.type === undefined || p.type === filter.type)
        .filter((p) => !filter.savedOnly || state.saves.some((s) => s.postId === p.id && s.userId === me.id))
        .sort((a, b) => cursorOf(b).localeCompare(cursorOf(a)));
      const start = filter.cursor ? sorted.findIndex((p) => cursorOf(p) < filter.cursor!) : 0;
      const slice = start < 0 ? [] : sorted.slice(start, start + limit);
      const hasMore = start >= 0 && start + limit < sorted.length;
      return { items: slice.map((p) => toPost(state, p, me.id)), nextCursor: hasMore ? cursorOf(slice[slice.length - 1]) : null };
    },

    async get(id) {
      await ctx.wait();
      const state = ctx.db.read();
      return toPost(state, findPost(state, id), findCurrentUser(state)?.id ?? null);
    },

    async create(input) {
      await ctx.wait();
      const title = input.title.trim();
      if (title.length < 3 || title.length > 120) throw new ServiceError("VALIDATION", "O título precisa ter entre 3 e 120 caracteres.");
      if (input.content.length > 20_000) throw new ServiceError("VALIDATION", "O texto passou do limite de 20 mil caracteres.");
      if (input.type !== "text") {
        if (!input.mediaUrl || !input.mediaDurationSec) throw new ServiceError("VALIDATION", "Grave ou envie a mídia antes de publicar.");
        if (input.mediaDurationSec > MEDIA_LIMITS[input.type].maxSeconds) {
          throw new ServiceError("MEDIA_TOO_LONG", "A mídia passou do tempo máximo permitido.");
        }
      }
      return ctx.db.write((draft) => {
        const me = requireUser(draft);
        const session = input.sessionId ? draft.sessions.find((s) => s.id === input.sessionId && s.userId === me.id) : undefined;
        if (input.sessionId && !session) throw new ServiceError("NOT_FOUND", "Sessão não encontrada.");
        const record: PostRecord = {
          id: newId("p"), authorId: me.id, sessionId: session?.id ?? null, subjectId: session?.subjectId ?? null,
          type: input.type, title, content: input.content.trim(),
          mediaUrl: input.type === "text" ? null : input.mediaUrl!, mediaDurationSec: input.type === "text" ? null : input.mediaDurationSec!,
          createdAt: nowIso(), seedLikeCount: 0,
        };
        draft.posts.push(record);
        let reward = null;
        if (session && session.completedCycles > 0 && session.rewardedPostId === null) {
          session.rewardedPostId = record.id;
          reward = { coinsEarned: COINS.post, balance: addCoins(draft, me.id, COINS.post, "post", record.id, nowIso()) };
        }
        return { post: toPost(draft, record, me.id), reward };
      });
    },

    like: (id) => toggle(id, "likes", true),
    unlike: (id) => toggle(id, "likes", false),
    save: (id) => toggle(id, "saves", true),
    unsave: (id) => toggle(id, "saves", false),

    async listComments(postId) {
      await ctx.wait();
      const state = ctx.db.read();
      findPost(state, postId);
      const records = state.comments.filter((c) => c.postId === postId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return buildTree(state, records);
    },

    async addComment(postId, { content, parentId = null }) {
      await ctx.wait();
      const text = content.trim();
      if (!text || text.length > 2000) throw new ServiceError("VALIDATION", "Escreva um comentário de até 2000 caracteres.");
      return ctx.db.write((draft) => {
        const me = requireUser(draft);
        findPost(draft, postId);
        if (parentId && !draft.comments.some((c) => c.id === parentId && c.postId === postId)) {
          throw new ServiceError("NOT_FOUND", "Comentário não encontrado.");
        }
        const record: CommentRecord = { id: newId("c"), postId, authorId: me.id, parentId, content: text, createdAt: nowIso() };
        draft.comments.push(record);
        return buildTree(draft, [record])[0];
      });
    },
  };
}
```

Run: `npm test -- posts` → Expected: PASS.

- [ ] **Step 3: Testes de ranking e loja (falhando)**

`frontend/src/services/mock/rankings-shop.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createAuthService } from "./auth";
import { createTestContext } from "./context";
import { createRankingService } from "./rankings";
import { createShopService } from "./shop";
import { DEMO_USER } from "./seed";

async function setup() {
  const ctx = createTestContext();
  await createAuthService(ctx).login({ email: DEMO_USER.email, password: DEMO_USER.password });
  return { ctx, rankings: createRankingService(ctx), shop: createShopService(ctx) };
}

describe("RankingService (mock)", () => {
  it("calcula o ranking de Matemática a partir do seed e marca o usuário atual", async () => {
    const { rankings } = await setup();
    const list = await rankings.bySubject(1);
    expect(list.slice(0, 3).map((e) => [e.user.name, e.score])).toEqual([
      ["Ana Clara M.", 510],
      ["Rafael Costa", 420],
      ["Carla Nunes", 360],
    ]);
    expect(list.find((e) => e.isMe)).toMatchObject({ user: { name: "Guilherme" }, score: 30 });
  });
});

describe("ShopService (mock)", () => {
  it("lista os 10 acessórios", async () => {
    const { shop } = await setup();
    expect(await shop.listAccessories()).toHaveLength(10);
  });

  it("compra debita, desbloqueia e registra transação", async () => {
    const { ctx, shop } = await setup();
    const user = await shop.purchase("bow");
    expect(user.coins).toBe(590);
    expect(user.unlockedAccessoryIds).toContain("bow");
    expect(ctx.db.read().transactions.at(-1)).toMatchObject({ amount: -250, reason: "purchase", refId: "bow" });
  });

  it("recusa já desbloqueado, saldo insuficiente e inexistente", async () => {
    const { shop } = await setup();
    await expect(shop.purchase("hat")).rejects.toMatchObject({ code: "ALREADY_OWNED" });
    await expect(shop.purchase("crown")).rejects.toMatchObject({ code: "INSUFFICIENT_COINS" });
    await expect(shop.purchase("nada")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("clique duplo: duas compras em paralelo debitam uma vez só", async () => {
    const ctx = createTestContext({ wait: () => new Promise((r) => setTimeout(r, 5)) });
    await createAuthService(ctx).login({ email: DEMO_USER.email, password: DEMO_USER.password });
    const shop = createShopService(ctx);
    const results = await Promise.allSettled([shop.purchase("bow"), shop.purchase("bow")]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(ctx.db.read().users.find((u) => u.id === "u_demo")!.coins).toBe(590);
  });
});
```

(Ana: 48 ciclos × 10 = 480 + 1 post × 30 = 510. Rafael Costa: 42 × 10 = 420. Carla: 360. Demo em Matemática: sessões h1, h5, h11 = 3 ciclos × 10 = 30.)

Run: `npm test -- rankings-shop` → Expected: FAIL.

- [ ] **Step 4: `rankings.ts` e `shop.ts`**

```ts
// rankings.ts
import type { RankingService } from "@/services/contracts";
import { computeSubjectScores, rankEntries } from "@/domain/rules";
import { findCurrentUser, toAuthor, type MockContext } from "./context";

export function createRankingService(ctx: MockContext): RankingService {
  return {
    async bySubject(subjectId) {
      await ctx.wait();
      const state = ctx.db.read();
      const scores = computeSubjectScores(subjectId, state.sessions, state.posts);
      const authors = new Map(state.users.map((u) => [u.id, toAuthor(u)]));
      return rankEntries(scores, authors, findCurrentUser(state)?.id ?? null);
    },
  };
}
```

```ts
// shop.ts
import { ServiceError, type ShopService } from "@/services/contracts";
import { addCoins, requireUser, toUser, type MockContext } from "./context";
import { ACCESSORIES } from "./seed";

export function createShopService(ctx: MockContext): ShopService {
  return {
    async listAccessories() {
      await ctx.wait();
      return structuredClone(ACCESSORIES);
    },
    async purchase(accessoryId) {
      await ctx.wait();
      return ctx.db.write((draft) => {
        const user = requireUser(draft);
        const item = ACCESSORIES.find((a) => a.id === accessoryId);
        if (!item) throw new ServiceError("NOT_FOUND", "Acessório não encontrado.");
        if (user.unlockedAccessoryIds.includes(item.id)) throw new ServiceError("ALREADY_OWNED", "Você já tem esse acessório.");
        if (user.coins < item.cost) throw new ServiceError("INSUFFICIENT_COINS", "Moedas insuficientes.");
        user.unlockedAccessoryIds.push(item.id);
        addCoins(draft, user.id, -item.cost, "purchase", item.id, new Date(ctx.now()).toISOString());
        return toUser(user);
      });
    },
  };
}
```

Nota: `computeSubjectScores` recebe `state.posts` (`PostRecord` tem `authorId` e `subjectId`, compatível com a assinatura).

- [ ] **Step 5: Rodar e commitar**

Run: `npm test && npm run typecheck && npm run lint` → Expected: PASS.

```bash
git add frontend/src/services/mock
git commit --author="Felipe Wapf Fettback <wapffelipe@gmail.com>" \
  -m "feat: implementar feed, comentários, ranking e loja no mock" \
  -m "Co-Authored-By: Leonardo Tanaka Cortez <leonardotanaka0513@gmail.com>"
```

---

### Task 8: Mídia no IndexedDB e montagem dos serviços

**Autor:** Leonardo · **Coautor:** Felipe

**Files:**
- Create: `frontend/src/services/mock/media.ts`, `frontend/src/services/mock/media.test.ts`, `frontend/src/services/mock/index.ts`, `frontend/src/services/index.ts`, `frontend/src/services/ServicesContext.tsx`, `frontend/src/services/index.test.ts`

**Interfaces:**
- Consumes: todos os `create*Service` das Tasks 5–7, `MEDIA_LIMITS`, `latency`.
- Produces:
  - `interface MediaStore { put(id: string, blob: Blob): Promise<void>; get(id: string): Promise<Blob | null> }`, `indexedDbMediaStore(): MediaStore`, `createMemoryMediaStore(): MediaStore`
  - `createMediaService(ctx: MockContext, store: MediaStore): MediaService` — URLs no formato `idb://<id>`
  - `createMockServices(opts?: { storage?: KeyValueStorage; mediaStore?: MediaStore; latencyRange?: [number, number]; now?: () => number; random?: () => number }): Services & { resetDemoData(): void }`
  - `createServices(source: "mock" | "api"): Services & { resetDemoData?: () => void }`; `services` (singleton)
  - `ServicesProvider({ value, children })`, `useServices(): Services & { resetDemoData?: () => void }`

- [ ] **Step 1: Testes de mídia (falhando)**

```ts
// media.test.ts
import { describe, expect, it } from "vitest";
import { createTestContext } from "./context";
import { createMediaService, createMemoryMediaStore, indexedDbMediaStore } from "./media";

describe("MediaService (mock)", () => {
  it("guarda o blob e devolve idb://", async () => {
    const media = createMediaService(createTestContext(), createMemoryMediaStore());
    const { url, durationSec } = await media.upload(new Blob(["abc"], { type: "audio/webm" }), "audio", 12.4);
    expect(url).toMatch(/^idb:\/\//);
    expect(durationSec).toBe(12);
  });

  it("recusa arquivo grande, longo ou de tipo errado", async () => {
    const media = createMediaService(createTestContext(), createMemoryMediaStore());
    const big = new Blob([new Uint8Array(10 * 1024 * 1024 + 1)], { type: "audio/webm" });
    await expect(media.upload(big, "audio", 10)).rejects.toMatchObject({ code: "MEDIA_TOO_LARGE" });
    await expect(media.upload(new Blob(["a"], { type: "video/webm" }), "video", 121)).rejects.toMatchObject({ code: "MEDIA_TOO_LONG" });
    await expect(media.upload(new Blob(["a"], { type: "image/png" }), "video", 5)).rejects.toMatchObject({ code: "MEDIA_UNSUPPORTED" });
  });

  it("IndexedDB guarda e lê de volta", async () => {
    const store = indexedDbMediaStore();
    await store.put("x1", new Blob(["oi"], { type: "audio/webm" }));
    const blob = await store.get("x1");
    expect(await blob!.text()).toBe("oi");
    expect(await store.get("nao")).toBeNull();
  });

  it("resolveUrl deixa URLs http intactas", async () => {
    const media = createMediaService(createTestContext(), createMemoryMediaStore());
    expect(await media.resolveUrl("https://x/y.mp4")).toBe("https://x/y.mp4");
  });
});
```

Run: `npm test -- media` → Expected: FAIL.

- [ ] **Step 2: `media.ts`**

```ts
import { MEDIA_LIMITS, ServiceError, type MediaService } from "@/services/contracts";
import type { MockContext } from "./context";
import { newId } from "./latency";

export interface MediaStore {
  put(id: string, blob: Blob): Promise<void>;
  get(id: string): Promise<Blob | null>;
}

export function createMemoryMediaStore(): MediaStore {
  const map = new Map<string, Blob>();
  return { put: async (id, blob) => void map.set(id, blob), get: async (id) => map.get(id) ?? null };
}

const DB_NAME = "dotstudy-media";
const STORE = "blobs";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function indexedDbMediaStore(): MediaStore {
  const run = <T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) =>
    openDb().then((db) => new Promise<T>((resolve, reject) => {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }));
  return {
    put: async (id, blob) => void (await run("readwrite", (s) => s.put(blob, id))),
    get: async (id) => ((await run<Blob | undefined>("readonly", (s) => s.get(id))) ?? null),
  };
}

export function createMediaService(ctx: MockContext, store: MediaStore): MediaService {
  const objectUrls = new Map<string, string>();
  return {
    async upload(blob, kind, durationSec) {
      await ctx.wait();
      const limits = MEDIA_LIMITS[kind];
      if (!blob.type.startsWith(`${kind}/`)) throw new ServiceError("MEDIA_UNSUPPORTED", "Formato de arquivo não suportado.");
      if (blob.size > limits.maxBytes) throw new ServiceError("MEDIA_TOO_LARGE", `O arquivo passou de ${limits.maxBytes / 1024 / 1024} MB.`);
      if (durationSec > limits.maxSeconds) throw new ServiceError("MEDIA_TOO_LONG", `A gravação passou de ${limits.maxSeconds / 60} minutos.`);
      const id = newId("m");
      await store.put(id, blob);
      return { url: `idb://${id}`, durationSec: Math.round(durationSec) };
    },
    async resolveUrl(url) {
      if (!url.startsWith("idb://")) return url;
      const cached = objectUrls.get(url);
      if (cached) return cached;
      const blob = await store.get(url.slice("idb://".length));
      if (!blob) throw new ServiceError("NOT_FOUND", "Mídia não encontrada neste navegador.");
      const objectUrl = URL.createObjectURL(blob);
      objectUrls.set(url, objectUrl);
      return objectUrl;
    },
  };
}
```

- [ ] **Step 3: `mock/index.ts`, `services/index.ts`, `ServicesContext.tsx`**

```ts
// services/mock/index.ts
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
```

```ts
// services/index.ts
import type { Services } from "./contracts";
import { createMockServices } from "./mock";

export type AppServices = Services & { resetDemoData?: () => void };

export function createServices(source: string | undefined): AppServices {
  if (source === undefined || source === "mock") return createMockServices();
  throw new Error(`VITE_DATA_SOURCE="${source}" ainda não está disponível neste checkpoint (use "mock").`);
}

let singleton: AppServices | null = null;
export function getServices(): AppServices {
  singleton ??= createServices(import.meta.env.VITE_DATA_SOURCE);
  return singleton;
}
```

```tsx
// services/ServicesContext.tsx
import { createContext, useContext, type ReactNode } from "react";
import type { AppServices } from "./index";

const ServicesContext = createContext<AppServices | null>(null);

export function ServicesProvider({ value, children }: { value: AppServices; children: ReactNode }) {
  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
}

export function useServices(): AppServices {
  const value = useContext(ServicesContext);
  if (!value) throw new Error("useServices precisa estar dentro de <ServicesProvider>");
  return value;
}
```

- [ ] **Step 4: Teste da seleção**

```ts
// services/index.test.ts
import { describe, expect, it } from "vitest";
import { createServices } from "./index";

describe("createServices", () => {
  it("recusa fonte desconhecida com mensagem clara", () => {
    expect(() => createServices("api")).toThrow(/ainda não está disponível/);
  });
});
```

(O caso `mock` depende de `window.localStorage`; é coberto pelos testes de página nas Tasks 10+.)

- [ ] **Step 5: Rodar e commitar**

Run: `npm test && npm run typecheck && npm run lint` → Expected: PASS.

```bash
git add frontend/src/services
git commit --author="Leonardo Tanaka Cortez <leonardotanaka0513@gmail.com>" \
  -m "feat: guardar mídia no IndexedDB e montar camada de serviços mock" \
  -m "Co-Authored-By: Felipe Wapf Fettback <wapffelipe@gmail.com>"
```

---

### Task 9: Extrair componentes visuais e utilitários do App.tsx

**Autor:** Tiago · **Coautor:** Monique

**Files:**
- Create: `frontend/src/components/{DotAvatar,StudyLogo,CircularTimer,DurationPicker,AudioWave,FloatingTimer,FreeSessionSummary,ChartTooltip,ErrorMessage,LoadingState}.tsx`, `frontend/src/domain/format.ts`, `frontend/src/domain/format.test.ts`, `frontend/src/domain/subjectIcons.ts`, `frontend/src/assets/accessories/{glasses,party-hat,witch-hat}.ts`, `frontend/src/components/DotAvatar.test.tsx`
- Modify: `frontend/src/app/App.tsx` (passa a importar os componentes extraídos)
- Delete: `frontend/src/imports/` (conteúdo movido para `assets/accessories/`)

**Interfaces:**
- Produces:
  - `DotAvatar({ color, accessory, size }: { color: string; accessory?: string | null; size?: number })`
  - `StudyLogo({ dotColor?, textColor?, dotSize? })`, `CircularTimer({ timeLeft, totalTime, color })`, `DurationPicker({ label, value, onChange, presets, min?, max? })`, `AudioWave({ heights, color, dim? })`, `FloatingTimer(...)` e `FreeSessionSummary(...)` com as mesmas props do protótipo, `ChartTooltip`
  - `ErrorMessage({ error, onRetry? }: { error: unknown; onRetry?: () => void })` — mostra `error.message` se for `ServiceError`, senão "Algo deu errado. Tente de novo."
  - `LoadingState({ label? }: { label?: string })` — pontinho pulsando na cor teal + texto (padrão "Carregando…")
  - `format.ts`: `formatTotalTime(min)`, `formatRecTime(sec)`, `getDateLabel(date, now?)`, `relativeTime(iso, now?)` ("agora", "há 5 min", "há 2h", "há 1d", "12 de setembro")
  - `subjectIcons.ts`: `SUBJECT_ICONS: Record<SubjectIcon, LucideIcon>` (`sigma→Sigma`, `atom→Atom`, `hourglass→Hourglass`, `pen-tool→PenTool`, `code→Code`)

- [ ] **Step 1: Teste de `format.ts` (falhando)**

```ts
import { describe, expect, it } from "vitest";
import { formatRecTime, formatTotalTime, getDateLabel, relativeTime } from "./format";

const now = new Date(2026, 8, 29, 12, 0, 0).getTime();

describe("format", () => {
  it("formatTotalTime", () => {
    expect(formatTotalTime(45)).toBe("45min");
    expect(formatTotalTime(120)).toBe("2h");
    expect(formatTotalTime(135)).toBe("2h 15min");
  });
  it("formatRecTime", () => {
    expect(formatRecTime(134)).toBe("02:14");
  });
  it("getDateLabel", () => {
    expect(getDateLabel(new Date(2026, 8, 29, 8), now)).toBe("Hoje");
    expect(getDateLabel(new Date(2026, 8, 28, 8), now)).toBe("Ontem");
    expect(getDateLabel(new Date(2026, 8, 25, 8), now)).toBe("Esta semana");
  });
  it("relativeTime", () => {
    expect(relativeTime(new Date(now - 20_000).toISOString(), now)).toBe("agora");
    expect(relativeTime(new Date(now - 5 * 60_000).toISOString(), now)).toBe("há 5 min");
    expect(relativeTime(new Date(now - 2 * 3_600_000).toISOString(), now)).toBe("há 2h");
    expect(relativeTime(new Date(now - 26 * 3_600_000).toISOString(), now)).toBe("há 1d");
  });
});
```

- [ ] **Step 2: Implementar `format.ts`**

Mover `formatTotalTime`, `formatRecTime` e `getDateLabel` do `App.tsx` (mesmo corpo; `getDateLabel` ganha parâmetro `now = Date.now()` no lugar de `new Date()`), e adicionar:

```ts
export function relativeTime(iso: string, now: number = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `há ${d}d`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
}
```

Run: `npm test -- format` → Expected: PASS.

- [ ] **Step 3: Mover os componentes**

Para cada função abaixo em `App.tsx`, recortar a função inteira e colá-la no arquivo novo com `export function`, levando os imports de que ela precisa (lucide, `BRAND` de `@/domain/brand`, `format.ts`):

| Função em App.tsx | Arquivo |
|---|---|
| `DotAvatar` | `components/DotAvatar.tsx` |
| `StudyLogo` | `components/StudyLogo.tsx` |
| `CircularTimer` | `components/CircularTimer.tsx` |
| `DurationPicker` | `components/DurationPicker.tsx` |
| `AudioWave` | `components/AudioWave.tsx` |
| `FloatingTimer` | `components/FloatingTimer.tsx` |
| `FreeSessionSummary` | `components/FreeSessionSummary.tsx` |
| `ChartTooltip` | `components/ChartTooltip.tsx` |

Os três SVGs de acessório: mover `src/imports/Group26-1/svg-*.ts` → `src/assets/accessories/glasses.ts`, `Group27-1` → `party-hat.ts`, `Group29-2` → `witch-hat.ts` (conteúdo idêntico) e atualizar os imports do `DotAvatar`. Apagar `src/imports/` e tirar `frontend/src/imports/**` do `ignores` do ESLint e do `.prettierignore`.

Em `App.tsx`: apagar as definições movidas e o bloco `const BRAND = {...}` e `DOT_COLORS`, importando de `@/domain/brand`; importar os componentes dos novos arquivos. Nenhuma mudança de comportamento.

- [ ] **Step 4: Criar `ErrorMessage.tsx` e `LoadingState.tsx`**

```tsx
// ErrorMessage.tsx
import { ServiceError } from "@/services/contracts";

export function errorText(error: unknown): string {
  return error instanceof ServiceError ? error.message : "Algo deu errado. Tente de novo.";
}

export function ErrorMessage({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-2xl p-4 text-sm flex items-center justify-between gap-3"
      style={{ background: "rgba(238,27,63,0.08)", color: "#B4102C", border: "1px solid rgba(238,27,63,0.25)" }}>
      <span>{errorText(error)}</span>
      {onRetry && (
        <button onClick={onRetry} className="px-3 py-1.5 rounded-full font-semibold" style={{ background: "#EE1B3F", color: "white" }}>
          Tentar de novo
        </button>
      )}
    </div>
  );
}
```

```tsx
// LoadingState.tsx
export function LoadingState({ label = "Carregando…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-sm" style={{ color: "var(--muted-foreground)" }}>
      <span className="w-3 h-3 rounded-full animate-pulse" style={{ background: "#22CFD5" }} />
      {label}
    </div>
  );
}
```

- [ ] **Step 5: Teste do DotAvatar**

```tsx
// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DotAvatar } from "./DotAvatar";

describe("DotAvatar", () => {
  it("renderiza com e sem acessório", () => {
    const { container, rerender } = render(<DotAvatar color="#22CFD5" size={48} />);
    expect(container.querySelector("svg")).not.toBeNull();
    rerender(<DotAvatar color="#22CFD5" accessory="glasses" size={48} />);
    expect(container.querySelectorAll("svg").length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 6: Verificar e commitar**

Run: `npm test && npm run typecheck && npm run lint && npm run build` e `npm run dev` para conferir visualmente que dashboard, timer e loja estão iguais ao protótipo. Expected: tudo verde, visual inalterado.

```bash
git add -A frontend
git commit --author="Tiago Brito Nário <tiago.tibi.nario@gmail.com>" \
  -m "refactor: extrair componentes visuais e utilitários do protótipo" \
  -m "Co-Authored-By: Monique Ferreira dos Anjos <anjos.moniqueferreira@gmail.com>"
```

---

### Task 10: Shell do app — rotas, providers, autenticação e telas de login/cadastro

**Autor:** Monique · **Coautor:** Rafael

**Files:**
- Create: `frontend/src/app/{router,providers,AppLayout,ProtectedRoute,queryKeys}.tsx|ts`, `frontend/src/hooks/useAuth.ts`, `frontend/src/pages/{LoginPage,CadastroPage}.tsx`, `frontend/src/components/BottomNav.tsx`, `frontend/src/test/renderWithProviders.tsx`, `frontend/src/pages/auth.test.tsx`
- Modify: `frontend/src/main.tsx`, `frontend/src/app/App.tsx` (views passam a ser exportadas para serem montadas nas rotas)

**Interfaces:**
- Consumes: `useServices`, `getServices`, `ServiceError`, `DotAvatar`, `StudyLogo`, `ErrorMessage`, `LoadingState`, `DEMO_USER`.
- Produces:
  - `queryKeys = { me: ["me"], stats: ["stats"], subjects: ["subjects"], sessions: ["sessions"], posts: (f: PostFilter) => ["posts", f], post: (id) => ["post", id], comments: (id) => ["comments", id], ranking: (subjectId) => ["ranking", subjectId], accessories: ["accessories"] } as const`
  - `useAuth(): { user: User | null; isLoading: boolean; login(email, password): Promise<void>; register(name, email, password): Promise<void>; logout(): Promise<void> }` — baseado em `useQuery(queryKeys.me, services.auth.me)`; `login/register` gravam o usuário no cache (`queryClient.setQueryData(queryKeys.me, user)`); `logout` faz `queryClient.clear()`
  - `useCurrentUser(): User` (lança se chamado fora de rota protegida)
  - `AppProviders({ services, children, queryClient? })` — `ServicesProvider` + `QueryClientProvider` + aplicação do tema (`dark` no `documentElement` lendo `localStorage["dotstudy:theme"]`)
  - `renderWithProviders(ui, { route?, services? })` para testes: cria `createMockServices({ storage: createMemoryStorage(), mediaStore: createMemoryMediaStore(), latencyRange: [0, 0] })`, `QueryClient` com `retry: false`, `MemoryRouter`.
  - Rotas conforme spec §5 (tabela "Rotas"); `ProtectedRoute` redireciona para `/login` sem usuário.
  - `BottomNav` usa `NavLink` do react-router e lê `coins`, `dotColor`, `activeAccessoryId` de `useCurrentUser()`.

- [ ] **Step 1: Dependências**

```bash
npm i -w frontend react-router@7.13.0 @tanstack/react-query@5.62.8
```

- [ ] **Step 2: Teste de ponta a ponta do login/cadastro (falhando)**

`frontend/src/pages/auth.test.tsx`:

```tsx
// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { AppRoutes } from "@/app/router";

describe("autenticação", () => {
  it("sem login, rota protegida manda para /login", async () => {
    renderWithProviders(<AppRoutes />, { route: "/ranking" });
    expect(await screen.findByRole("heading", { name: /entrar/i })).toBeInTheDocument();
  });

  it("login com o usuário demo abre o dashboard", async () => {
    renderWithProviders(<AppRoutes />, { route: "/login" });
    await userEvent.type(await screen.findByLabelText(/email/i), "demo@dotstudy.app");
    await userEvent.type(screen.getByLabelText(/senha/i), "dotstudy123");
    await userEvent.click(screen.getByRole("button", { name: /entrar/i }));
    expect(await screen.findByText(/guilherme/i)).toBeInTheDocument();
  });

  it("mostra erro de credencial inválida", async () => {
    renderWithProviders(<AppRoutes />, { route: "/login" });
    await userEvent.type(await screen.findByLabelText(/email/i), "demo@dotstudy.app");
    await userEvent.type(screen.getByLabelText(/senha/i), "errada123");
    await userEvent.click(screen.getByRole("button", { name: /entrar/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Email ou senha incorretos.");
  });

  it("cadastro cria conta e entra com 250 moedas", async () => {
    renderWithProviders(<AppRoutes />, { route: "/cadastro" });
    await userEvent.type(await screen.findByLabelText(/nome/i), "Nova Pessoa");
    await userEvent.type(screen.getByLabelText(/email/i), "nova@teste.com");
    await userEvent.type(screen.getByLabelText(/^senha/i), "segredo12");
    await userEvent.click(screen.getByRole("button", { name: /criar conta/i }));
    expect(await screen.findByText(/nova pessoa/i)).toBeInTheDocument();
    expect(screen.getByText("250")).toBeInTheDocument();
  });
});
```

Run: `npm test -- auth.test` → Expected: FAIL.

- [ ] **Step 3: Providers, hook de auth, rotas**

```tsx
// app/providers.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { ServicesProvider } from "@/services/ServicesContext";
import type { AppServices } from "@/services";

export const THEME_KEY = "dotstudy:theme";

export function readTheme(): "light" | "dark" {
  try {
    return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function applyTheme(theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // navegação privada sem storage: o tema só não persiste
  }
}

export function AppProviders({ services, children, queryClient }: { services: AppServices; children: ReactNode; queryClient?: QueryClient }) {
  const [client] = useState(() => queryClient ?? new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } }));
  useEffect(() => applyTheme(readTheme()), []);
  return (
    <ServicesProvider value={services}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </ServicesProvider>
  );
}
```

```ts
// hooks/useAuth.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@/services/contracts";
import { useServices } from "@/services/ServicesContext";
import { queryKeys } from "@/app/queryKeys";

export function useAuth() {
  const services = useServices();
  const queryClient = useQueryClient();
  const me = useQuery({ queryKey: queryKeys.me, queryFn: () => services.auth.me() });
  return {
    user: me.data ?? null,
    isLoading: me.isLoading,
    async login(email: string, password: string) {
      queryClient.setQueryData(queryKeys.me, await services.auth.login({ email, password }));
    },
    async register(name: string, email: string, password: string) {
      queryClient.setQueryData(queryKeys.me, await services.auth.register({ name, email, password }));
    },
    async logout() {
      await services.auth.logout();
      queryClient.clear();
      queryClient.setQueryData(queryKeys.me, null);
    },
  };
}

export function useCurrentUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error("useCurrentUser fora de rota protegida");
  return user;
}
```

`app/queryKeys.ts` conforme Interfaces. `app/ProtectedRoute.tsx`:

```tsx
import { Navigate, Outlet, useLocation } from "react-router";
import { LoadingState } from "@/components/LoadingState";
import { useAuth } from "@/hooks/useAuth";

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <LoadingState />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
```

`app/router.tsx` exporta `AppRoutes` (componente com `<Routes>`) e `router` não é necessário — `main.tsx` usa `<BrowserRouter><AppRoutes/></BrowserRouter>`:

```tsx
import { Route, Routes, Navigate } from "react-router";
import { AppLayout } from "./AppLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { LoginPage } from "@/pages/LoginPage";
import { CadastroPage } from "@/pages/CadastroPage";
import { DashboardView, TimerView, FeedView, RankingView, HistoryView, ShopView, SettingsView } from "./App";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<CadastroPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardView />} />
          <Route path="estudar" element={<TimerView />} />
          <Route path="feed" element={<FeedView />} />
          <Route path="ranking" element={<RankingView />} />
          <Route path="historico" element={<HistoryView />} />
          <Route path="loja" element={<ShopView />} />
          <Route path="ajustes" element={<SettingsView />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

As Tasks 11–15 trocam cada `*View` importado de `./App` pela página nova em `pages/`. **Nesta task**, para que as views do protótipo funcionem sem props, criar em `App.tsx` um wrapper temporário por view que injeta os estados antigos a partir de um `LegacyStateContext` (o `useState` que hoje está em `export default function App`, movido para um provider `LegacyStateProvider` montado dentro do `AppLayout`). Ex.:

```tsx
export function RankingView() {
  const legacy = useLegacyState();
  return <RankingViewLegacy dotColor={legacy.dotColor} />;
}
```

onde `RankingViewLegacy` é a função original renomeada. Onde a view original chama `setView("x")`, trocar por `navigate(ROUTE_OF["x"])` com `const ROUTE_OF: Record<View, string> = { dashboard: "/", timer: "/estudar", feed: "/feed", ranking: "/ranking", history: "/historico", shop: "/loja", settings: "/ajustes", articles: "/leitura", reader: "/leitura/artigo", "post-detail": "/feed" }`. O `LegacyStateContext` é apagado na Task 15, quando a última view migrar.

`AppLayout.tsx`: `<LegacyStateProvider><div className="flex flex-col bg-background relative" style={{ minHeight: "100vh", fontFamily: "Inter, sans-serif" }}><main className="flex-1 overflow-y-auto pb-28" style={{ scrollbarWidth: "none" }}><Outlet /></main><BottomNav /></div></LegacyStateProvider>` (mesmas classes do `App` original).

`BottomNav.tsx`: mover `function BottomNav` do `App.tsx`; trocar `view/setView` por `NavLink` (`/`, `/estudar`, `/feed`, `/ranking`, `/historico`, `/ajustes` com os mesmos ícones e rótulos) e ler `coins`, `dotColor`, `activeAccessoryId` de `useCurrentUser()`. O bloco do Spotify fica como está até a Task 16. O botão da loja (se houver na nav) aponta para `/loja`.

`main.tsx`:

```tsx
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { AppProviders } from "./app/providers";
import { AppRoutes } from "./app/router";
import { getServices } from "./services";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <AppProviders services={getServices()}>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </AppProviders>,
);
```

- [ ] **Step 4: `LoginPage` e `CadastroPage`**

Telas novas no estilo do protótipo: fundo `var(--background)`, `StudyLogo` no topo, `DotAvatar` teal grande, cartão `bg-card` com borda `var(--border)` e `rounded-3xl`, títulos em Outfit 700, botão primário teal (`BRAND.teal`, texto `BRAND.dark`, `rounded-2xl`), links em `BRAND.purple`. Sem opção de Google.

```tsx
// pages/LoginPage.tsx
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { DotAvatar } from "@/components/DotAvatar";
import { ErrorMessage } from "@/components/ErrorMessage";
import { StudyLogo } from "@/components/StudyLogo";
import { BRAND } from "@/domain/brand";
import { useAuth } from "@/hooks/useAuth";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      navigate((location.state as { from?: string } | null)?.from ?? "/", { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Entrar" subtitle="Bom te ver de novo! Bora estudar?">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <Field label="Senha" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
        {error !== null && <ErrorMessage error={error} />}
        <PrimaryButton disabled={submitting}>{submitting ? "Entrando…" : "Entrar"}</PrimaryButton>
        <p className="text-sm text-center" style={{ color: "var(--muted-foreground)" }}>
          Ainda não tem conta? <Link to="/cadastro" style={{ color: BRAND.purple, fontWeight: 600 }}>Criar conta</Link>
        </p>
        <p className="text-xs text-center" style={{ color: "var(--muted-foreground)" }}>
          Conta de demonstração: demo@dotstudy.app · dotstudy123
        </p>
      </form>
    </AuthLayout>
  );
}

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <StudyLogo />
        <DotAvatar color={BRAND.teal} size={88} />
        <div className="w-full rounded-3xl p-6 bg-card flex flex-col gap-5" style={{ border: "1px solid var(--border)" }}>
          <div>
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "1.6rem", color: "var(--foreground)" }}>{title}</h1>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function Field({ label, type, value, onChange, autoComplete }: {
  label: string; type: string; value: string; onChange: (v: string) => void; autoComplete?: string;
}) {
  const id = `f-${label.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5 text-sm" style={{ fontWeight: 600, color: "var(--foreground)" }}>
      {label}
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} required
        className="rounded-2xl px-4 py-3 bg-background outline-none focus:ring-2"
        style={{ border: "1px solid var(--border)", fontWeight: 400 }} />
    </label>
  );
}

export function PrimaryButton({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  return (
    <button type="submit" disabled={disabled} className="rounded-2xl py-3 transition-transform hover:scale-[1.01] disabled:opacity-60"
      style={{ background: BRAND.teal, color: BRAND.dark, fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
      {children}
    </button>
  );
}
```

`CadastroPage` usa `AuthLayout` ("Criar conta", "Seu dot está esperando. Ganhe 250 moedas de boas-vindas!"), campos Nome / Email / Senha (`autoComplete="new-password"`, dica "mínimo 8 caracteres"), botão "Criar conta", link "Já tenho conta" → `/login`; chama `register(name, email, password)` e navega para `/`. Mesmo tratamento de erro do login.

Para o teste "Nova Pessoa" e "250": o `DashboardView` exibe `user.name` e a `BottomNav` exibe `user.coins` — garantir que o wrapper do Dashboard use `useCurrentUser().name` no lugar de `userName` e que a BottomNav use `coins` do usuário.

- [ ] **Step 5: `renderWithProviders`**

```tsx
import { render } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router";
import { AppProviders } from "@/app/providers";
import type { AppServices } from "@/services";
import { createMockServices } from "@/services/mock";
import { createMemoryMediaStore } from "@/services/mock/media";
import { createMemoryStorage } from "@/services/mock/storage";

export function createTestServices(): AppServices {
  return createMockServices({ storage: createMemoryStorage(), mediaStore: createMemoryMediaStore(), latencyRange: [0, 0] });
}

export function renderWithProviders(ui: ReactElement, { route = "/", services = createTestServices() }: { route?: string; services?: AppServices } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return {
    services,
    ...render(
      <AppProviders services={services} queryClient={queryClient}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </AppProviders>,
    ),
  };
}

export async function loginDemo(services: AppServices) {
  await services.auth.login({ email: "demo@dotstudy.app", password: "dotstudy123" });
}
```

- [ ] **Step 6: Rodar, conferir no navegador e commitar**

Run: `npm test && npm run typecheck && npm run lint && npm run build` → Expected: PASS. `npm run dev`: abrir `/`, ser mandado para `/login`, entrar com o demo, navegar pelas abas; recarregar a página continua logado.

```bash
git add -A frontend
git commit --author="Monique Ferreira dos Anjos <anjos.moniqueferreira@gmail.com>" \
  -m "feat: adicionar rotas, telas de login e cadastro e sessão do usuário" \
  -m "Co-Authored-By: Rafael Augusto Oliveira Silva <rafael.a.os@hotmail.com>"
```

---

### Task 11: Dashboard, Histórico e Ranking com dados dos serviços

**Autor:** Rafael · **Coautor:** Tiago

**Files:**
- Create: `frontend/src/pages/{DashboardPage,HistoricoPage,RankingPage}.tsx`, `frontend/src/pages/dashboard-historico-ranking.test.tsx`
- Modify: `frontend/src/app/router.tsx`, `frontend/src/app/App.tsx` (remover `DashboardView`, `HistoryView`, `RankingView`, `RANKINGS`, `INITIAL_SESSIONS`, `calculateStreak` local)

**Interfaces:**
- Consumes: `useServices`, `useCurrentUser`, `queryKeys`, `SUBJECT_ICONS`, `formatTotalTime`, `getDateLabel`, `sessionMinutes`, `LoadingState`, `ErrorMessage`, `DotAvatar`, `ChartTooltip`.
- Produces: `DashboardPage`, `HistoricoPage`, `RankingPage` (sem props).

- [ ] **Step 1: Testes (falhando)**

```tsx
// @vitest-environment jsdom
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AppRoutes } from "@/app/router";
import { createTestServices, loginDemo, renderWithProviders } from "@/test/renderWithProviders";

async function open(route: string) {
  const services = createTestServices();
  await loginDemo(services);
  return renderWithProviders(<AppRoutes />, { route, services });
}

describe("Dashboard", () => {
  it("cumprimenta o usuário e mostra a sequência de dias", async () => {
    await open("/");
    expect(await screen.findByText(/guilherme/i)).toBeInTheDocument();
    expect(screen.getByText(/dias? seguidos?|sequência/i)).toBeInTheDocument();
  });
});

describe("Histórico", () => {
  it("lista sessões do seed agrupadas por data e o tempo total", async () => {
    await open("/historico");
    expect(await screen.findByText("Cálculo Diferencial")).toBeInTheDocument();
    expect(screen.getAllByText(/^(Hoje|Ontem)$/).length).toBeGreaterThan(0);
    expect(screen.getByText("6h 15min")).toBeInTheDocument();
  });
});

describe("Ranking", () => {
  it("mostra Matemática por padrão e troca de assunto", async () => {
    await open("/ranking");
    const first = await screen.findByText("Ana Clara M.");
    expect(within(first.closest("li, div")!).getByText(/510/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /programação/i }));
    expect(await screen.findByText("Pedro Lima")).toBeInTheDocument();
  });
});
```

(`6h 15min` = 375 minutos das sessões do demo.)

Run: `npm test -- dashboard-historico-ranking` → Expected: FAIL.

- [ ] **Step 2: `DashboardPage`**

Mover o JSX de `DashboardView` (App.tsx) para `pages/DashboardPage.tsx`. Trocar as fontes de dados:
- `userName` → `useCurrentUser().name`; `dotColor` → `useCurrentUser().dotColor`; acessório → `activeAccessoryId`.
- `sessions` e `calculateStreak(sessions)` → `useQuery({ queryKey: queryKeys.stats, queryFn: () => services.users.getStats() })`, usando `stats.streakDays`, `stats.totalMinutes`, `stats.completedCycles`.
- Qualquer lista de "últimas sessões" → `useQuery({ queryKey: queryKeys.sessions, queryFn: () => services.sessions.list() })` filtrando `completedCycles > 0`, pegando as 3 primeiras; o assunto/tema vem de `useQuery({ queryKey: queryKeys.subjects, queryFn: () => services.subjects.list() })` (procurar `subjectId`/`themeId`).
- `setView("timer")` → `navigate("/estudar")`, `setView("history")` → `navigate("/historico")`, etc.
- Enquanto carrega: `<LoadingState />`; em erro: `<ErrorMessage error={error} onRetry={refetch} />`.

- [ ] **Step 3: `HistoricoPage`**

Mover `HistoryView`. Dados: `services.sessions.list()` (só `completedCycles > 0`) + `services.subjects.list()` + `services.users.getStats()`.
- Cada item: título = nome do tema (`themeId`) ou `label` ou "Sessão livre"; cor = cor do assunto ou `dotColor`; duração = `sessionMinutes(s)`; data = `lastCycleAt ?? startedAt`.
- Agrupamento por `getDateLabel(new Date(data))`; filtro por assunto usa `subjectId` (o protótipo usava nome).
- Gráfico de barras: `stats.last7Days` (rótulo = dia da semana abreviado em pt-BR: `new Date(date + "T12:00").toLocaleDateString("pt-BR", { weekday: "short" })`).
- Total: `formatTotalTime(stats.totalMinutes)`.
- Estado vazio (conta nova): manter o estado vazio do protótipo ("Nenhuma sessão encontrada.") com botão "Começar a estudar" → `/estudar`.

- [ ] **Step 4: `RankingPage`**

Mover `RankingView`. `activeSubject` inicia em `1`; botões de assunto vêm de `services.subjects.list()` (ícone por `SUBJECT_ICONS[subject.icon]`, `aria-label`/texto com o nome); lista vem de `useQuery({ queryKey: queryKeys.ranking(activeSubject), queryFn: () => services.rankings.bySubject(activeSubject) })`. Campos: `pos → entry.position`, `name → entry.user.name`, `dotColor → entry.user.dotColor`, `accessory → entry.user.activeAccessoryId`, `score`, `isMe`. O item `isMe` mostra "Você" ao lado do nome (como no protótipo). Se o usuário não estiver na lista: rodapé "Você ainda não pontuou neste assunto — complete um desafio para entrar no ranking."

- [ ] **Step 5: Rotas e limpeza**

Em `router.tsx`: `index → <DashboardPage/>`, `historico → <HistoricoPage/>`, `ranking → <RankingPage/>`. Remover do `App.tsx` as funções/constantes que ficaram sem uso (`DashboardView*`, `HistoryView*`, `RankingView*`, `RANKINGS`, `INITIAL_SESSIONS`, `calculateStreak`, `hoursAgo`, `daysAgo`) e o que o lint apontar como não usado.

- [ ] **Step 6: Rodar e commitar**

Run: `npm test && npm run typecheck && npm run lint && npm run build` → Expected: PASS.

```bash
git add -A frontend
git commit --author="Rafael Augusto Oliveira Silva <rafael.a.os@hotmail.com>" \
  -m "feat: ligar dashboard, histórico e ranking à camada de serviços" \
  -m "Co-Authored-By: Tiago Brito Nário <tiago.tibi.nario@gmail.com>"
```

---

### Task 12: Tela Estudar — timer confiável, sessões reais e leitura

**Autor:** Tiago · **Coautor:** Rafael

**Files:**
- Create: `frontend/src/hooks/useCountdown.ts`, `frontend/src/hooks/useCountdown.test.ts`, `frontend/src/pages/EstudarPage.tsx`, `frontend/src/pages/estudar.test.tsx`, `frontend/src/pages/LeituraListaPage.tsx`, `frontend/src/pages/LeituraPage.tsx`, `frontend/src/content/StudyContext.tsx`
- Move: `frontend/src/app/components/{ArticlesView,ReaderView,articleData}.tsx|ts` → `frontend/src/content/`
- Modify: `frontend/src/app/router.tsx`, `frontend/src/app/App.tsx` (remover `TimerView`, `DIFFICULTY_PRESETS`, `SUBJECTS`, `THEMES_BY_SUBJECT`, `pickRandom`)

**Interfaces:**
- Consumes: `services.sessions.*`, `services.subjects.list`, `getDifficultyPresets`, `CircularTimer`, `DurationPicker`, `FloatingTimer`, `FreeSessionSummary`, `queryKeys`.
- Produces:
  - `useCountdown(onFinish: () => void): { secondsLeft: number; totalSeconds: number; isRunning: boolean; start(seconds: number): void; pause(): void; resume(): void; reset(seconds: number): void }` — baseado em `deadline` (ms); tick a cada 250 ms; `onFinish` chamado uma vez.
  - `StudyContext` (`StudyProvider`, `useStudy()`): `{ challenge: { subjectName; subjectColor; theme } | null; setChallenge; selectedArticle: Article | null; setSelectedArticle; activeSessionId: string | null; setActiveSessionId }` — substitui `readerChallenge`/`selectedArticle` do estado legado; montado no `AppLayout`.
  - `EstudarPage` (fase `publishing` renderiza `<PostPublisher>` — a publicação real é ligada na Task 14; nesta task o `onPublish` chama `services.posts.create` com `type: "text"` e o `onSkip` finaliza).

- [ ] **Step 1: Teste do `useCountdown` (falhando)**

```ts
// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCountdown } from "./useCountdown";

describe("useCountdown", () => {
  beforeEach(() => vi.useFakeTimers({ now: new Date("2026-09-29T12:00:00Z") }));
  afterEach(() => vi.useRealTimers());

  it("conta regressivamente e chama onFinish uma vez", () => {
    const onFinish = vi.fn();
    const { result } = renderHook(() => useCountdown(onFinish));
    act(() => result.current.start(3));
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.secondsLeft).toBe(2);
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.isRunning).toBe(false);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("aba em segundo plano: se o relógio pula, termina na hora certa", () => {
    const onFinish = vi.fn();
    const { result } = renderHook(() => useCountdown(onFinish));
    act(() => result.current.start(25 * 60));
    // intervalos estrangulados: o relógio anda 25 min, mas só um tick dispara
    act(() => {
      vi.setSystemTime(new Date("2026-09-29T12:25:01Z"));
      vi.advanceTimersByTime(250);
    });
    expect(result.current.secondsLeft).toBe(0);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("pausa e retoma sem perder tempo", () => {
    const { result } = renderHook(() => useCountdown(() => {}));
    act(() => result.current.start(10));
    act(() => vi.advanceTimersByTime(4000));
    act(() => result.current.pause());
    act(() => vi.advanceTimersByTime(60_000));
    expect(result.current.secondsLeft).toBe(6);
    act(() => result.current.resume());
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.secondsLeft).toBe(4);
  });
});
```

Run: `npm test -- useCountdown` → Expected: FAIL.

- [ ] **Step 2: Implementar `useCountdown`**

```ts
import { useCallback, useEffect, useRef, useState } from "react";

export function useCountdown(onFinish: () => void) {
  const [totalSeconds, setTotal] = useState(0);
  const [secondsLeft, setLeft] = useState(0);
  const [isRunning, setRunning] = useState(false);
  const deadline = useRef<number | null>(null);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const tick = useCallback(() => {
    if (deadline.current === null) return;
    const left = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
    setLeft(left);
    if (left === 0) {
      deadline.current = null;
      setRunning(false);
      onFinishRef.current();
    }
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(tick, 250);
    const onVisible = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isRunning, tick]);

  const start = useCallback((seconds: number) => {
    deadline.current = Date.now() + seconds * 1000;
    setTotal(seconds);
    setLeft(seconds);
    setRunning(true);
  }, []);

  const pause = useCallback(() => {
    if (deadline.current === null) return;
    setLeft(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)));
    deadline.current = null;
    setRunning(false);
  }, []);

  const resume = useCallback(() => {
    setLeft((left) => {
      if (left > 0) {
        deadline.current = Date.now() + left * 1000;
        setRunning(true);
      }
      return left;
    });
  }, []);

  const reset = useCallback((seconds: number) => {
    deadline.current = null;
    setRunning(false);
    setTotal(seconds);
    setLeft(seconds);
  }, []);

  return { secondsLeft, totalSeconds, isRunning, start, pause, resume, reset };
}
```

Run: `npm test -- useCountdown` → Expected: PASS.

- [ ] **Step 3: Teste da tela Estudar (falhando)**

```tsx
// @vitest-environment jsdom
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "@/app/router";
import { createTestServices, loginDemo, renderWithProviders } from "@/test/renderWithProviders";

describe("Estudar (desafio)", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true, now: new Date("2026-09-29T12:00:00Z") }));
  afterEach(() => vi.useRealTimers());

  it("inicia desafio, conclui o ciclo e ganha +10 moedas", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const services = createTestServices();
    await loginDemo(services);
    renderWithProviders(<AppRoutes />, { route: "/estudar", services });
    await user.click(await screen.findByRole("button", { name: /fácil/i }));
    await user.click(screen.getByRole("button", { name: /matemática/i }));
    await user.click(screen.getByRole("button", { name: /começar|iniciar/i }));
    expect((await services.sessions.list())[0]).toMatchObject({ status: "in_progress", subjectId: 1, focusMinutes: 15 });
    await act(async () => { vi.advanceTimersByTime(15 * 60_000 + 500); });
    expect(await screen.findByText(/\+10/)).toBeInTheDocument();
    expect((await services.users.getStats()).completedCycles).toBe(13);
  });
});
```

Run: `npm test -- estudar` → Expected: FAIL.

- [ ] **Step 4: Montar `EstudarPage`**

Mover `TimerView` para `pages/EstudarPage.tsx` e trocar a lógica de estado:
- **Assuntos**: `useQuery(queryKeys.subjects, services.subjects.list)`; ícone via `SUBJECT_ICONS`.
- **Dificuldades**: `getDifficultyPresets()` no lugar de `DIFFICULTY_PRESETS`.
- **Timer**: substituir `timeLeft/isRunning` e o `useEffect` do `setInterval` por `useCountdown(handleFinish)`; `CircularTimer` recebe `timeLeft={secondsLeft}` e `totalTime={totalSeconds}`.
- **startChallenge**: `const session = await services.sessions.start({ mode: "challenge", subjectId: selectedSubjectId, focusMinutes: difficulty.minutes })`; guardar `session` em estado; derivar `subject`/`theme` de `subjects` por `session.subjectId`/`session.themeId`; `setChallenge({ subjectName, subjectColor, theme })` no `StudyContext`; `countdown.start(difficulty.minutes * 60)`.
- **handleFinish (desafio)**: `const { reward } = await services.sessions.completeCycle(session.id)`; exibir toast/selo "+{reward.coinsEarned} moedas" (reaproveitar o destaque visual que o protótipo usa na fase `publishing`); `queryClient.invalidateQueries` para `me`, `stats`, `sessions`, `ranking`; ir para a fase `publishing`. Se der `CYCLE_TOO_SOON` (relógio do sistema mexido), mostrar `ErrorMessage` e voltar ao setup.
- **Modo livre**: `startFree` chama `services.sessions.start({ mode: "free", label: freeLabel || null, focusMinutes: freeDuration, breakMinutes: freeBreak, plannedCycles: freeSessionCount })`; ao fim de cada foco chama `completeCycle`; se `session.status === "in_progress"`, inicia a pausa com `countdown.start(freeBreak * 60)` e depois o próximo foco; ao terminar tudo mostra `FreeSessionSummary` com `totalMinutes = completedCycles × focusMinutes`.
- **Anotações**: o campo `notes` salva com debounce de 800 ms via `services.sessions.updateNotes(session.id, notes)`; a nota do `FreeSessionSummary` também usa `updateNotes`.
- **Resetar/Trocar de modo** com sessão em andamento: `services.sessions.finish(session.id, "abandoned")`.
- **Leitura durante o desafio**: o botão que abria `articles`/`reader` navega para `/leitura` (`LeituraListaPage`, que renderiza `ArticlesView` com `challenge` do `StudyContext`) e `/leitura/:id` (`LeituraPage` → `ReaderView`). O `FloatingTimer` continua visível na leitura: mover o `useCountdown` + sessão ativa para o `StudyContext` (o provider é dono do countdown; a `EstudarPage` só consome), para que o timer não pare ao trocar de rota.
- **Publicação**: fase `publishing` renderiza `PostPublisher` (continua em App.tsx até a Task 14); `onPublish(article)` → `services.posts.create({ sessionId: session.id, type: article.postType ?? "text", title: article.title, content: article.excerpt })` e navega para `/feed`; `onSkip` volta ao setup.

Mover `ArticlesView.tsx`, `ReaderView.tsx`, `articleData.ts` para `src/content/` (ajustar imports; trocar `setView` por `useNavigate`). O gerador de `mockArticles` que está dentro de `TimerView` vai para `content/articleData.ts` como `export function articlesForTheme(theme: string): Article[]` (mesmo conteúdo).

Rotas: `estudar → <EstudarPage/>`, `leitura → <LeituraListaPage/>`, `leitura/:id → <LeituraPage/>`. `AppLayout` passa a envolver `<StudyProvider>`.

- [ ] **Step 5: Rodar e commitar**

Run: `npm test && npm run typecheck && npm run lint && npm run build` → Expected: PASS. No navegador com `VITE_DEMO_MODE=true npm run dev`: desafio "Demo" (1 min) completa e mostra +10.

```bash
git add -A frontend
git commit --author="Tiago Brito Nário <tiago.tibi.nario@gmail.com>" \
  -m "feat: ligar sessão de estudo aos serviços com timer baseado em horário" \
  -m "Co-Authored-By: Rafael Augusto Oliveira Silva <rafael.a.os@hotmail.com>"
```

---

### Task 13: Feed e detalhe do post com curtidas, salvos e comentários

**Autor:** Rafael · **Coautor:** Monique

**Files:**
- Create: `frontend/src/pages/FeedPage.tsx`, `frontend/src/pages/PostPage.tsx`, `frontend/src/hooks/useMediaUrl.ts`, `frontend/src/pages/feed.test.tsx`
- Modify: `frontend/src/app/router.tsx`, `frontend/src/app/App.tsx` (remover `FeedView`, `PostDetailView`, `INITIAL_ARTICLES`, `INITIAL_COMMENTS`, tipos `FeedArticle`/`Comment` locais)

**Interfaces:**
- Consumes: `services.posts.*`, `services.subjects.list`, `services.media.resolveUrl`, `relativeTime`, `queryKeys`, `DotAvatar`.
- Produces: `FeedPage`, `PostPage` (rota `/feed/:postId`), `useMediaUrl(url: string | null): { src: string | null; error: unknown }`.

- [ ] **Step 1: Testes (falhando)**

```tsx
// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AppRoutes } from "@/app/router";
import { createTestServices, loginDemo, renderWithProviders } from "@/test/renderWithProviders";

async function open(route: string) {
  const services = createTestServices();
  await loginDemo(services);
  return { services, ...renderWithProviders(<AppRoutes />, { route, services }) };
}

describe("Feed", () => {
  it("lista posts, filtra por assunto e abre o detalhe", async () => {
    await open("/feed");
    expect(await screen.findByText("Como eu finalmente entendi Integrais")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /^física$/i }));
    expect(await screen.findByText("Eletromagnetismo desmistificado")).toBeInTheDocument();
    expect(screen.queryByText("Como eu finalmente entendi Integrais")).not.toBeInTheDocument();
    await userEvent.click(screen.getByText("Eletromagnetismo desmistificado"));
    expect(await screen.findByRole("heading", { name: "Eletromagnetismo desmistificado" })).toBeInTheDocument();
  });

  it("curtir atualiza o contador e persiste", async () => {
    const { services } = await open("/feed/p1");
    await userEvent.click(await screen.findByRole("button", { name: /curtir/i }));
    expect(await screen.findByText("48")).toBeInTheDocument();
    expect((await services.posts.get("p1")).likedByMe).toBe(true);
  });

  it("comentar e responder", async () => {
    const { services } = await open("/feed/p2");
    await userEvent.type(await screen.findByPlaceholderText(/comentário/i), "Muito bom!");
    await userEvent.click(screen.getByRole("button", { name: /enviar/i }));
    expect(await screen.findByText("Muito bom!")).toBeInTheDocument();
    expect((await services.posts.get("p2")).commentCount).toBe(1);
  });
});
```

Run: `npm test -- feed` → Expected: FAIL.

- [ ] **Step 2: `useMediaUrl`**

```ts
import { useEffect, useState } from "react";
import { useServices } from "@/services/ServicesContext";

export function useMediaUrl(url: string | null) {
  const { media } = useServices();
  const [state, setState] = useState<{ src: string | null; error: unknown }>({ src: null, error: null });
  useEffect(() => {
    let alive = true;
    if (!url) {
      setState({ src: null, error: null });
      return;
    }
    media.resolveUrl(url).then(
      (src) => alive && setState({ src, error: null }),
      (error) => alive && setState({ src: null, error }),
    );
    return () => {
      alive = false;
    };
  }, [url, media]);
  return state;
}
```

- [ ] **Step 3: `FeedPage`**

Mover `FeedView`. Dados: `useInfiniteQuery({ queryKey: queryKeys.posts(filter), queryFn: ({ pageParam }) => services.posts.list({ ...filter, cursor: pageParam }), initialPageParam: null as string | null, getNextPageParam: (last) => last.nextCursor })`.
- Filtros: "Todos" + um botão por assunto (de `services.subjects.list()`, com o **nome** como texto acessível) + "Salvos" (`savedOnly: true`); o protótipo filtrava por nome em `activeFilter` — trocar por `filter: PostFilter`.
- Card: `author.name`, `author.dotColor`, `author.activeAccessoryId`, assunto (nome/cor via `subjectId`), `title`, excerto = `content.slice(0, 200)`, tempo = texto: `max(1, round(palavras/200)) min`; áudio/vídeo: `formatRecTime(mediaDurationSec)`; data = `relativeTime(createdAt)`; `likeCount`, `commentCount`, `likedByMe`, `savedByMe`.
- Curtir/salvar no card: `useMutation` com `services.posts.like/unlike/save/unsave`, atualizando o post no cache com o retorno (`queryClient.setQueriesData` sobre `["posts"]` e `["post", id]`).
- Clique no card → `navigate(`/feed/${post.id}`)`.
- "Carregar mais" no fim quando `hasNextPage`. Estado vazio em "Salvos": "Você ainda não salvou nenhum post."

- [ ] **Step 4: `PostPage`**

Mover `PostDetailView`; `post` vem de `useQuery(queryKeys.post(postId), () => services.posts.get(postId))`, comentários de `services.posts.listComments`. O título do post vira `<h1>`.
- Botões com `aria-label`: "Curtir"/"Descurtir", "Salvar"/"Remover dos salvos".
- Mídia: se `post.mediaUrl`, `const { src, error } = useMediaUrl(post.mediaUrl)` e renderizar `<audio controls src={src}>` ou `<video controls playsInline src={src}>` dentro do cartão que o protótipo usa; se `mediaUrl` é `null` (posts de exemplo do seed), manter o visual simulado do protótipo (onda/thumbnail) com a legenda "Mídia de exemplo". Se `error`, mostrar "Esta mídia foi gravada em outro navegador e não está disponível aqui." (mock guarda no IndexedDB local).
- Comentários: campo com `placeholder="Escreva um comentário…"` e botão "Enviar" → `services.posts.addComment(post.id, { content })`; "Responder" abre campo com `parentId`; após sucesso, `invalidateQueries(queryKeys.comments(id))` e `queryKeys.post(id)`. Curtidas em comentário do protótipo: **remover** (não há no contrato; registrar em `docs/08-jornada.md` na Task 17).
- Botão voltar → `navigate(-1)`.

- [ ] **Step 5: Rodar e commitar**

Run: `npm test && npm run typecheck && npm run lint && npm run build` → Expected: PASS.

```bash
git add -A frontend
git commit --author="Rafael Augusto Oliveira Silva <rafael.a.os@hotmail.com>" \
  -m "feat: ligar feed, detalhe do post e comentários aos serviços" \
  -m "Co-Authored-By: Monique Ferreira dos Anjos <anjos.moniqueferreira@gmail.com>"
```

---

### Task 14: Publicação com gravação real de áudio e vídeo

**Autor:** Monique · **Coautor:** Tiago

**Files:**
- Create: `frontend/src/hooks/useMediaRecorder.ts`, `frontend/src/hooks/useMediaRecorder.test.ts`, `frontend/src/components/PostPublisher.tsx`, `frontend/src/components/PostPublisher.test.tsx`
- Modify: `frontend/src/pages/EstudarPage.tsx`, `frontend/src/app/App.tsx` (remover `PostPublisher`)

**Interfaces:**
- Consumes: `MEDIA_LIMITS`, `services.media.upload`, `services.posts.create`, `AudioWave`, `formatRecTime`, `errorText`.
- Produces:
  - `type RecorderStatus = "idle" | "requesting" | "recording" | "recorded" | "error"`
  - `useMediaRecorder(kind: "audio" | "video"): { status; seconds: number; blob: Blob | null; previewUrl: string | null; stream: MediaStream | null; error: string | null; start(): Promise<void>; stop(): void; reset(): void }` — para sozinho em `MEDIA_LIMITS[kind].maxSeconds`
  - `isRecordingSupported(): boolean`
  - `PostPublisher({ sessionId, theme, accentColor, onPublished, onSkip }: { sessionId: string | null; theme: string; accentColor: string; onPublished: (result: { postId: string; coinsEarned: number }) => void; onSkip: () => void })`

- [ ] **Step 1: Testes do hook (falhando)**

```ts
// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMediaRecorder } from "./useMediaRecorder";

class FakeRecorder {
  static isTypeSupported = () => true;
  state: "inactive" | "recording" = "inactive";
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor(public stream: MediaStream, public options?: MediaRecorderOptions) {}
  start() { this.state = "recording"; }
  stop() {
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob(["x"], { type: "audio/webm" }) });
    this.onstop?.();
  }
}

function fakeStream(): MediaStream {
  return { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream;
}

describe("useMediaRecorder", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("grava e produz blob", async () => {
    vi.stubGlobal("MediaRecorder", FakeRecorder);
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: vi.fn().mockResolvedValue(fakeStream()) } });
    URL.createObjectURL = vi.fn(() => "blob:preview");
    const { result } = renderHook(() => useMediaRecorder("audio"));
    await act(() => result.current.start());
    expect(result.current.status).toBe("recording");
    act(() => result.current.stop());
    expect(result.current.status).toBe("recorded");
    expect(result.current.blob?.type).toBe("audio/webm");
  });

  it("permissão negada vira mensagem em pt-BR", async () => {
    vi.stubGlobal("MediaRecorder", FakeRecorder);
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn().mockRejectedValue(Object.assign(new Error("denied"), { name: "NotAllowedError" })) },
    });
    const { result } = renderHook(() => useMediaRecorder("audio"));
    await act(() => result.current.start());
    expect(result.current.status).toBe("error");
    expect(result.current.error).toMatch(/permita o acesso ao microfone/i);
  });

  it("navegador sem MediaRecorder", async () => {
    vi.stubGlobal("MediaRecorder", undefined);
    const { result } = renderHook(() => useMediaRecorder("video"));
    await act(() => result.current.start());
    expect(result.current.error).toMatch(/não permite gravar/i);
  });
});
```

Run: `npm test -- useMediaRecorder` → Expected: FAIL.

- [ ] **Step 2: Implementar `useMediaRecorder`**

```ts
import { useCallback, useEffect, useRef, useState } from "react";
import { MEDIA_LIMITS } from "@/services/contracts";

export type RecorderStatus = "idle" | "requesting" | "recording" | "recorded" | "error";

export function isRecordingSupported(): boolean {
  return typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
}

function pickMime(kind: "audio" | "video"): string | undefined {
  const candidates = kind === "audio" ? ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"] : ["video/webm;codecs=vp9,opus", "video/webm", "video/mp4"];
  return candidates.find((t) => MediaRecorder.isTypeSupported?.(t));
}

function describeError(err: unknown, kind: "audio" | "video"): string {
  const device = kind === "audio" ? "microfone" : "câmera e ao microfone";
  const name = (err as { name?: string })?.name;
  if (name === "NotAllowedError" || name === "SecurityError") return `Permita o acesso ao ${device} nas configurações do navegador para gravar.`;
  if (name === "NotFoundError") return `Nenhum ${kind === "audio" ? "microfone" : "dispositivo de câmera"} foi encontrado.`;
  return "Não foi possível iniciar a gravação. Tente de novo.";
}

export function useMediaRecorder(kind: "audio" | "video") {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const startedAt = useRef(0);
  const maxSeconds = MEDIA_LIMITS[kind].maxSeconds;

  const stopTracks = (s: MediaStream | null) => s?.getTracks().forEach((t) => t.stop());

  const stop = useCallback(() => {
    if (recorder.current?.state === "recording") recorder.current.stop();
  }, []);

  const start = useCallback(async () => {
    setError(null);
    if (!isRecordingSupported()) {
      setStatus("error");
      setError("Este navegador não permite gravar. Publique em texto ou use Chrome/Firefox atualizados.");
      return;
    }
    setStatus("requesting");
    try {
      const media = await navigator.mediaDevices.getUserMedia(kind === "audio" ? { audio: true } : { audio: true, video: { width: 640, height: 480 } });
      const mimeType = pickMime(kind);
      const rec = new MediaRecorder(media, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
      rec.onstop = () => {
        const out = new Blob(chunks, { type: chunks[0]?.type || mimeType || `${kind}/webm` });
        setBlob(out);
        setPreviewUrl(URL.createObjectURL(out));
        setSeconds(Math.min(maxSeconds, Math.round((Date.now() - startedAt.current) / 1000)));
        setStatus("recorded");
        stopTracks(media);
        setStream(null);
      };
      recorder.current = rec;
      startedAt.current = Date.now();
      setSeconds(0);
      setStream(media);
      rec.start(1000);
      setStatus("recording");
    } catch (err) {
      setStatus("error");
      setError(describeError(err, kind));
    }
  }, [kind, maxSeconds]);

  useEffect(() => {
    if (status !== "recording") return;
    const id = setInterval(() => {
      const s = Math.floor((Date.now() - startedAt.current) / 1000);
      setSeconds(s);
      if (s >= maxSeconds) stop();
    }, 250);
    return () => clearInterval(id);
  }, [status, maxSeconds, stop]);

  const reset = useCallback(() => {
    stop();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setBlob(null);
    setPreviewUrl(null);
    setSeconds(0);
    setError(null);
    setStatus("idle");
  }, [previewUrl, stop]);

  useEffect(() => () => stopTracks(stream), [stream]);

  return { status, seconds, blob, previewUrl, stream, error, start, stop, reset };
}
```

Run: `npm test -- useMediaRecorder` → Expected: PASS.

- [ ] **Step 3: Teste do `PostPublisher` (falhando)**

```tsx
// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PostPublisher } from "./PostPublisher";
import { createTestServices, loginDemo, renderWithProviders } from "@/test/renderWithProviders";

describe("PostPublisher", () => {
  it("publica texto e informa as moedas ganhas", async () => {
    const services = createTestServices();
    await loginDemo(services);
    const onPublished = vi.fn();
    renderWithProviders(<PostPublisher sessionId={null} theme="Álgebra Linear" accentColor="#22CFD5" onPublished={onPublished} onSkip={() => {}} />, { services });
    expect(screen.getByDisplayValue("O que aprendi sobre Álgebra Linear")).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText(/escreva|conte/i), "Vetores e matrizes.");
    await userEvent.click(screen.getByRole("button", { name: /publicar/i }));
    await vi.waitFor(() => expect(onPublished).toHaveBeenCalledWith({ postId: expect.any(String), coinsEarned: 0 }));
  });

  it("sem suporte a gravação, áudio mostra aviso e texto continua disponível", async () => {
    vi.stubGlobal("MediaRecorder", undefined);
    const services = createTestServices();
    await loginDemo(services);
    renderWithProviders(<PostPublisher sessionId={null} theme="Óptica" accentColor="#FFC23D" onPublished={() => {}} onSkip={() => {}} />, { services });
    await userEvent.click(screen.getByRole("button", { name: /áudio/i }));
    await userEvent.click(screen.getByRole("button", { name: /gravar/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/não permite gravar/i);
    await userEvent.click(screen.getByRole("button", { name: /texto/i }));
    expect(screen.getByRole("button", { name: /publicar/i })).toBeEnabled();
    vi.unstubAllGlobals();
  });
});
```

- [ ] **Step 4: Reescrever `PostPublisher` sobre o hook**

Mover `function PostPublisher` do `App.tsx` para `components/PostPublisher.tsx`, **mantendo o JSX/visual** (seletor Texto/Áudio/Vídeo, título pré-preenchido `O que aprendi sobre ${theme}`, área de texto, botão de gravar, onda `AudioWave`, contador `formatRecTime`, botões Regravar/Publicar/Pular). Trocar a simulação:
- Remover `isRecording/hasRecording/isPlaying/recTime/waveHeights` simulados; usar `const rec = useMediaRecorder(postType === "video" ? "video" : "audio")` (recriar ao trocar de tipo: `key={postType}` num subcomponente `RecorderPanel`).
- Gravar → `rec.start()`; Parar → `rec.stop()`; Regravar → `rec.reset()`; contador = `formatRecTime(rec.seconds)` / máx. `formatRecTime(MEDIA_LIMITS[kind].maxSeconds)`.
- Onda de áudio: animar `AudioWave` enquanto `rec.status === "recording"` (manter o `setInterval` de alturas aleatórias do protótipo — é só visual).
- Vídeo: durante a gravação, `<video muted playsInline autoPlay ref={(el) => el && rec.stream && (el.srcObject = rec.stream)} />`; depois, `<video controls src={rec.previewUrl} />`. Áudio gravado: `<audio controls src={rec.previewUrl} />`.
- Vídeo também aceita arquivo: `<input type="file" accept="video/mp4,video/webm">` com rótulo "Enviar arquivo"; ler a duração com um `<video>` fora da tela (`loadedmetadata` → `duration`) antes de habilitar Publicar; se passar de 120 s ou 50 MB, mostrar o erro correspondente sem enviar.
- `rec.error` aparece num `<ErrorMessage>`-like com `role="alert"`.
- Publicar: `setSubmitting(true)`; se mídia: `const { url, durationSec } = await services.media.upload(blob, kind, seconds)`; depois `const { post, reward } = await services.posts.create({ sessionId, type: postType, title, content, mediaUrl: url, mediaDurationSec: durationSec })`; `onPublished({ postId: post.id, coinsEarned: reward?.coinsEarned ?? 0 })`. Erros de serviço (`MEDIA_TOO_LARGE`, etc.) aparecem com `errorText(err)` e **mantêm o rascunho**. Botão desabilitado enquanto envia (evita duplo envio).
- `canPublish`: texto → título ≥ 3; áudio/vídeo → título ≥ 3 e `blob`/arquivo presentes.

Em `EstudarPage`: fase `publishing` → `<PostPublisher sessionId={session.id} theme={theme} accentColor={subject.color} onPublished={({ postId, coinsEarned }) => { invalidar me/stats/posts/ranking; mostrar "+{coinsEarned} moedas" se > 0; navigate(`/feed/${postId}`); }} onSkip={voltar ao setup} />`.

- [ ] **Step 5: Rodar, testar no navegador e commitar**

Run: `npm test && npm run typecheck && npm run lint && npm run build` → Expected: PASS. No Chrome (`npm run dev`, `http://localhost:5173` é contexto seguro): gravar áudio de 5 s, publicar, abrir o post e tocar; recarregar a página e tocar de novo (IndexedDB).

```bash
git add -A frontend
git commit --author="Monique Ferreira dos Anjos <anjos.moniqueferreira@gmail.com>" \
  -m "feat: gravar e publicar posts em áudio e vídeo pelo navegador" \
  -m "Co-Authored-By: Tiago Brito Nário <tiago.tibi.nario@gmail.com>"
```

---

### Task 15: Loja e Ajustes ligados aos serviços; remover estado legado

**Autor:** Rafael · **Coautor:** Monique

**Files:**
- Create: `frontend/src/pages/LojaPage.tsx`, `frontend/src/pages/AjustesPage.tsx`, `frontend/src/pages/loja-ajustes.test.tsx`
- Modify: `frontend/src/app/router.tsx`, `frontend/src/app/AppLayout.tsx`
- Delete: `frontend/src/app/App.tsx` (tudo migrado; conferir com `grep -rn "app/App" frontend/src` que não há mais imports)

**Interfaces:**
- Consumes: `services.shop.*`, `services.users.updateDot`, `services.users.updateProfile`, `useAuth().logout`, `resetDemoData`, `applyTheme`, `readTheme`, `DOT_COLORS`, `DotAvatar`.
- Produces: `LojaPage`, `AjustesPage`.

- [ ] **Step 1: Testes (falhando)**

```tsx
// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AppRoutes } from "@/app/router";
import { createTestServices, loginDemo, renderWithProviders } from "@/test/renderWithProviders";

async function open(route: string) {
  const services = createTestServices();
  await loginDemo(services);
  return { services, ...renderWithProviders(<AppRoutes />, { route, services }) };
}

describe("Loja", () => {
  it("compra acessório, debita moedas e permite equipar", async () => {
    const { services } = await open("/loja");
    await userEvent.click(await screen.findByRole("button", { name: /comprar laço rosa/i }));
    expect(await screen.findByText("590")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /equipar laço rosa/i }));
    expect((await services.auth.me())?.activeAccessoryId).toBe("bow");
  });

  it("acessório caro aparece bloqueado", async () => {
    await open("/loja");
    expect(await screen.findByRole("button", { name: /comprar coroa dourada/i })).toBeDisabled();
  });
});

describe("Ajustes", () => {
  it("não oferece login com Google", async () => {
    await open("/ajustes");
    expect(await screen.findByRole("heading", { name: /ajustes/i })).toBeInTheDocument();
    expect(screen.queryByText(/google/i)).not.toBeInTheDocument();
  });

  it("altera o nome e sai da conta", async () => {
    const { services } = await open("/ajustes");
    const name = await screen.findByLabelText(/nome/i);
    await userEvent.clear(name);
    await userEvent.type(name, "Gui");
    await userEvent.click(screen.getByRole("button", { name: /salvar nome/i }));
    expect((await services.auth.me())?.name).toBe("Gui");
    await userEvent.click(screen.getByRole("button", { name: /sair/i }));
    expect(await screen.findByRole("heading", { name: /entrar/i })).toBeInTheDocument();
  });
});
```

Run: `npm test -- loja-ajustes` → Expected: FAIL.

- [ ] **Step 2: `LojaPage`**

Mover `ShopView`. Dados: `useCurrentUser()` (`coins`, `dotColor`, `activeAccessoryId`, `unlockedAccessoryIds`) e `useQuery(queryKeys.accessories, services.shop.listAccessories)`.
- Cor: clique em cor de `DOT_COLORS` → `services.users.updateDot({ dotColor })`.
- Acessório não desbloqueado: botão `aria-label="Comprar {nome}"`, desabilitado se `coins < cost` (com o cadeado do protótipo); `useMutation(services.shop.purchase)` com `onSuccess: (user) => queryClient.setQueryData(queryKeys.me, user)`; botão desabilitado enquanto a mutation roda.
- Desbloqueado: `aria-label="Equipar {nome}"` / "Remover {nome}" → `updateDot({ activeAccessoryId })`.
- Erros com `ErrorMessage`.

- [ ] **Step 3: `AjustesPage`**

Mover `SettingsView` com título `<h1>Ajustes</h1>`.
- **Remover** o seletor `loginMethod` com Google/email/senha, o texto "Conectado via Google…", o `resetSent`/"esqueci minha senha" e os imports `Globe` sem uso.
- Seções:
  1. **Perfil**: nome (label "Nome", botão "Salvar nome" → `updateProfile({ name })`);
  2. **Conta**: email + senha atual (botão "Salvar email") e senha atual + nova senha (botão "Alterar senha") → `updateProfile({ email, currentPassword })` / `updateProfile({ currentPassword, newPassword })`; mensagens de sucesso "Salvo!" e erros via `ErrorMessage`;
  3. **Aparência**: tema claro/escuro (`applyTheme`);
  4. **Dados de demonstração** (só se `resetDemoData` existir): botão "Restaurar dados de demonstração" com `confirm("Isso apaga suas mudanças e volta aos dados iniciais. Continuar?")` → `resetDemoData(); queryClient.clear(); navigate("/login")`;
  5. **Sair**: botão "Sair" → `logout()` e `navigate("/login")`.
- Após salvar, `queryClient.setQueryData(queryKeys.me, user)`.

- [ ] **Step 4: Remover o estado legado**

`router.tsx`: `loja → <LojaPage/>`, `ajustes → <AjustesPage/>`. Remover `LegacyStateProvider` do `AppLayout`. Apagar `frontend/src/app/App.tsx`. Rodar `grep -rn "useLegacyState\|app/App\|INITIAL_\|setCoins" frontend/src` → Expected: nenhuma ocorrência.

- [ ] **Step 5: Rodar e commitar**

Run: `npm test && npm run typecheck && npm run lint && npm run build` → Expected: PASS.

```bash
git add -A frontend
git commit --author="Rafael Augusto Oliveira Silva <rafael.a.os@hotmail.com>" \
  -m "feat: ligar loja e ajustes aos serviços e remover login com Google" \
  -m "Co-Authored-By: Monique Ferreira dos Anjos <anjos.moniqueferreira@gmail.com>"
```

---

### Task 16: Integração com o Spotify (embed + conexão opcional por PKCE)

**Autor:** Lucas · **Coautor:** Felipe

**Files:**
- Create: `frontend/src/spotify/{playlists,pkce,spotifyApi,embedController}.ts`, `frontend/src/spotify/pkce.test.ts`, `frontend/src/spotify/spotifyApi.test.ts`, `frontend/src/components/spotify/SpotifyPlayer.tsx`, `frontend/src/pages/SpotifyCallbackPage.tsx`
- Modify: `frontend/src/components/BottomNav.tsx` (bloco Spotify simulado → `<SpotifyPlayer/>`), `frontend/src/app/router.tsx` (rota `/spotify/callback` protegida), `frontend/src/vite-env.d.ts` (já tem `VITE_SPOTIFY_CLIENT_ID`)

**Interfaces:**
- Produces:
  - `CURATED_PLAYLISTS: { id: string; name: string; spotifyUri: string }[]` — 3 playlists de foco públicas do Spotify (buscar no Spotify: "Lofi Beats", "Deep Focus", "Peaceful Piano" — são playlists editoriais públicas; copiar a URI `spotify:playlist:<id>` de cada uma pelo "Compartilhar → Copiar link", convertendo `https://open.spotify.com/playlist/<id>` em `spotify:playlist:<id>`)
  - `pkce.ts`: `generateVerifier(random?: (n) => Uint8Array): string`, `challengeFromVerifier(verifier): Promise<string>`, `buildAuthorizeUrl({ clientId, redirectUri, challenge, state }): string`, `SPOTIFY_SCOPES = ["playlist-read-private"]`
  - `spotifyApi.ts`: `exchangeCode({ clientId, code, verifier, redirectUri, fetchFn? }): Promise<SpotifyToken>`, `getMyPlaylists(token, fetchFn?): Promise<{ id; name; uri; imageUrl: string | null }[]>`, `class SpotifyError extends Error { kind: "not_allowed" | "expired" | "network" | "unknown" }`, `interface SpotifyToken { accessToken: string; expiresAt: number }`, `loadToken(): SpotifyToken | null`, `saveToken(t)`, `clearToken()` (sessionStorage `dotstudy:spotify`)
  - `embedController.ts`: `loadIframeApi(): Promise<IFrameAPI>`, `createController(el: HTMLElement, uri: string): Promise<EmbedController>` com `loadUri(uri)`, `togglePlay()`, `addListener("playback_update", cb)`
  - `SpotifyPlayer` (sem props)

- [ ] **Step 1: Testes do PKCE e da API (falhando)**

```ts
// pkce.test.ts
import { describe, expect, it } from "vitest";
import { buildAuthorizeUrl, challengeFromVerifier, generateVerifier } from "./pkce";

describe("PKCE", () => {
  it("verifier tem 64 caracteres do alfabeto permitido", () => {
    const v = generateVerifier();
    expect(v).toHaveLength(64);
    expect(v).toMatch(/^[A-Za-z0-9\-._~]+$/);
  });
  it("challenge é SHA-256 base64url (vetor do RFC 7636)", async () => {
    expect(await challengeFromVerifier("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });
  it("monta a URL de autorização", () => {
    const url = new URL(buildAuthorizeUrl({ clientId: "abc", redirectUri: "http://127.0.0.1:8080/spotify/callback", challenge: "ch", state: "st" }));
    expect(url.origin + url.pathname).toBe("https://accounts.spotify.com/authorize");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      client_id: "abc", response_type: "code", redirect_uri: "http://127.0.0.1:8080/spotify/callback",
      code_challenge_method: "S256", code_challenge: "ch", state: "st", scope: "playlist-read-private",
    });
  });
});
```

```ts
// spotifyApi.test.ts
import { describe, expect, it, vi } from "vitest";
import { SpotifyError, exchangeCode, getMyPlaylists } from "./spotifyApi";

const json = (status: number, body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status }));

describe("spotifyApi", () => {
  it("troca o code por token", async () => {
    const fetchFn = vi.fn(() => json(200, { access_token: "tok", expires_in: 3600 }));
    const t = await exchangeCode({ clientId: "c", code: "k", verifier: "v", redirectUri: "r", fetchFn, now: () => 1000 });
    expect(t).toEqual({ accessToken: "tok", expiresAt: 1000 + 3600_000 });
  });

  it("lista playlists", async () => {
    const fetchFn = vi.fn(() => json(200, { items: [{ id: "1", name: "Foco", uri: "spotify:playlist:1", images: [{ url: "img" }] }] }));
    expect(await getMyPlaylists({ accessToken: "t", expiresAt: Infinity }, fetchFn)).toEqual([{ id: "1", name: "Foco", uri: "spotify:playlist:1", imageUrl: "img" }]);
  });

  it("403 (fora da allowlist do modo desenvolvedor) vira not_allowed", async () => {
    const fetchFn = vi.fn(() => json(403, { error: { status: 403, message: "User not registered in the Developer Dashboard" } }));
    await expect(getMyPlaylists({ accessToken: "t", expiresAt: Infinity }, fetchFn)).rejects.toMatchObject({ kind: "not_allowed" });
  });

  it("401 vira expired e falha de rede vira network", async () => {
    await expect(getMyPlaylists({ accessToken: "t", expiresAt: Infinity }, vi.fn(() => json(401, {})))).rejects.toMatchObject({ kind: "expired" });
    await expect(getMyPlaylists({ accessToken: "t", expiresAt: Infinity }, vi.fn(() => Promise.reject(new TypeError("fail"))))).rejects.toBeInstanceOf(SpotifyError);
  });
});
```

Run: `npm test -- spotify` → Expected: FAIL.

- [ ] **Step 2: `pkce.ts`**

```ts
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
export const SPOTIFY_SCOPES = ["playlist-read-private"];

export function generateVerifier(random: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string {
  return [...random(64)].map((b) => ALPHABET[b % ALPHABET.length]).join("");
}

function base64url(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function challengeFromVerifier(verifier: string): Promise<string> {
  return base64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
}

export function buildAuthorizeUrl({ clientId, redirectUri, challenge, state }: { clientId: string; redirectUri: string; challenge: string; state: string }): string {
  const params = new URLSearchParams({
    client_id: clientId, response_type: "code", redirect_uri: redirectUri,
    code_challenge_method: "S256", code_challenge: challenge, state, scope: SPOTIFY_SCOPES.join(" "),
  });
  return `https://accounts.spotify.com/authorize?${params}`;
}
```

- [ ] **Step 3: `spotifyApi.ts`**

```ts
export interface SpotifyToken {
  accessToken: string;
  expiresAt: number;
}
export interface SpotifyPlaylist {
  id: string;
  name: string;
  uri: string;
  imageUrl: string | null;
}
type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;

export class SpotifyError extends Error {
  constructor(public readonly kind: "not_allowed" | "expired" | "network" | "unknown", message: string) {
    super(message);
  }
}

async function call(fetchFn: FetchFn, url: string, init?: RequestInit): Promise<unknown> {
  let res: Response;
  try {
    res = await fetchFn(url, init);
  } catch {
    throw new SpotifyError("network", "Sem conexão com o Spotify.");
  }
  if (res.status === 401) throw new SpotifyError("expired", "Sua conexão com o Spotify expirou. Conecte de novo.");
  if (res.status === 403) throw new SpotifyError("not_allowed", "Sua conta do Spotify não está liberada neste app de demonstração.");
  if (!res.ok) throw new SpotifyError("unknown", "O Spotify não respondeu como esperado.");
  return res.json();
}

export async function exchangeCode({ clientId, code, verifier, redirectUri, fetchFn = fetch, now = Date.now }: {
  clientId: string; code: string; verifier: string; redirectUri: string; fetchFn?: FetchFn; now?: () => number;
}): Promise<SpotifyToken> {
  const body = new URLSearchParams({ client_id: clientId, grant_type: "authorization_code", code, redirect_uri: redirectUri, code_verifier: verifier });
  const data = (await call(fetchFn, "https://accounts.spotify.com/api/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body,
  })) as { access_token: string; expires_in: number };
  return { accessToken: data.access_token, expiresAt: now() + data.expires_in * 1000 };
}

export async function getMyPlaylists(token: SpotifyToken, fetchFn: FetchFn = fetch): Promise<SpotifyPlaylist[]> {
  const data = (await call(fetchFn, "https://api.spotify.com/v1/me/playlists?limit=20", {
    headers: { Authorization: `Bearer ${token.accessToken}` },
  })) as { items: { id: string; name: string; uri: string; images?: { url: string }[] | null }[] };
  return data.items.map((p) => ({ id: p.id, name: p.name, uri: p.uri, imageUrl: p.images?.[0]?.url ?? null }));
}

const KEY = "dotstudy:spotify";
export function loadToken(now = Date.now()): SpotifyToken | null {
  try {
    const t = JSON.parse(sessionStorage.getItem(KEY) ?? "null") as SpotifyToken | null;
    return t && t.expiresAt > now + 30_000 ? t : null;
  } catch {
    return null;
  }
}
export function saveToken(t: SpotifyToken) {
  sessionStorage.setItem(KEY, JSON.stringify(t));
}
export function clearToken() {
  sessionStorage.removeItem(KEY);
}
```

Run: `npm test -- spotify` → Expected: PASS.

- [ ] **Step 4: `embedController.ts`**

```ts
export interface EmbedController {
  loadUri(uri: string): void;
  togglePlay(): void;
  addListener(event: "playback_update", cb: (e: { data: { isPaused: boolean } }) => void): void;
  destroy(): void;
}
interface IFrameAPI {
  createController(el: HTMLElement, options: { uri: string; width?: string | number; height?: number }, cb: (c: EmbedController) => void): void;
}
declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: IFrameAPI) => void;
  }
}

let apiPromise: Promise<IFrameAPI> | null = null;

export function loadIframeApi(): Promise<IFrameAPI> {
  apiPromise ??= new Promise((resolve, reject) => {
    window.onSpotifyIframeApiReady = resolve;
    const script = document.createElement("script");
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.async = true;
    script.onerror = () => {
      apiPromise = null;
      reject(new Error("Não foi possível carregar o player do Spotify."));
    };
    document.body.appendChild(script);
  });
  return apiPromise;
}

export async function createController(el: HTMLElement, uri: string): Promise<EmbedController> {
  const api = await loadIframeApi();
  return new Promise((resolve) => api.createController(el, { uri, width: "100%", height: 80 }, resolve));
}
```

- [ ] **Step 5: `SpotifyPlayer`, callback e BottomNav**

`SpotifyPlayer.tsx` substitui o bloco simulado do `BottomNav` mantendo o visual do protótipo (botão verde `#1DB954`, dropdown "Spotify Playlists", nome da playlist ativa, play/pause):
- Estado: `playlists` (começa com `CURATED_PLAYLISTS`), `active` (uri), `isPaused`, `connected` (`loadToken() !== null`), `notice` (string | null).
- Ao abrir o dropdown pela primeira vez, `createController(divRef.current, active)` num `<div>` do próprio dropdown (o embed precisa estar no DOM; altura 80); escutar `playback_update` para `isPaused`. Play/pause da nossa UI → `controller.togglePlay()`; trocar playlist → `controller.loadUri(uri)`.
- Se `import.meta.env.VITE_SPOTIFY_CLIENT_ID` existe e não está conectado: botão "Conectar Spotify" → gerar `verifier` + `state`, guardar ambos em `sessionStorage` (`dotstudy:spotify:pkce`), `location.assign(buildAuthorizeUrl({ clientId, redirectUri: `${location.origin}/spotify/callback`, challenge, state }))`. Sem client id: esconder o botão (só as curadas).
- Conectado: `getMyPlaylists(token)` → adicionar ao topo da lista com o rótulo "Suas playlists"; em `SpotifyError` `not_allowed`/`expired`: `clearToken()`, `connected=false`, `notice = err.message + " Tocando playlists do dot.study."`; `network`: `notice = err.message`. Botão "Desconectar Spotify" → `clearToken()`.
- Se `loadIframeApi` falhar (bloqueador de conteúdo): `notice = "Não foi possível carregar o player do Spotify."` e o resto do app segue normal.

`SpotifyCallbackPage.tsx`: lê `code`, `state`, `error` da URL; confere `state` com o salvo; `exchangeCode(...)` → `saveToken` → `navigate("/", { replace: true })`. Em `error=access_denied` ou state diferente: mostra `ErrorMessage` "Conexão com o Spotify cancelada." e botão "Voltar".

Registrar nas docs (Task 17) as redirect URIs: `http://127.0.0.1:5173/spotify/callback` (dev), URL do CP5 na Vercel + `/spotify/callback`.

- [ ] **Step 6: Rodar e commitar**

Run: `npm test && npm run typecheck && npm run lint && npm run build` → Expected: PASS. No navegador sem `VITE_SPOTIFY_CLIENT_ID`: dropdown mostra as 3 playlists e toca prévia/música no embed.

```bash
git add -A frontend
git commit --author="Lucas Rodrigues Grecco <79089727+lucvs07@users.noreply.github.com>" \
  -m "feat: integrar player do Spotify com playlists curadas e conexão opcional" \
  -m "Co-Authored-By: Felipe Wapf Fettback <wapffelipe@gmail.com>"
```

---

### Task 17: Documentação do CP5 — requisitos, escopo, UML, jornada, roteiro e README

**Autor:** Lucas · **Coautor:** Monique

**Files:**
- Modify: `docs/02-requisitos.md`, `docs/03-escopo.md`, `docs/04-modelagem-uml.md`, `README.md`
- Create: `docs/08-jornada.md`, `docs/11-roteiros-video.md`, `frontend/.env.example`, `frontend/vercel.json`

- [ ] **Step 1: Deploy config**

`frontend/vercel.json`:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

`frontend/.env.example`:

```
# Fonte de dados: "mock" (CP5) ou "api" (CP6)
VITE_DATA_SOURCE=mock
# Liga a dificuldade "Demo" (1 minuto) para gravar vídeos
VITE_DEMO_MODE=false
# Opcional: Client ID público do app no Spotify Developer (PKCE, sem segredo)
VITE_SPOTIFY_CLIENT_ID=
```

- [ ] **Step 2: `docs/02-requisitos.md`**

Manter RF01–RF10 e acrescentar coluna **Status CP5** (`Implementado (mock)`) e as linhas novas:

| # | Requisito | Status CP5 |
|---|---|---|
| RF11 | O sistema deve permitir cadastro e login com email e senha | Implementado (mock) |
| RF12 | O sistema deve permitir comentar, responder, curtir e salvar posts | Implementado (mock) |
| RF13 | O sistema deve permitir publicar posts em áudio e vídeo gravados no navegador | Implementado (mock, mídia no navegador) |
| RF14 | O sistema deve oferecer player do Spotify com playlists de foco e conexão opcional com a conta do usuário | Implementado |
| RF15 | O sistema deve exibir histórico de sessões e estatísticas (sequência de dias, tempo total) | Implementado (mock) |

Substituir a nota de pontuação pela tabela de fórmulas da spec §4 (incluindo boas-vindas +250) e as regras anti-trapaça. RNFs: marcar RNF04 como "cumprido: `services/contracts.ts` + implementação mock trocável por `VITE_DATA_SOURCE`" e RNF06 com a URL do CP5 (placeholder `<URL do CP5>` a ser preenchido pelo grupo na Task 18 — é um dado externo, não um TODO de conteúdo). Adicionar RNF07 "Timer preciso mesmo com a aba em segundo plano" e RNF08 "Mensagens de erro em português em todos os fluxos".

- [ ] **Step 3: `docs/03-escopo.md`**

Dentro do escopo: acrescentar cadastro/login, comentários/curtidas/salvos, posts em áudio/vídeo, Spotify (embed + PKCE opcional), histórico/estatísticas. Fora do escopo: login com Google (removido no CP5), recuperação de senha por email, curtidas em comentários, Web Playback SDK do Spotify. Manter "sistema de eventos" e "apps nativos".

- [ ] **Step 4: `docs/04-modelagem-uml.md`**

Atualizar o diagrama de classes para o modelo da spec §4 (Usuario incorpora cor/acessório; Artigo → Post com `tipo`; Comentario com `parentId`; Curtida; Salvo; TransacaoMoeda; RankingEntry removido com nota "calculado"). Atualizar o caso de uso (adicionar Cadastrar-se, Entrar, Comentar, Curtir/Salvar, Gravar mídia, Ouvir música / Conectar Spotify). Acrescentar, em Mermaid:

1. **Sequência — Login** (Usuário → LoginPage → AuthService(mock) → MockDb/localStorage; ramo `alt` para credencial inválida).
2. **Sequência — Sessão de estudo até publicação** (EstudarPage → SessionService.start → useCountdown → SessionService.completeCycle [+10] → PostPublisher → MediaService.upload (se mídia) → PostService.create [+30 se primeira da sessão] → FeedPage).
3. **Sequência — Compra na loja** (LojaPage → ShopService.purchase; `alt` saldo insuficiente / já possui).
4. **Atividade — Fluxo de estudo** (escolher modo → desafio: dificuldade + assunto/aleatório → sorteio de tema → foco → ciclo concluído? → publicar ou pular; livre: rótulo/foco/pausa/ciclos → loop foco/pausa → resumo).
5. **Atividade — Publicação** (tipo → texto | gravar áudio/vídeo ou enviar arquivo → validar duração/tamanho → enviar → criar post → recompensa?).

Cada diagrama com 1–2 frases dizendo qual tela/serviço do código ele representa (arquivos reais em `frontend/src/...`).

- [ ] **Step 5: `docs/08-jornada.md`**

Seções: "CP4 → CP5" com as decisões e mudanças de escopo (tabela Decisão | Motivo | Impacto): protótipo do Figma Make como base e limpeza de dependências; camada de serviços + mock (RNF04); cadastro/login adicionados; Google removido; fórmulas definidas (+10/+30/+250); anti-trapaça; ranking calculado; `PerfilDot` incorporado ao usuário; `Artigo` → `Post` com tipos; mídia real no navegador; curtidas em comentário removidas; Spotify híbrido por causa das regras de março/2026; modo demo para vídeos; timer baseado em horário. Seção "Próximo: CP6" com o que muda (API Express + Prisma + Postgres, Cloudinary, Docker Compose).

- [ ] **Step 6: `docs/11-roteiros-video.md`**

Roteiro do vídeo do CP5 (2 min), em blocos com tempo, fala e o que aparece na tela:
- 0:00–0:15 problema e proposta (dot + logo);
- 0:15–0:35 cadastro de conta nova (250 moedas);
- 0:35–1:05 desafio "Demo" (1 min, acelerado na edição): assunto aleatório, tema sorteado, anotações, ciclo concluído (+10);
- 1:05–1:25 publicar post em áudio gravado (+30), ver no feed, curtir e comentar;
- 1:25–1:40 ranking do assunto mostrando a posição nova;
- 1:40–1:52 loja: comprar Laço Rosa e equipar;
- 1:52–2:00 Spotify e encerramento com o link do CP5.
Incluir a configuração para gravar: `VITE_DEMO_MODE=true npm run dev`.

- [ ] **Step 7: `README.md`**

Atualizar: stack real (Vite + React + TS + Tailwind; mock em localStorage/IndexedDB; CP6 Express + Prisma + Postgres); estrutura do repositório atual; seção **Como acessar o CP5** (URL `<URL do CP5>`, conta demo `demo@dotstudy.app` / `dotstudy123`, ou criar conta nova); seção **Como rodar localmente** (Node ≥ 20; `npm install`; `npm run dev`; `http://localhost:5173`; `VITE_DEMO_MODE=true` para a dificuldade Demo; `npm test`, `npm run lint`, `npm run build`); aviso de que no CP5 os dados ficam no navegador (botão "Restaurar dados de demonstração" em Ajustes); links novos das docs (08, 11); **Status**: "CP5 — Protótipo funcional (dados mockados)". Tabela da equipe: coluna "Papel no CP5" conforme a divisão dos commits (Monique/Tiago/Rafael: telas e componentes; Felipe/Leonardo: camada de serviços mock e regras; Lucas: infra, CI, Spotify, docs).

- [ ] **Step 8: Verificar e commitar**

Run: `npm run lint && npm test && npm run build` → Expected: PASS. Conferir que os blocos Mermaid renderizam: colar cada um em https://mermaid.live (ou visualizar no GitHub após o push).

```bash
git add -A docs README.md frontend/.env.example frontend/vercel.json
git commit --author="Lucas Rodrigues Grecco <79089727+lucvs07@users.noreply.github.com>" \
  -m "docs: atualizar requisitos, UML, jornada e README para o CP5" \
  -m "Co-Authored-By: Monique Ferreira dos Anjos <anjos.moniqueferreira@gmail.com>"
```

---

### Task 18: Entrega do CP5 (com confirmação do usuário)

**Autor:** Lucas (sem novos commits de código)

Esta task só roda com confirmação explícita do usuário em cada passo que publica algo.

- [ ] **Step 1: Verificação final local**

Run: `npm ci && npm run lint && npm run typecheck && npm test && npm run build` → Expected: tudo verde. Rodar `npm run preview -w frontend` e percorrer: cadastro → desafio → publicar áudio → feed → ranking → loja → ajustes → sair → login demo.

- [ ] **Step 2: Conferir a distribuição de autoria**

Run: `git log main..feat/cp5 --format='%an' | sort | uniq -c` e `git log main..feat/cp5 --format='%(trailers:key=Co-Authored-By,valueonly)' | sort | uniq -c`
Expected: os 6 integrantes aparecem como autores e/ou coautores; nenhum trailer do Claude (`git log main..feat/cp5 | grep -i claude` sem resultado).

- [ ] **Step 3: Pedir confirmação e publicar a branch**

Perguntar ao usuário antes de: `git push -u origin feat/cp5` e `gh pr create --base main --title "CP5 — Protótipo funcional com dados mockados" --body "<resumo das entregas, sem linha de Claude Code>"`.

- [ ] **Step 4: Tarefas do grupo (listar para o usuário, não executar)**

1. Revisar e fazer merge do PR.
2. `git tag cp5 && git push origin cp5` e `git branch release/cp5 cp5 && git push origin release/cp5`.
3. Vercel: novo projeto `dot-study-cp5` apontando para a branch `release/cp5`, *Root Directory* `frontend`, variáveis `VITE_DATA_SOURCE=mock` (e `VITE_SPOTIFY_CLIENT_ID` se o app do Spotify existir).
4. Spotify Developer (opcional): criar o app com a conta Premium, cadastrar redirect URIs (`http://127.0.0.1:5173/spotify/callback` e `<URL do CP5>/spotify/callback`) e até 5 usuários.
5. Preencher `<URL do CP5>` no README e em `docs/02-requisitos.md` (commit de docs).
6. Gravar o vídeo de 2 min seguindo `docs/11-roteiros-video.md` e adicionar o link ao README.
