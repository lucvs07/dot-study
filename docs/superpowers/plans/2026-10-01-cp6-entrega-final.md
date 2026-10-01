# CP6 — Entrega Final (persistência real) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar a camada mock do CP5 por uma API real (Express + Prisma + Postgres) com upload de mídia real, sem reescrever telas, e entregar o app instalável via Docker Compose com a documentação final.

**Architecture:** Um pacote compartilhado `shared/` passa a ser a fonte única do contrato (`contracts.ts`), das regras de pontuação/anti-trapaça (`rules.ts`) e dos dados de catálogo/demo. O frontend continua usando `services/contracts.ts` (agora reexportando o `shared`). Ganha uma implementação `services/api/` escolhida por `VITE_DATA_SOURCE=api`. O `backend/` (Express 5 + Prisma 6) implementa as mesmas regras no servidor, com transações e travas no banco. `docker compose up` sobe Postgres + API + web (nginx fazendo proxy de `/api` e `/media`) em `http://127.0.0.1:8080`.

**Tech Stack:**
- Monorepo: Node 22 (Docker/CI) / Node ≥ 20 local, npm workspaces (`shared`, `frontend`, `backend`), TypeScript 5.6 strict.
- Backend: Express 5, Prisma 6 + PostgreSQL 16, zod 3, jsonwebtoken 9, bcryptjs 3, helmet 8, cors 2, express-rate-limit 7, pino 9 + pino-http 10, multer 2, cloudinary 2.
- Ferramentas e testes: tsx 4, tsup 8, Vitest 3 + supertest 7.
- Infra: Docker Compose, nginx 1.27, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-29-dot-study-cp5-cp6-design.md` (ler §1, §2, §4, §6, §7, §9–§13). Base de código: branch `feat/cp6`, criada de `feat/cp5` (PR #1). O CP5 está descrito no plano `docs/superpowers/plans/2026-09-29-cp5-prototipo-funcional.md`.

## Global Constraints

- Idioma: UI, mensagens de erro da API, commits e docs em **pt-BR**. Identificadores de código em inglês (padrão do CP5).
- O frontend **não muda de comportamento no modo mock**: `VITE_DATA_SOURCE` ausente ou `mock` continua igual ao CP5. Todos os testes existentes do frontend continuam passando.
- Contrato único: tipos, `ServiceError`/`ServiceErrorCode` e `MEDIA_LIMITS` vêm de `shared/src/contracts.ts`; regras vêm de `shared/src/rules.ts`. Backend e frontend importam de `@dot-study/shared`; nada de copiar fórmulas.
- Pontuação (spec §4): ciclo **+10 moedas / +10 pontos** (pontos só com assunto); post **+30 / +30** (máx. 1 recompensa por sessão, só se a sessão tiver ≥ 1 ciclo concluído); cadastro **+250**; compra **−custo**.
- Anti-trapaça no servidor: ciclo aceito só se `agora − (lastCycleAt ?? startedAt) ≥ 0,9 × focusMinutes × 60 000 ms`, com o relógio do servidor; `completedCycles ≤ plannedCycles`.
- Limites de mídia: áudio ≤ 300 s e ≤ 10 MB; vídeo ≤ 120 s e ≤ 50 MB. MIME e assinatura do arquivo validados no servidor.
- **API:**
  - Base `/api/v1`.
  - Erros sempre `{ "error": { "code": <ServiceErrorCode>, "message": <pt-BR> } }`.
  - Status por código (tabela `STATUS_BY_CODE`, Task 2).
  - `/auth/register` e `/auth/login` respondem `{ token, user }`; os demais endpoints devolvem o objeto do contrato direto.
- **Auth:**
  - JWT HS256 com validade `7d`, header `Authorization: Bearer <token>`.
  - O frontend guarda o token em `localStorage["dotstudy:token"]`.
  - Senha com bcryptjs, custo 10, mínimo 8 e máximo 72 caracteres.
- **Portas:**
  - API: 3000.
  - Web no Docker: 8080, em `http://127.0.0.1:8080`.
  - Postgres de desenvolvimento: 5432.
  - Postgres de teste: 5433.
  - Vite: 127.0.0.1:5173.
- Usuário de demo (dado de teste, documentado): `demo@dotstudy.app` / `dotstudy123`, nome "Guilherme"; seed idêntico ao do mock.
- Datas: os serviços do backend gravam timestamps a partir de `deps.now()` (relógio injetável); serialização em ISO 8601.
- Dependências: instalar a versão mais recente da major indicada no Tech Stack e **fixar a versão exata** (sem `^`) em `dependencies`; registrar no report.
- Nada de segredo commitado. Só entram `.env.example` e os arquivos de ambiente sem segredo: `backend/.env.test`, `frontend/.env.demo`, `frontend/.env.api`.
- `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` na raiz passam ao fim de toda task. Para os testes do backend, o Postgres de teste precisa estar no ar: `npm run db:test:up -w backend`.
- **Commits:** sem coautoria do Claude e sem "Generated with Claude Code"; autor e coautor definidos por task. Formato:

```bash
git commit --author="<Autor> <<email>>" -m "<tipo>: <mensagem pt-BR>" -m "Co-Authored-By: <Coautor> <<email>>"
```

| Integrante | Identidade |
|---|---|
| Lucas | `Lucas Rodrigues Grecco <79089727+lucvs07@users.noreply.github.com>` |
| Monique | `Monique Ferreira dos Anjos <anjos.moniqueferreira@gmail.com>` |
| Tiago | `Tiago Brito Nário <tiago.tibi.nario@gmail.com>` |
| Rafael | `Rafael Augusto Oliveira Silva <rafael.a.os@hotmail.com>` |
| Felipe | `Felipe Wapf Fettback <wapffelipe@gmail.com>` |
| Leonardo | `Leonardo Tanaka Cortez <leonardotanaka0513@gmail.com>` |

- O git local já tem committer = Lucas (noreply). Não alterar a configuração do git. Não fazer push nem abrir PR sem confirmação do usuário (Task 17).
- Um hook bloqueia `rm -r`/`rm -f` fora de `/tmp` (inclusive em heredocs) e `curl … | sh`. Use `git rm`/`git mv`, `rm arquivo` sem flags ou `find <dir> -delete`. Se algo for bloqueado, pare e reporte.
- TanStack Query v5: sempre na forma objeto.

## Review Focus

1. **Fuso horário nas estatísticas:**
   - O servidor do Render roda em UTC e o usuário em UTC−3.
   - Um ciclo concluído às 22h de 29/09 no Brasil (01h UTC de 30/09) precisa contar no dia 29 e na sequência de dias desse usuário.
   - O cliente envia `tzOffset` e o servidor calcula os dias no fuso do usuário.
   - Teste: Task 5.
2. **Requisições simultâneas** (clique duplo, duas abas, retry):
   - Duas compras do mesmo acessório debitam uma vez.
   - Duas conclusões do mesmo ciclo pagam uma vez.
   - Duas publicações da mesma sessão recompensam uma vez.
   - A garantia vem do banco (update condicional ou chave única), não de checagem em memória.
   - Testes: Tasks 6, 7 e 8.
3. **Token expirado ou inválido:**
   - A API responde 401 `UNAUTHORIZED`.
   - O frontend apaga o token e volta para `/login`, sem loop de erro nem tela quebrada.
   - Testes: Task 4 (API) e Task 10 (frontend).
4. **API fora do ar ou hibernando** (Render free):
   - O frontend mostra "Acordando o servidor…" após 2 s.
   - Falha de rede vira `ServiceError("NETWORK")` com mensagem em pt-BR.
   - Testes: Tasks 10 e 12.
5. **Upload malicioso ou fora do limite** — rejeitados com o código certo, sem arquivo temporário sobrando:
   - arquivo com MIME falso (ex.: PNG renomeado para `.webm`)
   - arquivo acima do limite
   - duração acima do limite
   - `mediaUrl` de outro usuário ou nunca enviada
   - Teste: Task 9.

Além disso, a Task 3 testa que o seed é idempotente (subir o Compose duas vezes não duplica dados).

---

## Mapa de arquivos (estado ao fim do CP6)

```
package.json                         # workspaces: shared, frontend, backend
docker-compose.yml  .dockerignore  render.yaml
.github/workflows/ci.yml             # jobs: app (shared+frontend), backend (Postgres), docker
shared/
  package.json  tsconfig.json
  src/index.ts  contracts.ts  rules.ts  rules.test.ts  catalog.ts  demo.ts  demo.test.ts
backend/
  package.json  tsconfig.json  tsup.config.ts  vitest.config.ts  Dockerfile  .env.example  .env.test
  prisma/schema.prisma  prisma/migrations/<timestamp>_init/migration.sql
  src/
    server.ts  app.ts  deps.ts  errors.ts  validate.ts  serialize.ts
    config/env.ts
    middleware/auth.ts  middleware/error.ts
    storage/driver.ts  storage/local.ts  storage/cloudinary.ts  storage/index.ts  storage/sniff.ts
    seed/catalog.ts  seed/demo.ts  seed.ts
    modules/auth/{routes,service}.ts
    modules/users/{routes,service}.ts
    modules/subjects/{routes,service}.ts
    modules/sessions/{routes,service}.ts
    modules/posts/{routes,service}.ts
    modules/rankings/{routes,service}.ts
    modules/shop/{routes,service}.ts
    modules/uploads/{routes,service}.ts
  test/
    setup/globalSetup.ts  setup/env.ts  helpers.ts
    health.test.ts  seed.test.ts  auth.test.ts  users.test.ts  sessions.test.ts
    posts.test.ts  rankings.test.ts  shop.test.ts  uploads.test.ts  storage.test.ts
    fixtures/  (pequenos arquivos de mídia gerados no teste)
frontend/
  Dockerfile  nginx.conf  .env.api
  src/services/contracts.ts          # agora: export * from "@dot-study/shared/contracts"
  src/domain/rules.ts                # agora: export * from "@dot-study/shared/rules"
  src/services/api/http.ts  tokens.ts  auth.ts  users.ts  subjects.ts  sessions.ts
                  posts.ts  rankings.ts  shop.ts  media.ts  index.ts  *.test.ts
  src/hooks/useServerWakeup.ts  src/components/ServerStatusBanner.tsx
docs/02-requisitos.md 03-escopo.md 04-modelagem-uml.md 08-jornada.md 09-manual.md
     10-teste-instalacao.md 11-roteiros-video.md
README.md
```

---

### Task 1: Pacote compartilhado `shared/` (contrato, regras, catálogo e dados de demo)

**Autor:** Felipe · **Coautor:** Lucas

**Files:**
- Create: `shared/package.json`, `shared/tsconfig.json`, `shared/src/index.ts`, `shared/src/catalog.ts`, `shared/src/demo.ts`, `shared/src/demo.test.ts`
- Move (`git mv`): `frontend/src/services/contracts.ts` → `shared/src/contracts.ts`; `frontend/src/domain/rules.ts` → `shared/src/rules.ts`; `frontend/src/domain/rules.test.ts` → `shared/src/rules.test.ts`
- Create (reexport): novo `frontend/src/services/contracts.ts`, novo `frontend/src/domain/rules.ts`
- Modify: `frontend/src/services/mock/seed.ts` (usa `catalog` e `demo` do shared), `frontend/package.json` (dependência do workspace), `package.json` raiz (workspaces e scripts), `eslint.config.js` (se preciso), `.prettierignore`/scripts de format

**Interfaces:**
- Produces:
  - `@dot-study/shared/contracts`: todo o conteúdo atual de `contracts.ts`, inalterado.
  - `@dot-study/shared/rules`: todo o conteúdo atual de `rules.ts`. O import interno passa a ser `./contracts`.
  - `@dot-study/shared/catalog`:
    - `SUBJECTS: Subject[]`
    - `ACCESSORIES: Accessory[]`
    - `DEMO_USER = { email: "demo@dotstudy.app", password: "dotstudy123", name: "Guilherme" } as const`
  - `@dot-study/shared/demo`: `HOUR = 3_600_000`, `DAY = 86_400_000`, `DEMO_DATASET` (forma abaixo).
  - `@dot-study/shared` (index): reexporta tudo.

```ts
// forma de DEMO_DATASET (shared/src/demo.ts)
export interface DemoCommunityUser { id: string; name: string; dotColor: string; accessory: string | null }
export interface DemoSession { id: string; userId: string; subjectId: number | null; themeTitle: string | null; focusMinutes: number; cycles: number; msAgo: number }
export interface DemoPost { id: string; authorId: string; subjectId: number; type: "text" | "audio" | "video"; title: string; content: string; msAgo: number; baseLikeCount: number; mediaDurationSec: number | null }
export interface DemoComment { id: string; postId: string; authorId: string; parentId: string | null; content: string; msAgo: number }
export interface DemoDataset {
  demoUserId: "u_demo";
  demoUser: { coins: number; dotColor: string; unlockedAccessoryIds: string[]; createdMsAgo: number };
  community: DemoCommunityUser[];
  communityCreatedMsAgo: number;
  sessions: DemoSession[];          // sessões h1..h12 do demo + sessões seed_<user>_<subject> da comunidade
  posts: DemoPost[];
  comments: DemoComment[];
  likes: { userId: string; postId: string }[];
  saves: { userId: string; postId: string }[];
}
export const DEMO_DATASET: DemoDataset;
```

- [ ] **Step 1: Criar o workspace `shared`**

`shared/package.json`:

```json
{
  "name": "@dot-study/shared",
  "private": true,
  "version": "0.6.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./contracts": "./src/contracts.ts",
    "./rules": "./src/rules.ts",
    "./catalog": "./src/catalog.ts",
    "./demo": "./src/demo.ts"
  },
  "scripts": {
    "typecheck": "tsc -p tsconfig.json",
    "test": "vitest run",
    "lint": "eslint src --max-warnings=0"
  }
}
```

`shared/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "types": []
  },
  "include": ["src"]
}
```

(`DOM` em `lib` só para `Blob` no tipo de `MediaService`.)

Raiz `package.json`: `"workspaces": ["shared", "frontend"]` (o `backend` entra na Task 2). Scripts da raiz passam a rodar em todos os workspaces:

```json
"build": "npm run build --workspaces --if-present",
"typecheck": "npm run typecheck --workspaces --if-present",
"test": "npm test --workspaces --if-present",
"lint": "npm run lint --workspaces --if-present && npm run format:check",
"format": "prettier --write \"{shared,frontend,backend}/**/*.{ts,tsx,css,json}\" \"*.{js,json}\" \".github/**/*.yml\"",
"format:check": "prettier --check \"{shared,frontend,backend}/**/*.{ts,tsx,css,json}\" \"*.{js,json}\" \".github/**/*.yml\""
```

Manter `dev`, `dev:demo`. Em `frontend/package.json` → `"dependencies": { "@dot-study/shared": "0.6.0", ... }`. Rodar `npm install` para criar o link do workspace.

- [ ] **Step 2: Mover contrato e regras**

```bash
git mv frontend/src/services/contracts.ts shared/src/contracts.ts
git mv frontend/src/domain/rules.ts shared/src/rules.ts
git mv frontend/src/domain/rules.test.ts shared/src/rules.test.ts
```

Em `shared/src/rules.ts` e `rules.test.ts`, trocar `@/services/contracts` por `./contracts`. Criar os reexports:

```ts
// frontend/src/services/contracts.ts
export * from "@dot-study/shared/contracts";
```

```ts
// frontend/src/domain/rules.ts
export * from "@dot-study/shared/rules";
```

- [ ] **Step 3: `catalog.ts` e `demo.ts` (dados movidos do mock)**

- **`shared/src/catalog.ts`:** recebe `THEMES`, `SUBJECT_BASE`, `SUBJECTS`, `ACCESSORIES` e `DEMO_USER`, com o mesmo conteúdo de `frontend/src/services/mock/seed.ts`. Ajustes:
  - As cores dos assuntos viram literais hex iguais ao `BRAND`: `#22CFD5`, `#FFC23D`, `#EE1B3F`, `#A35BBF`, `#2CCD2C`.
  - Os tipos são importados de `./contracts`.
- **`shared/src/demo.ts`:** recebe os dados de demo que hoje estão dentro de `buildSeed`. Transcrever valores, textos e ids **exatamente**:
  - `COMMUNITY` vira `community`.
  - `COMMUNITY_CYCLES` vira as sessões `seed_<userId>_<subjectId>`, com 25 min, `cycles` igual ao valor original, `msAgo: 7 * DAY` e tema = primeiro tema do assunto.
  - As 12 sessões `h1..h12` do demo trazem os mesmos `themeTitle`, `focusMinutes` e `msAgo`.
  - Os 4 posts `p1..p4` levam `baseLikeCount` = o antigo `seedLikeCount`.
  - Os 4 comentários `c1/c11/c2/c21`.
  - `likes` `[{u_demo,p2},{u_demo,p4}]` e `saves` `[{u_demo,p2}]`.
  - `demoUser`: `{ coins: 840, dotColor: "#22CFD5", unlockedAccessoryIds: ["hat","glasses"], createdMsAgo: 30 * DAY }`.
  - `communityCreatedMsAgo: 60 * DAY`.

- [ ] **Step 4: `buildSeed` do mock passa a ler o dataset**

Reescrever `frontend/src/services/mock/seed.ts`:
- Reexporta `SUBJECTS`, `ACCESSORIES` e `DEMO_USER` de `@dot-study/shared/catalog`.
- Mantém `hashPassword`, `DEMO_PASSWORD_HASH` e `buildSeed(now)`.
- `buildSeed` monta o mesmo `DbState` de antes a partir de `DEMO_DATASET`, com as mesmas ids, valores e datas relativas.
- Remove as constantes que mudaram de lugar.

**Nenhum teste do mock pode mudar.** Eles são a prova de que o seed ficou idêntico.

- [ ] **Step 5: Teste do dataset (`shared/src/demo.test.ts`)**

```ts
import { describe, expect, it } from "vitest";
import { ACCESSORIES, SUBJECTS } from "./catalog";
import { DEMO_DATASET } from "./demo";

describe("DEMO_DATASET", () => {
  it("tem 12 sessões do demo e sessões da comunidade em todos os assuntos", () => {
    expect(DEMO_DATASET.sessions.filter((s) => s.userId === "u_demo")).toHaveLength(12);
    for (const subject of SUBJECTS) {
      expect(DEMO_DATASET.sessions.some((s) => s.userId !== "u_demo" && s.subjectId === subject.id)).toBe(true);
    }
  });
  it("referencia só temas, assuntos, usuários, posts e acessórios que existem", () => {
    const users = new Set(["u_demo", ...DEMO_DATASET.community.map((c) => c.id)]);
    for (const s of DEMO_DATASET.sessions) {
      expect(users.has(s.userId)).toBe(true);
      if (s.subjectId !== null && s.themeTitle !== null) {
        expect(SUBJECTS[s.subjectId - 1].themes.some((t) => t.title === s.themeTitle)).toBe(true);
      }
    }
    const postIds = new Set(DEMO_DATASET.posts.map((p) => p.id));
    for (const c of DEMO_DATASET.comments) expect(postIds.has(c.postId)).toBe(true);
    for (const a of DEMO_DATASET.demoUser.unlockedAccessoryIds) expect(ACCESSORIES.some((x) => x.id === a)).toBe(true);
  });
});
```

- [ ] **Step 6: Verificar e commitar**

Run: `npm install && npm run lint && npm run typecheck && npm test && npm run build`
Expected:
- Tudo verde.
- Os testes do frontend continuam com a mesma contagem do CP5 (128), menos o `rules.test.ts`, que agora roda no `shared`.
- Os testes do `shared` passam (`rules` + `demo`).

```bash
git add -A shared frontend package.json package-lock.json eslint.config.js .prettierignore
git commit --author="Felipe Wapf Fettback <wapffelipe@gmail.com>" \
  -m "refactor: extrair contrato, regras e dados de demo para o pacote shared" \
  -m "Fonte única para frontend e backend: tipos do contrato, fórmulas de pontuação e anti-trapaça, catálogo e dataset de demonstração." \
  -m "Co-Authored-By: Lucas Rodrigues Grecco <79089727+lucvs07@users.noreply.github.com>"
```

---

### Task 2: Esqueleto do backend — app Express, config, erros, Prisma e infraestrutura de testes

**Autor:** Leonardo · **Coautor:** Lucas

**Files:**
- Create: `backend/package.json`, `backend/tsconfig.json`, `backend/tsup.config.ts`, `backend/vitest.config.ts`, `backend/.env.example`, `backend/.env.test`, `backend/prisma/schema.prisma`, `backend/prisma/migrations/*` (gerada), `backend/src/{server,app,deps,errors,validate}.ts`, `backend/src/config/env.ts`, `backend/src/middleware/{auth,error}.ts`, `backend/src/storage/{driver,local,index}.ts`, `backend/test/setup/{globalSetup,env}.ts`, `backend/test/helpers.ts`, `backend/test/health.test.ts`, `backend/test/storage.test.ts`
- Modify: `package.json` raiz (workspace `backend`), `.gitignore` (`!.env.test`, `backend/uploads/`, `backend/.test-uploads/`)

**Interfaces:**
- Consumes: `ServiceErrorCode` de `@dot-study/shared/contracts`.
- Produces:
  - `loadEnv(source?): Env` (Env com `NODE_ENV, PORT, DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, WEB_ORIGIN, STORAGE_DRIVER, UPLOAD_DIR, AUTH_RATE_LIMIT, LOG_LEVEL`)
  - `class AppError(code: ServiceErrorCode, message: string)` com `.status`; `STATUS_BY_CODE`
  - `parse<T>(schema: z.ZodType<T>, data: unknown): T` (lança `AppError("VALIDATION", primeiraMensagem)`)
  - `interface Deps { env: Env; prisma: PrismaClient; now: () => Date; random: () => number; storage: StorageDriver }`
  - `createApp(deps: Deps): express.Express` — monta `/api/v1` com `GET /health`; tem o comentário `// ROTAS` onde as Tasks 4–9 montam seus routers
  - `requireAuth(env): RequestHandler` e `userIdOf(req): string`
  - `interface StorageDriver { save(input: { tmpPath: string; ext: string; mimeType: string }): Promise<{ url: string }> }`; `createLocalStorage(dir: string): StorageDriver` (URL `/media/<arquivo>`); `createStorage(env): StorageDriver`
  - Testes: `getTestPrisma()`, `resetDb()`, `createTestContext(opts?) → { app, deps, clock, prisma }` com `clock.advance(ms)`
  - Modelos Prisma (abaixo); a Task 3 em diante depende deles

- [ ] **Step 1: Pacote e dependências**

`backend/package.json`:

```json
{
  "name": "@dot-study/backend",
  "private": true,
  "version": "0.6.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch --env-file=.env src/server.ts",
    "build": "tsup",
    "start": "node dist/server.js",
    "typecheck": "tsc -p tsconfig.json",
    "test": "vitest run",
    "lint": "eslint src test --max-warnings=0",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:seed": "tsx --env-file=.env src/seed.ts",
    "db:dev:up": "docker run -d --name dotstudy-pg-dev -e POSTGRES_USER=dotstudy -e POSTGRES_PASSWORD=dotstudy -e POSTGRES_DB=dotstudy -p 5432:5432 -v dotstudy-pg-dev:/var/lib/postgresql/data postgres:16-alpine",
    "db:test:up": "docker run -d --rm --name dotstudy-pg-test -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=dotstudy_test -p 5433:5432 postgres:16-alpine",
    "db:test:down": "docker stop dotstudy-pg-test"
  },
  "dependencies": { "@dot-study/shared": "0.6.0" }
}
```

```bash
npm i -w backend express@5 helmet@8 cors@2 express-rate-limit@7 pino@9 pino-http@10 zod@3 jsonwebtoken@9 bcryptjs@3 multer@2 @prisma/client@6
npm i -D -w backend prisma@6 tsx@4 tsup@8 supertest@7 @types/express@5 @types/cors @types/jsonwebtoken @types/multer @types/supertest typescript@5.6.3 vitest@3
```

Depois de instalar, editar `backend/package.json` e remover o `^` das `dependencies` (versão exata).

`backend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "types": ["node"]
  },
  "include": ["src", "test", "tsup.config.ts", "vitest.config.ts"]
}
```

`backend/tsup.config.ts`:

```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts", "src/seed.ts"],
  format: ["esm"],
  platform: "node",
  target: "node22",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  noExternal: ["@dot-study/shared"],
});
```

`backend/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: ["test/setup/globalSetup.ts"],
    setupFiles: ["test/setup/env.ts"],
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    fileParallelism: false,
    hookTimeout: 30_000,
    testTimeout: 15_000,
  },
});
```

Raiz: `"workspaces": ["shared", "frontend", "backend"]` e `"dev:backend": "npm run dev -w backend"`.

- [ ] **Step 2: Ambientes**

`backend/.env.example`:

```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://dotstudy:dotstudy@127.0.0.1:5432/dotstudy
# Gere com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=troque-por-um-segredo-com-pelo-menos-32-caracteres
JWT_EXPIRES_IN=7d
# Origens do frontend separadas por vírgula
WEB_ORIGIN=http://127.0.0.1:5173
STORAGE_DRIVER=local
UPLOAD_DIR=./uploads
# Obrigatório quando STORAGE_DRIVER=cloudinary (Task 9)
CLOUDINARY_URL=
AUTH_RATE_LIMIT=20
LOG_LEVEL=info
```

`backend/.env.test` (sem segredos; versionado):

```
NODE_ENV=test
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/dotstudy_test
JWT_SECRET=test-secret-test-secret-test-secret-123
JWT_EXPIRES_IN=7d
WEB_ORIGIN=http://127.0.0.1:5173
STORAGE_DRIVER=local
UPLOAD_DIR=./.test-uploads
AUTH_RATE_LIMIT=1000
LOG_LEVEL=silent
```

Em `.gitignore`, adicionar `!.env.test`, `backend/uploads/` e `backend/.test-uploads/`. Conferir que `.env` continua ignorado.

- [ ] **Step 3: Schema Prisma**

`backend/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum SessionMode {
  challenge
  free
}

enum SessionStatus {
  in_progress
  completed
  abandoned
}

enum PostType {
  text
  audio
  video
}

enum CoinReason {
  welcome
  cycle
  post
  purchase
}

enum MediaKind {
  audio
  video
}

model User {
  id                String            @id @default(cuid())
  name              String
  email             String            @unique
  passwordHash      String
  coins             Int               @default(0)
  dotColor          String            @default("#22CFD5")
  activeAccessoryId String?
  createdAt         DateTime
  sessions          StudySession[]
  posts             Post[]
  comments          Comment[]
  likes             Like[]
  saves             Save[]
  accessories       UserAccessory[]
  transactions      CoinTransaction[]
  media             Media[]
}

model Subject {
  id       Int            @id
  name     String
  color    String
  icon     String
  themes   Theme[]
  sessions StudySession[]
  posts    Post[]
}

model Theme {
  id        Int            @id
  title     String
  subjectId Int
  subject   Subject        @relation(fields: [subjectId], references: [id])
  sessions  StudySession[]
}

model StudySession {
  id              String        @id @default(cuid())
  userId          String
  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  mode            SessionMode
  subjectId       Int?
  subject         Subject?      @relation(fields: [subjectId], references: [id])
  themeId         Int?
  theme           Theme?        @relation(fields: [themeId], references: [id])
  label           String?
  focusMinutes    Int
  breakMinutes    Int
  plannedCycles   Int
  completedCycles Int           @default(0)
  notes           String        @default("")
  status          SessionStatus @default(in_progress)
  startedAt       DateTime
  lastCycleAt     DateTime?
  finishedAt      DateTime?
  rewardedPostId  String?       @unique
  posts           Post[]

  @@index([userId, status])
  @@index([subjectId])
}

model Post {
  id               String        @id @default(cuid())
  authorId         String
  author           User          @relation(fields: [authorId], references: [id], onDelete: Cascade)
  sessionId        String?
  session          StudySession? @relation(fields: [sessionId], references: [id], onDelete: SetNull)
  subjectId        Int?
  subject          Subject?      @relation(fields: [subjectId], references: [id])
  type             PostType
  title            String
  content          String        @default("")
  mediaId          String?       @unique
  media            Media?        @relation(fields: [mediaId], references: [id])
  mediaUrl         String?
  mediaDurationSec Int?
  baseLikeCount    Int           @default(0)
  createdAt        DateTime
  likes            Like[]
  saves            Save[]
  comments         Comment[]

  @@index([createdAt(sort: Desc), id(sort: Desc)])
  @@index([subjectId])
}

model Comment {
  id        String    @id @default(cuid())
  postId    String
  post      Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  authorId  String
  author    User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  parentId  String?
  parent    Comment?  @relation("Replies", fields: [parentId], references: [id], onDelete: Cascade)
  replies   Comment[] @relation("Replies")
  content   String
  createdAt DateTime

  @@index([postId, createdAt])
}

model Like {
  userId String
  postId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  post   Post   @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@id([userId, postId])
}

model Save {
  userId String
  postId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  post   Post   @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@id([userId, postId])
}

model Accessory {
  id    String          @id
  name  String
  cost  Int
  users UserAccessory[]
}

model UserAccessory {
  userId      String
  accessoryId String
  unlockedAt  DateTime
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessory   Accessory @relation(fields: [accessoryId], references: [id])

  @@id([userId, accessoryId])
}

model CoinTransaction {
  id        String     @id @default(cuid())
  userId    String
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  amount    Int
  reason    CoinReason
  refId     String?
  createdAt DateTime

  @@index([userId, createdAt])
}

model Media {
  id          String    @id @default(cuid())
  ownerId     String
  owner       User      @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  url         String    @unique
  kind        MediaKind
  durationSec Int
  sizeBytes   Int
  createdAt   DateTime
  post        Post?
}
```

Gerar a migração contra o Postgres de teste:

```bash
npm run db:test:up -w backend
cd backend && DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/dotstudy_test npx prisma migrate dev --name init --skip-seed && cd ..
```

Expected: `backend/prisma/migrations/<timestamp>_init/migration.sql` criado e `Your database is now in sync`.

- [ ] **Step 4: Config, erros e validação**

`backend/src/config/env.ts`:

```ts
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatório"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET precisa ter pelo menos 32 caracteres"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  WEB_ORIGIN: z.string().default("http://127.0.0.1:5173"),
  STORAGE_DRIVER: z.enum(["local"]).default("local"),
  UPLOAD_DIR: z.string().default("./uploads"),
  AUTH_RATE_LIMIT: z.coerce.number().int().positive().default(20),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
});

export type Env = z.infer<typeof schema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = schema.safeParse(source);
  if (!result.success) {
    const lines = result.error.issues.map((i) => `- ${i.path.join(".")}: ${i.message}`);
    throw new Error(`Configuração inválida do backend:\n${lines.join("\n")}`);
  }
  return result.data;
}

export function webOrigins(env: Env): string[] {
  return env.WEB_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean);
}
```

`backend/src/errors.ts`:

```ts
import type { ServiceErrorCode } from "@dot-study/shared/contracts";

export const STATUS_BY_CODE: Record<ServiceErrorCode, number> = {
  VALIDATION: 400,
  INVALID_CREDENTIALS: 401,
  UNAUTHORIZED: 401,
  NOT_OWNED: 403,
  NOT_FOUND: 404,
  EMAIL_TAKEN: 409,
  ALREADY_OWNED: 409,
  INSUFFICIENT_COINS: 409,
  CYCLE_TOO_SOON: 409,
  SESSION_CLOSED: 409,
  MEDIA_TOO_LARGE: 413,
  MEDIA_UNSUPPORTED: 415,
  MEDIA_TOO_LONG: 422,
  NETWORK: 503,
};

export class AppError extends Error {
  constructor(
    public readonly code: ServiceErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }

  get status(): number {
    return STATUS_BY_CODE[this.code];
  }
}

/** Violação de chave única do Prisma (P2002). */
export function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002";
}
```

`backend/src/validate.ts`:

```ts
import type { z } from "zod";
import { AppError } from "./errors";

export function parse<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) throw new AppError("VALIDATION", result.error.issues[0]?.message ?? "Dados inválidos.");
  return result.data;
}
```

- [ ] **Step 5: Middlewares, storage local, deps, app e server**

`backend/src/middleware/error.ts`:

```ts
import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError } from "../errors";

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Rota não encontrada." } });
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  if ((err as { type?: string })?.type === "entity.parse.failed") {
    res.status(400).json({ error: { code: "VALIDATION", message: "JSON inválido." } });
    return;
  }
  if ((err as { type?: string })?.type === "entity.too.large") {
    res.status(413).json({ error: { code: "VALIDATION", message: "Requisição grande demais." } });
    return;
  }
  req.log?.error({ err }, "erro inesperado");
  res.status(500).json({ error: { code: "NETWORK", message: "Erro interno do servidor. Tente de novo em instantes." } });
};
```

`backend/src/middleware/auth.ts`:

```ts
import type { Request, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import type { Env } from "../config/env";
import { AppError } from "../errors";

declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
  }
}

export function signToken(env: Env, userId: string): string {
  return jwt.sign({}, env.JWT_SECRET, { subject: userId, expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"], algorithm: "HS256" });
}

export function requireAuth(env: Env): RequestHandler {
  return (req, _res, next) => {
    const header = req.headers.authorization ?? "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) throw new AppError("UNAUTHORIZED", "Faça login para continuar.");
    try {
      const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
      if (typeof payload === "string" || !payload.sub) throw new Error("sem sub");
      req.userId = payload.sub;
      next();
    } catch {
      throw new AppError("UNAUTHORIZED", "Sua sessão expirou. Faça login de novo.");
    }
  };
}

export function userIdOf(req: Request): string {
  if (!req.userId) throw new AppError("UNAUTHORIZED", "Faça login para continuar.");
  return req.userId;
}
```

`backend/src/storage/driver.ts`:

```ts
export interface SaveInput {
  tmpPath: string;
  ext: string;
  mimeType: string;
}

export interface StorageDriver {
  save(input: SaveInput): Promise<{ url: string }>;
}
```

`backend/src/storage/local.ts`:

```ts
import { randomUUID } from "node:crypto";
import { copyFile, mkdir, rename, unlink } from "node:fs/promises";
import path from "node:path";
import type { StorageDriver } from "./driver";

export function createLocalStorage(dir: string): StorageDriver {
  return {
    async save({ tmpPath, ext }) {
      await mkdir(dir, { recursive: true });
      const name = `${randomUUID()}.${ext}`;
      const target = path.join(dir, name);
      try {
        await rename(tmpPath, target);
      } catch {
        // tmp em outro disco/volume: copia e apaga
        await copyFile(tmpPath, target);
        await unlink(tmpPath);
      }
      return { url: `/media/${name}` };
    },
  };
}
```

`backend/src/storage/index.ts`:

```ts
import type { Env } from "../config/env";
import type { StorageDriver } from "./driver";
import { createLocalStorage } from "./local";

export function createStorage(env: Env): StorageDriver {
  return createLocalStorage(env.UPLOAD_DIR);
}
```

`backend/src/deps.ts`:

```ts
import type { PrismaClient } from "@prisma/client";
import type { Env } from "./config/env";
import type { StorageDriver } from "./storage/driver";

export interface Deps {
  env: Env;
  prisma: PrismaClient;
  now: () => Date;
  random: () => number;
  storage: StorageDriver;
}
```

`backend/src/app.ts`:

```ts
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { webOrigins } from "./config/env";
import type { Deps } from "./deps";
import { errorHandler, notFoundHandler } from "./middleware/error";

export function createApp(deps: Deps): express.Express {
  const { env } = deps;
  const app = express();
  app.disable("x-powered-by");
  if (env.NODE_ENV === "production") app.set("trust proxy", 1);
  app.use(pinoHttp({ level: env.LOG_LEVEL }));
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: webOrigins(env) }));
  app.use(express.json({ limit: "100kb" }));

  if (env.STORAGE_DRIVER === "local") {
    app.use("/media", express.static(env.UPLOAD_DIR, { maxAge: "7d", fallthrough: false, index: false }));
  }

  const api = express.Router();
  api.get("/health", async (_req, res) => {
    await deps.prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok" });
  });
  // ROTAS — as Tasks 4–9 montam aqui: api.use("/auth", createAuthRouter(deps)), etc.

  app.use("/api/v1", api);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
```

`backend/src/server.ts`:

```ts
import { PrismaClient } from "@prisma/client";
import { createApp } from "./app";
import { loadEnv } from "./config/env";
import { createStorage } from "./storage";

const env = loadEnv();
const prisma = new PrismaClient();
const app = createApp({ env, prisma, now: () => new Date(), random: Math.random, storage: createStorage(env) });

const server = app.listen(env.PORT, () => {
  console.log(`dot.study API ouvindo em http://127.0.0.1:${env.PORT}/api/v1`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.close(() => void prisma.$disconnect().then(() => process.exit(0)));
  });
}
```

- [ ] **Step 6: Infra de teste**

`backend/test/setup/env.ts`:

```ts
import path from "node:path";
process.loadEnvFile(path.resolve(import.meta.dirname, "../../.env.test"));
```

`backend/test/setup/globalSetup.ts`:

```ts
import { execSync } from "node:child_process";
import path from "node:path";

export default function setup() {
  const root = path.resolve(import.meta.dirname, "../..");
  process.loadEnvFile(path.join(root, ".env.test"));
  try {
    execSync("npx prisma migrate deploy", { cwd: root, env: process.env, stdio: "pipe" });
  } catch (error) {
    const detail = (error as { stderr?: Buffer }).stderr?.toString() ?? String(error);
    throw new Error(
      `Banco de teste indisponível em ${process.env.DATABASE_URL}.\n` +
        `Suba com: npm run db:test:up -w backend\n\n${detail}`,
    );
  }
}
```

`backend/test/helpers.ts`:

```ts
import { PrismaClient } from "@prisma/client";
import { afterAll } from "vitest";
import { createApp } from "../src/app";
import { loadEnv, type Env } from "../src/config/env";
import type { Deps } from "../src/deps";
import type { StorageDriver } from "../src/storage/driver";
import { createLocalStorage } from "../src/storage/local";

let prisma: PrismaClient | null = null;

export function getTestPrisma(): PrismaClient {
  prisma ??= new PrismaClient();
  return prisma;
}

afterAll(async () => {
  await prisma?.$disconnect();
  prisma = null;
});

const TABLES = [
  "Like", "Save", "Comment", "Post", "Media", "CoinTransaction", "UserAccessory",
  "StudySession", "User", "Theme", "Subject", "Accessory",
];

export async function resetDb(): Promise<void> {
  const list = TABLES.map((t) => `"${t}"`).join(", ");
  await getTestPrisma().$executeRawUnsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
}

export interface TestClock {
  current: Date;
  advance(ms: number): void;
}

export function createTestContext(opts: { storage?: StorageDriver; random?: () => number; env?: Partial<Env> } = {}) {
  const env = { ...loadEnv(process.env), ...opts.env };
  const clock: TestClock = {
    current: new Date("2026-09-29T12:00:00.000Z"),
    advance(ms) {
      this.current = new Date(this.current.getTime() + ms);
    },
  };
  const deps: Deps = {
    env,
    prisma: getTestPrisma(),
    now: () => clock.current,
    random: opts.random ?? (() => 0),
    storage: opts.storage ?? createLocalStorage(env.UPLOAD_DIR),
  };
  return { app: createApp(deps), deps, clock, prisma: deps.prisma };
}
```

- [ ] **Step 7: Testes de saúde, erros e storage (falhando → passando)**

`backend/test/health.test.ts`:

```ts
import request from "supertest";
import { describe, expect, it } from "vitest";
import { loadEnv } from "../src/config/env";
import { AppError, STATUS_BY_CODE } from "../src/errors";
import { createTestContext } from "./helpers";

describe("API base", () => {
  it("GET /api/v1/health responde ok com o banco no ar", async () => {
    const { app } = createTestContext();
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("rota inexistente devolve erro no formato do contrato", async () => {
    const { app } = createTestContext();
    const res = await request(app).get("/api/v1/nao-existe");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: "NOT_FOUND", message: "Rota não encontrada." } });
  });

  it("JSON inválido vira VALIDATION", async () => {
    const { app } = createTestContext();
    const res = await request(app).post("/api/v1/health").set("Content-Type", "application/json").send("{x");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION");
  });

  it("CORS libera só a origem configurada", async () => {
    const { app } = createTestContext();
    const ok = await request(app).get("/api/v1/health").set("Origin", "http://127.0.0.1:5173");
    expect(ok.headers["access-control-allow-origin"]).toBe("http://127.0.0.1:5173");
    const other = await request(app).get("/api/v1/health").set("Origin", "https://malicioso.example");
    expect(other.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("AppError mapeia status por código", () => {
    expect(new AppError("EMAIL_TAKEN", "x").status).toBe(409);
    expect(STATUS_BY_CODE.MEDIA_TOO_LARGE).toBe(413);
  });

  it("config inválida explica o problema em pt-BR", () => {
    expect(() => loadEnv({ DATABASE_URL: "x", JWT_SECRET: "curto" })).toThrow(/JWT_SECRET precisa ter pelo menos 32 caracteres/);
  });
});
```

`backend/test/storage.test.ts`:

```ts
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createLocalStorage } from "../src/storage/local";

describe("storage local", () => {
  it("move o arquivo temporário para a pasta de uploads e devolve /media/<nome>", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "dotstudy-up-"));
    const tmp = path.join(await mkdtemp(path.join(os.tmpdir(), "dotstudy-tmp-")), "f");
    await writeFile(tmp, "conteudo");
    const { url } = await createLocalStorage(dir).save({ tmpPath: tmp, ext: "webm", mimeType: "audio/webm" });
    expect(url).toMatch(/^\/media\/[0-9a-f-]{36}\.webm$/);
    expect(await readFile(path.join(dir, path.basename(url)), "utf8")).toBe("conteudo");
    expect(existsSync(tmp)).toBe(false);
  });
});
```

Run: `npm test -w backend`
Expected: os testes de health falham antes de o `app.ts` existir e passam depois; storage passa.

- [ ] **Step 8: Verificar e commitar**

Run: `npm run lint && npm run typecheck && npm test && npm run build`
Expected: tudo verde. `backend/dist/server.js` e `backend/dist/seed.js` só existem a partir da Task 3; por enquanto basta o tsup gerar `server.js`. Até a Task 3, manter só `src/server.ts` em `entry`; a Task 3 adiciona o `seed.ts`.

Em seguida, com `backend/.env` copiado do `.env.example` e `npm run db:dev:up -w backend`:
- `npx -w backend prisma migrate deploy`
- `npm run dev:backend`
- `curl -s http://127.0.0.1:3000/api/v1/health` → `{"status":"ok"}`

Encerrar o servidor e o container de desenvolvimento.

```bash
git add -A backend package.json package-lock.json .gitignore
git commit --author="Leonardo Tanaka Cortez <leonardotanaka0513@gmail.com>" \
  -m "feat: criar backend Express com Prisma, erros padronizados e testes" \
  -m "Co-Authored-By: Lucas Rodrigues Grecco <79089727+lucvs07@users.noreply.github.com>"
```

---

### Task 3: Seed do banco (catálogo + dados de demo), idempotente

**Autor:** Felipe · **Coautor:** Leonardo

**Files:**
- Create: `backend/src/seed/catalog.ts`, `backend/src/seed/demo.ts`, `backend/src/seed.ts`, `backend/test/seed.test.ts`
- Modify: `backend/tsup.config.ts` (`entry` inclui `src/seed.ts`), `backend/test/helpers.ts` (`resetDb` volta a semear o catálogo)

**Interfaces:**
- Consumes: `SUBJECTS`, `ACCESSORIES`, `DEMO_USER` (catalog), `DEMO_DATASET`, `HOUR`, `DAY` (demo), `computeSubjectScores` (rules).
- Produces:
  - `seedCatalog(prisma): Promise<void>` (upsert de assuntos, temas e acessórios)
  - `seedDemo(prisma, now: Date): Promise<{ created: boolean }>` (não faz nada se `u_demo` já existe)
  - `resetDb()` passa a terminar com `seedCatalog`
  - Os ids do dataset (`u_demo`, `p1`…`p4`, `h1`…`h12`, `c1`…) viram ids reais no banco

- [ ] **Step 1: Teste (falhando)**

`backend/test/seed.test.ts`:

```ts
import { computeSubjectScores } from "@dot-study/shared/rules";
import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it } from "vitest";
import { seedDemo } from "../src/seed/demo";
import { getTestPrisma, resetDb } from "./helpers";

const NOW = new Date("2026-09-29T12:00:00.000Z");

describe("seed", () => {
  beforeEach(resetDb);

  it("catálogo tem 5 assuntos, 30 temas e 10 acessórios", async () => {
    const prisma = getTestPrisma();
    expect(await prisma.subject.count()).toBe(5);
    expect(await prisma.theme.count()).toBe(30);
    expect(await prisma.accessory.count()).toBe(10);
  });

  it("cria o usuário demo igual ao mock", async () => {
    const prisma = getTestPrisma();
    expect(await seedDemo(prisma, NOW)).toEqual({ created: true });
    const demo = await prisma.user.findUniqueOrThrow({ where: { email: "demo@dotstudy.app" }, include: { accessories: true } });
    expect(demo).toMatchObject({ id: "u_demo", name: "Guilherme", coins: 840 });
    expect(demo.accessories.map((a) => a.accessoryId).sort()).toEqual(["glasses", "hat"]);
    expect(await bcrypt.compare("dotstudy123", demo.passwordHash)).toBe(true);
    expect(await prisma.post.count()).toBe(4);
    expect(await prisma.comment.count()).toBe(4);
    expect(await prisma.studySession.count({ where: { userId: "u_demo" } })).toBe(12);
  });

  it("ranking de Matemática bate com o do mock (Ana 510, Rafael 420, Carla 360, demo 30)", async () => {
    const prisma = getTestPrisma();
    await seedDemo(prisma, NOW);
    const sessions = await prisma.studySession.findMany();
    const posts = await prisma.post.findMany({ select: { authorId: true, subjectId: true } });
    const scores = computeSubjectScores(1, sessions.map((s) => ({ ...s, startedAt: s.startedAt.toISOString(), lastCycleAt: s.lastCycleAt?.toISOString() ?? null, finishedAt: s.finishedAt?.toISOString() ?? null })), posts);
    expect(scores.get("u_ana")).toBe(510);
    expect(scores.get("u_rafaelc")).toBe(420);
    expect(scores.get("u_carla")).toBe(360);
    expect(scores.get("u_demo")).toBe(30);
  });

  it("rodar de novo não duplica nada (Compose reiniciando)", async () => {
    const prisma = getTestPrisma();
    await seedDemo(prisma, NOW);
    const before = { users: await prisma.user.count(), posts: await prisma.post.count(), sessions: await prisma.studySession.count() };
    expect(await seedDemo(prisma, new Date(NOW.getTime() + 3_600_000))).toEqual({ created: false });
    expect({ users: await prisma.user.count(), posts: await prisma.post.count(), sessions: await prisma.studySession.count() }).toEqual(before);
  });

  it("usuários da comunidade não conseguem logar (senha aleatória)", async () => {
    const prisma = getTestPrisma();
    await seedDemo(prisma, NOW);
    const ana = await prisma.user.findUniqueOrThrow({ where: { id: "u_ana" } });
    expect(await bcrypt.compare("dotstudy123", ana.passwordHash)).toBe(false);
  });
});
```

(O `computeSubjectScores` recebe `StudySession` do contrato; o teste converte as datas. Se o TS reclamar de tipos dos enums, fazer um `as` explícito no teste.)

Run: `npm test -w backend -- seed` → FAIL.

- [ ] **Step 2: Implementar**

`backend/src/seed/catalog.ts`:

```ts
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
```

`backend/src/seed/demo.ts`:

```ts
import { randomBytes } from "node:crypto";
import { DEMO_USER, SUBJECTS } from "@dot-study/shared/catalog";
import { DEMO_DATASET } from "@dot-study/shared/demo";
import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function seedDemo(prisma: PrismaClient, now: Date): Promise<{ created: boolean }> {
  const d = DEMO_DATASET;
  if (await prisma.user.findUnique({ where: { id: d.demoUserId } })) return { created: false };
  const ago = (ms: number) => new Date(now.getTime() - ms);

  await prisma.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        id: d.demoUserId, name: DEMO_USER.name, email: DEMO_USER.email,
        passwordHash: await bcrypt.hash(DEMO_USER.password, 10),
        coins: d.demoUser.coins, dotColor: d.demoUser.dotColor, createdAt: ago(d.demoUser.createdMsAgo),
        accessories: { create: d.demoUser.unlockedAccessoryIds.map((accessoryId) => ({ accessoryId, unlockedAt: ago(d.demoUser.createdMsAgo) })) },
      },
    });
    for (const c of d.community) {
      await tx.user.create({
        data: {
          id: c.id, name: c.name, email: `${c.id.slice(2)}@exemplo.dotstudy.app`,
          passwordHash: await bcrypt.hash(randomBytes(24).toString("hex"), 10),
          dotColor: c.dotColor, activeAccessoryId: c.accessory, createdAt: ago(d.communityCreatedMsAgo),
          accessories: c.accessory ? { create: [{ accessoryId: c.accessory, unlockedAt: ago(d.communityCreatedMsAgo) }] } : undefined,
        },
      });
    }
    for (const s of d.sessions) {
      const theme = s.subjectId ? SUBJECTS[s.subjectId - 1].themes.find((t) => t.title === s.themeTitle) ?? null : null;
      const end = ago(s.msAgo);
      await tx.studySession.create({
        data: {
          id: s.id, userId: s.userId, mode: s.subjectId ? "challenge" : "free", subjectId: s.subjectId, themeId: theme?.id ?? null,
          label: s.subjectId ? null : s.themeTitle, focusMinutes: s.focusMinutes, breakMinutes: s.subjectId ? 0 : 5,
          plannedCycles: s.cycles, completedCycles: s.cycles, status: "completed",
          startedAt: new Date(end.getTime() - s.focusMinutes * s.cycles * 60_000), lastCycleAt: end, finishedAt: end,
        },
      });
    }
    for (const p of d.posts) {
      await tx.post.create({
        data: {
          id: p.id, authorId: p.authorId, subjectId: p.subjectId, type: p.type, title: p.title, content: p.content,
          mediaDurationSec: p.mediaDurationSec, baseLikeCount: p.baseLikeCount, createdAt: ago(p.msAgo),
        },
      });
    }
    // comentários pais antes das respostas
    for (const c of [...d.comments].sort((a, b) => Number(a.parentId !== null) - Number(b.parentId !== null))) {
      await tx.comment.create({ data: { id: c.id, postId: c.postId, authorId: c.authorId, parentId: c.parentId, content: c.content, createdAt: ago(c.msAgo) } });
    }
    await tx.like.createMany({ data: d.likes });
    await tx.save.createMany({ data: d.saves });
  }, { timeout: 30_000 });
  return { created: true };
}
```

`backend/src/seed.ts`:

```ts
import { PrismaClient } from "@prisma/client";
import { loadEnv } from "./config/env";
import { seedCatalog } from "./seed/catalog";
import { seedDemo } from "./seed/demo";

loadEnv(); // falha cedo com mensagem clara se faltar configuração
const prisma = new PrismaClient();
try {
  await seedCatalog(prisma);
  const { created } = await seedDemo(prisma, new Date());
  console.log(created ? "Seed: dados de demonstração criados." : "Seed: dados de demonstração já existiam, nada a fazer.");
} finally {
  await prisma.$disconnect();
}
```

Em `helpers.ts`, `resetDb()` passa a terminar com `await seedCatalog(getTestPrisma())`. No `tsup.config.ts`, `entry: ["src/server.ts", "src/seed.ts"]`.

- [ ] **Step 3: Verificar e commitar**

Run: `npm test -w backend && npm run lint && npm run typecheck && npm run build`
Expected: PASS. `backend/dist/seed.js` existe.

```bash
git add -A backend
git commit --author="Felipe Wapf Fettback <wapffelipe@gmail.com>" \
  -m "feat: semear catálogo e dados de demonstração no banco" \
  -m "Co-Authored-By: Leonardo Tanaka Cortez <leonardotanaka0513@gmail.com>"
```

---

### Task 4: Autenticação (cadastro, login, `/auth/me`) com JWT e rate limit

**Autor:** Leonardo · **Coautor:** Felipe

**Files:**
- Create: `backend/src/serialize.ts`, `backend/src/modules/auth/service.ts`, `backend/src/modules/auth/routes.ts`, `backend/test/auth.test.ts`
- Modify: `backend/src/app.ts` (monta `/auth`), `backend/test/helpers.ts` (`loginAs`)

**Interfaces:**
- Consumes: `Deps`, `AppError`, `parse`, `signToken`, `requireAuth`, `userIdOf`, `COINS`.
- Produces:
  - `serialize.ts`: `userInclude`, `toUser(record): User`, `toAuthor(record): Author`
  - `createAuthService(deps)`:
    - `register(body) → { token, user }`
    - `login(body) → { token, user }`
    - `me(userId) → User`
  - `createAuthRouter(deps): Router`:
    - `POST /register` → 201
    - `POST /login` → 200
    - `GET /me` → 200 `User`
  - Helper de teste: `loginAs(app, email?, password?) → { token, user }` (padrão: usuário demo)

- [ ] **Step 1: Testes (falhando)**

`backend/test/auth.test.ts`:

```ts
import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { seedDemo } from "../src/seed/demo";
import { createTestContext, getTestPrisma, loginAs, resetDb } from "./helpers";

describe("auth", () => {
  beforeEach(async () => {
    await resetDb();
    await seedDemo(getTestPrisma(), new Date("2026-09-29T12:00:00.000Z"));
  });

  it("cadastro cria usuário com 250 moedas, registra a transação e devolve token", async () => {
    const { app, prisma } = createTestContext();
    const res = await request(app).post("/api/v1/auth/register").send({ name: " Nova Pessoa ", email: " Nova@Teste.com ", password: "segredo12" });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ name: "Nova Pessoa", email: "nova@teste.com", coins: 250, unlockedAccessoryIds: [], activeAccessoryId: null });
    expect(typeof res.body.token).toBe("string");
    expect(await prisma.coinTransaction.findMany({ where: { userId: res.body.user.id } })).toEqual([expect.objectContaining({ amount: 250, reason: "welcome" })]);
  });

  it("email existente em qualquer caixa dá 409 EMAIL_TAKEN", async () => {
    const { app } = createTestContext();
    const res = await request(app).post("/api/v1/auth/register").send({ name: "Outra", email: "DEMO@dotstudy.app", password: "segredo12" });
    expect(res.status).toBe(409);
    expect(res.body.error).toEqual({ code: "EMAIL_TAKEN", message: "Já existe uma conta com esse email." });
  });

  it("valida nome, email e senha com mensagens em pt-BR", async () => {
    const { app } = createTestContext();
    const bad = async (body: object) => (await request(app).post("/api/v1/auth/register").send(body)).body.error;
    expect(await bad({ name: "A", email: "a@b.com", password: "segredo12" })).toEqual({ code: "VALIDATION", message: "Informe seu nome (mínimo 2 letras)." });
    expect(await bad({ name: "Ana", email: "sem-arroba", password: "segredo12" })).toEqual({ code: "VALIDATION", message: "Informe um email válido." });
    expect(await bad({ name: "Ana", email: "a@b.com", password: "123" })).toEqual({ code: "VALIDATION", message: "A senha precisa ter pelo menos 8 caracteres." });
  });

  it("login do demo ignora caixa/espaços e /auth/me devolve o usuário", async () => {
    const { app } = createTestContext();
    const res = await request(app).post("/api/v1/auth/login").send({ email: "  DEMO@dotstudy.APP ", password: "dotstudy123" });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: "u_demo", name: "Guilherme", coins: 840, unlockedAccessoryIds: ["hat", "glasses"] });
    const me = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${res.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.email).toBe("demo@dotstudy.app");
    expect(me.body).not.toHaveProperty("passwordHash");
  });

  it("senha errada dá 401 INVALID_CREDENTIALS", async () => {
    const { app } = createTestContext();
    const res = await request(app).post("/api/v1/auth/login").send({ email: "demo@dotstudy.app", password: "errada123" });
    expect(res.status).toBe(401);
    expect(res.body.error).toEqual({ code: "INVALID_CREDENTIALS", message: "Email ou senha incorretos." });
  });

  it("sem token, token inválido ou expirado → 401 UNAUTHORIZED", async () => {
    const { app, deps } = createTestContext();
    expect((await request(app).get("/api/v1/auth/me")).body.error.code).toBe("UNAUTHORIZED");
    expect((await request(app).get("/api/v1/auth/me").set("Authorization", "Bearer lixo")).status).toBe(401);
    const expired = jwt.sign({}, deps.env.JWT_SECRET, { subject: "u_demo", expiresIn: -10 });
    const res = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toEqual({ code: "UNAUTHORIZED", message: "Sua sessão expirou. Faça login de novo." });
  });

  it("token de usuário apagado → 401", async () => {
    const { app, prisma } = createTestContext();
    const { token } = await loginAs(app);
    await prisma.user.delete({ where: { id: "u_demo" } });
    expect((await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`)).status).toBe(401);
  });

  it("rate limit em /auth devolve 429 em pt-BR", async () => {
    const { app } = createTestContext({ env: { AUTH_RATE_LIMIT: 2 } });
    for (let i = 0; i < 2; i++) await request(app).post("/api/v1/auth/login").send({ email: "x@y.com", password: "12345678" });
    const res = await request(app).post("/api/v1/auth/login").send({ email: "x@y.com", password: "12345678" });
    expect(res.status).toBe(429);
    expect(res.body.error).toEqual({ code: "VALIDATION", message: "Muitas tentativas. Aguarde alguns minutos e tente de novo." });
  });
});
```

Run: `npm test -w backend -- auth` → FAIL.

- [ ] **Step 2: Implementar**

`backend/src/serialize.ts`:

```ts
import type { Author, User } from "@dot-study/shared/contracts";
import type { Prisma } from "@prisma/client";

export const userInclude = {
  accessories: { select: { accessoryId: true }, orderBy: { unlockedAt: "asc" } },
} satisfies Prisma.UserInclude;

export type UserRecord = Prisma.UserGetPayload<{ include: typeof userInclude }>;

export function toUser(u: UserRecord): User {
  return {
    id: u.id, name: u.name, email: u.email, coins: u.coins, dotColor: u.dotColor,
    activeAccessoryId: u.activeAccessoryId, unlockedAccessoryIds: u.accessories.map((a) => a.accessoryId),
    createdAt: u.createdAt.toISOString(),
  };
}

export function toAuthor(u: { id: string; name: string; dotColor: string; activeAccessoryId: string | null }): Author {
  return { id: u.id, name: u.name, dotColor: u.dotColor, activeAccessoryId: u.activeAccessoryId };
}
```

(Ordenar `unlockedAt` asc dá `["hat","glasses"]` no demo, que foram criados juntos; se a ordem empatar, ordenar por `unlockedAt` e depois pela posição no catálogo. O seed cria na ordem do dataset, e o Postgres preserva a ordem de inserção na prática, mas o teste exige `["hat","glasses"]`. Se ficar instável, adicionar `accessoryId` como segundo critério **não** serve (`glasses` < `hat`). Nesse caso o seed grava `hat` 1 ms antes de `glasses`.)

`backend/src/modules/auth/service.ts`:

```ts
import { COINS } from "@dot-study/shared/rules";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Deps } from "../../deps";
import { AppError, isUniqueViolation } from "../../errors";
import { signToken } from "../../middleware/auth";
import { toUser, userInclude } from "../../serialize";
import { parse } from "../../validate";

export const emailSchema = z.string({ required_error: "Informe um email válido." }).trim().toLowerCase().email("Informe um email válido.");
export const passwordSchema = z
  .string({ required_error: "A senha precisa ter pelo menos 8 caracteres." })
  .min(8, "A senha precisa ter pelo menos 8 caracteres.")
  .max(72, "A senha pode ter no máximo 72 caracteres.");
export const nameSchema = z.string({ required_error: "Informe seu nome (mínimo 2 letras)." }).trim().min(2, "Informe seu nome (mínimo 2 letras).").max(60, "O nome pode ter no máximo 60 caracteres.");

const registerSchema = z.object({ name: nameSchema, email: emailSchema, password: passwordSchema });
const loginSchema = z.object({ email: emailSchema, password: z.string({ required_error: "Informe sua senha." }).min(1, "Informe sua senha.") });

export function createAuthService(deps: Deps) {
  const { prisma, env } = deps;
  return {
    async register(body: unknown) {
      const { name, email, password } = parse(registerSchema, body);
      if (await prisma.user.findUnique({ where: { email } })) throw new AppError("EMAIL_TAKEN", "Já existe uma conta com esse email.");
      const passwordHash = await bcrypt.hash(password, 10);
      const now = deps.now();
      try {
        const user = await prisma.$transaction(async (tx) => {
          const created = await tx.user.create({ data: { name, email, passwordHash, coins: COINS.welcome, createdAt: now }, include: userInclude });
          await tx.coinTransaction.create({ data: { userId: created.id, amount: COINS.welcome, reason: "welcome", createdAt: now } });
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
```

`backend/src/modules/auth/routes.ts`:

```ts
import { Router } from "express";
import rateLimit from "express-rate-limit";
import type { Deps } from "../../deps";
import { requireAuth, userIdOf } from "../../middleware/auth";
import { createAuthService } from "./service";

export function createAuthRouter(deps: Deps): Router {
  const auth = createAuthService(deps);
  const limiter = rateLimit({
    windowMs: 15 * 60_000,
    limit: deps.env.AUTH_RATE_LIMIT,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ error: { code: "VALIDATION", message: "Muitas tentativas. Aguarde alguns minutos e tente de novo." } });
    },
  });
  const router = Router();
  router.post("/register", limiter, async (req, res) => {
    res.status(201).json(await auth.register(req.body));
  });
  router.post("/login", limiter, async (req, res) => {
    res.json(await auth.login(req.body));
  });
  router.get("/me", requireAuth(deps.env), async (req, res) => {
    res.json(await auth.me(userIdOf(req)));
  });
  return router;
}
```

`app.ts`, no ponto `// ROTAS`: `api.use("/auth", createAuthRouter(deps));`. Em `helpers.ts`:

```ts
import request from "supertest";
import type { Express } from "express";

export async function loginAs(app: Express, email = "demo@dotstudy.app", password = "dotstudy123") {
  const res = await request(app).post("/api/v1/auth/login").send({ email, password });
  if (res.status !== 200) throw new Error(`login falhou: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body as { token: string; user: { id: string; coins: number } };
}
```

(Um rate limiter por app, criado dentro de `createAuthRouter`. Assim cada `createTestContext` tem o próprio contador.)

- [ ] **Step 3: Verificar e commitar**

Run: `npm test -w backend && npm run lint && npm run typecheck` → PASS.

```bash
git add -A backend
git commit --author="Leonardo Tanaka Cortez <leonardotanaka0513@gmail.com>" \
  -m "feat: implementar cadastro, login e sessão com JWT na API" \
  -m "Co-Authored-By: Felipe Wapf Fettback <wapffelipe@gmail.com>"
```

---

### Task 5: Usuário — perfil, dot e estatísticas no fuso do usuário

**Autor:** Felipe · **Coautor:** Leonardo

**Files:**
- Create: `backend/src/modules/users/{service,routes}.ts`, `backend/test/users.test.ts`
- Modify: `shared/src/rules.ts` e `shared/src/rules.test.ts` (dia/sequência com deslocamento de fuso), `backend/src/app.ts`

**Interfaces:**
- Consumes: `emailSchema`, `passwordSchema` e `nameSchema` (auth/service), `toUser`, `userInclude`, `requireAuth`, `userIdOf`.
- Produces:
  - Em `shared/rules.ts`:
    - `offsetDayKey(date: Date, tzOffsetMinutes: number): string`
    - `calculateStreak(studyDates, nowMs, dayKey?: (d: Date) => string)` (parâmetro opcional novo; sem ele, comportamento igual ao de hoje)
  - Rotas:
    - `PATCH /users/me` → `User`
    - `PATCH /users/me/dot` → `User`
    - `GET /users/me/stats?tzOffset=<min>` → `UserStats`
  - `tzOffset` segue a convenção do `Date.getTimezoneOffset()`: Brasil = `180`. Padrão `0`, limitado a −840…840.

- [ ] **Step 1: Regras com fuso (shared) — teste falhando**

Acrescentar em `shared/src/rules.test.ts`:

```ts
import { offsetDayKey } from "./rules";

describe("dias no fuso do usuário", () => {
  it("offsetDayKey usa a convenção do getTimezoneOffset (Brasil = 180)", () => {
    const d = new Date("2026-09-30T01:00:00.000Z"); // 22h de 29/09 em São Paulo
    expect(offsetDayKey(d, 180)).toBe("2026-09-29");
    expect(offsetDayKey(d, 0)).toBe("2026-09-30");
  });
  it("calculateStreak aceita a função de dia", () => {
    const now = Date.parse("2026-09-30T02:00:00.000Z"); // 23h de 29/09 em SP
    const dates = ["2026-09-30T01:00:00.000Z", "2026-09-28T23:00:00.000Z"]; // 29/09 22h e 28/09 20h em SP
    expect(calculateStreak(dates, now, (d) => offsetDayKey(d, 180))).toBe(2);
    expect(calculateStreak(dates, now, (d) => offsetDayKey(d, 0))).toBe(1);
  });
});
```

Implementar em `shared/src/rules.ts`:

```ts
/** Dia (YYYY-MM-DD) visto por alguém com `Date.getTimezoneOffset() === tzOffsetMinutes`. */
export function offsetDayKey(date: Date, tzOffsetMinutes: number): string {
  const shifted = new Date(date.getTime() - tzOffsetMinutes * 60_000);
  return shifted.toISOString().slice(0, 10);
}
```

Trocar a assinatura e o corpo de `calculateStreak` (o padrão continua `localDayKey`):

```ts
export function calculateStreak(studyDates: ISODate[], nowMs: number, dayKey: (d: Date) => string = localDayKey): number {
  const days = new Set(studyDates.map((iso) => dayKey(new Date(iso))));
  const cursor = new Date(nowMs);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
```

(Mesmo algoritmo de hoje, só trocando `localDayKey` pelo parâmetro. Os testes antigos de `calculateStreak` continuam passando. No servidor, que roda em UTC, `setDate(-1)` recua exatamente 24 h.)

- [ ] **Step 2: Testes da API (falhando)**

`backend/test/users.test.ts`:

```ts
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { seedDemo } from "../src/seed/demo";
import { createTestContext, getTestPrisma, loginAs, resetDb } from "./helpers";

describe("users", () => {
  beforeEach(async () => {
    await resetDb();
    await seedDemo(getTestPrisma(), new Date("2026-09-29T12:00:00.000Z"));
  });

  it("PATCH /users/me troca o nome", async () => {
    const { app } = createTestContext();
    const { token } = await loginAs(app);
    const res = await request(app).patch("/api/v1/users/me").set("Authorization", `Bearer ${token}`).send({ name: "  Gui  " });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Gui");
  });

  it("trocar email/senha exige a senha atual correta", async () => {
    const { app } = createTestContext();
    const { token } = await loginAs(app);
    const patch = (body: object) => request(app).patch("/api/v1/users/me").set("Authorization", `Bearer ${token}`).send(body);
    expect((await patch({ newPassword: "novasenha1" })).body.error).toEqual({ code: "VALIDATION", message: "Informe sua senha atual." });
    expect((await patch({ newPassword: "novasenha1", currentPassword: "errada" })).body.error).toEqual({ code: "INVALID_CREDENTIALS", message: "Senha atual incorreta." });
    expect((await patch({ email: "ana@exemplo.dotstudy.app", currentPassword: "dotstudy123" })).body.error.code).toBe("EMAIL_TAKEN");
    const ok = await patch({ email: "Novo@X.com", currentPassword: "dotstudy123", newPassword: "novasenha1" });
    expect(ok.body.email).toBe("novo@x.com");
    await expect(loginAs(app)).rejects.toThrow();
    await expect(loginAs(app, "novo@x.com", "novasenha1")).resolves.toBeTruthy();
  });

  it("PATCH /users/me/dot só aceita acessório desbloqueado e cor hex", async () => {
    const { app } = createTestContext();
    const { token } = await loginAs(app);
    const patch = (body: object) => request(app).patch("/api/v1/users/me/dot").set("Authorization", `Bearer ${token}`).send(body);
    expect((await patch({ activeAccessoryId: "crown" })).body.error).toEqual({ code: "NOT_OWNED", message: "Você ainda não desbloqueou esse acessório." });
    expect((await patch({ dotColor: "vermelho" })).body.error.code).toBe("VALIDATION");
    expect((await patch({ activeAccessoryId: "hat", dotColor: "#A35BBF" })).body).toMatchObject({ activeAccessoryId: "hat", dotColor: "#A35BBF" });
    expect((await patch({ activeAccessoryId: null })).body.activeAccessoryId).toBeNull();
  });

  it("GET /users/me/stats soma as sessões do demo", async () => {
    const { app } = createTestContext();
    const { token } = await loginAs(app);
    const res = await request(app).get("/api/v1/users/me/stats?tzOffset=0").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ completedCycles: 12, totalMinutes: 375 });
    expect(res.body.last7Days).toHaveLength(7);
    expect(res.body.last7Days.at(-1).date).toBe("2026-09-29");
    expect(res.body.streakDays).toBeGreaterThanOrEqual(1);
  });

  it("estatísticas respeitam o fuso: 22h de SP (01h UTC do dia seguinte) conta no dia local", async () => {
    const { app, prisma, clock } = createTestContext();
    const reg = await request(app).post("/api/v1/auth/register").send({ name: "Fuso", email: "fuso@x.com", password: "segredo12" });
    const token = reg.body.token;
    clock.current = new Date("2026-09-30T01:30:00.000Z"); // 22h30 de 29/09 em SP
    await prisma.studySession.create({
      data: {
        userId: reg.body.user.id, mode: "free", focusMinutes: 25, breakMinutes: 5, plannedCycles: 1, completedCycles: 1, status: "completed",
        startedAt: new Date("2026-09-30T00:35:00.000Z"), lastCycleAt: new Date("2026-09-30T01:00:00.000Z"), finishedAt: new Date("2026-09-30T01:00:00.000Z"),
      },
    });
    const sp = await request(app).get("/api/v1/users/me/stats?tzOffset=180").set("Authorization", `Bearer ${token}`);
    expect(sp.body.last7Days.at(-1)).toEqual({ date: "2026-09-29", minutes: 25 });
    expect(sp.body.streakDays).toBe(1);
    const utc = await request(app).get("/api/v1/users/me/stats?tzOffset=0").set("Authorization", `Bearer ${token}`);
    expect(utc.body.last7Days.at(-1)).toEqual({ date: "2026-09-30", minutes: 25 });
  });

  it("tzOffset inválido vira VALIDATION", async () => {
    const { app } = createTestContext();
    const { token } = await loginAs(app);
    const res = await request(app).get("/api/v1/users/me/stats?tzOffset=abc").set("Authorization", `Bearer ${token}`);
    expect(res.body.error.code).toBe("VALIDATION");
  });
});
```

- [ ] **Step 3: Implementar**

`backend/src/modules/users/service.ts`:

```ts
import { calculateStreak, offsetDayKey } from "@dot-study/shared/rules";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Deps } from "../../deps";
import { AppError, isUniqueViolation } from "../../errors";
import { toUser, userInclude } from "../../serialize";
import { parse } from "../../validate";
import { emailSchema, nameSchema, passwordSchema } from "../auth/service";

const profileSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  currentPassword: z.string().optional(),
  newPassword: passwordSchema.optional(),
});
const dotSchema = z.object({
  dotColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Escolha uma cor válida.").optional(),
  activeAccessoryId: z.string().nullable().optional(),
});
const statsQuery = z.object({
  tzOffset: z.coerce.number({ invalid_type_error: "Fuso horário inválido." }).int("Fuso horário inválido.").min(-840, "Fuso horário inválido.").max(840, "Fuso horário inválido.").default(0),
});

export function createUserService(deps: Deps) {
  const { prisma } = deps;
  const load = async (userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: userInclude });
    if (!user) throw new AppError("UNAUTHORIZED", "Sua sessão expirou. Faça login de novo.");
    return user;
  };

  return {
    async updateProfile(userId: string, body: unknown) {
      const input = parse(profileSchema, body);
      const current = await load(userId);
      const nextEmail = input.email ?? current.email;
      const sensitive = nextEmail !== current.email || input.newPassword !== undefined;
      let passwordHash = current.passwordHash;
      if (sensitive) {
        if (!input.currentPassword) throw new AppError("VALIDATION", "Informe sua senha atual.");
        if (!(await bcrypt.compare(input.currentPassword, current.passwordHash))) throw new AppError("INVALID_CREDENTIALS", "Senha atual incorreta.");
        if (input.newPassword) passwordHash = await bcrypt.hash(input.newPassword, 10);
      }
      try {
        const user = await prisma.user.update({
          where: { id: userId },
          data: { name: input.name ?? current.name, email: nextEmail, passwordHash },
          include: userInclude,
        });
        return toUser(user);
      } catch (error) {
        if (isUniqueViolation(error)) throw new AppError("EMAIL_TAKEN", "Já existe uma conta com esse email.");
        throw error;
      }
    },

    async updateDot(userId: string, body: unknown) {
      const input = parse(dotSchema, body);
      const current = await load(userId);
      if (input.activeAccessoryId && !current.accessories.some((a) => a.accessoryId === input.activeAccessoryId)) {
        throw new AppError("NOT_OWNED", "Você ainda não desbloqueou esse acessório.");
      }
      const user = await prisma.user.update({
        where: { id: userId },
        data: { dotColor: input.dotColor ?? current.dotColor, activeAccessoryId: input.activeAccessoryId === undefined ? current.activeAccessoryId : input.activeAccessoryId },
        include: userInclude,
      });
      return toUser(user);
    },

    async getStats(userId: string, query: unknown) {
      const { tzOffset } = parse(statsQuery, query);
      await load(userId);
      const sessions = await prisma.studySession.findMany({
        where: { userId, completedCycles: { gt: 0 } },
        select: { completedCycles: true, focusMinutes: true, lastCycleAt: true, startedAt: true },
      });
      const dayOf = (d: Date) => offsetDayKey(d, tzOffset);
      const nowMs = deps.now().getTime();
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const key = dayOf(new Date(nowMs - (6 - i) * 86_400_000));
        const minutes = sessions
          .filter((s) => dayOf(s.lastCycleAt ?? s.startedAt) === key)
          .reduce((sum, s) => sum + s.completedCycles * s.focusMinutes, 0);
        return { date: key, minutes };
      });
      return {
        streakDays: calculateStreak(sessions.map((s) => (s.lastCycleAt ?? s.startedAt).toISOString()), nowMs, dayOf),
        totalMinutes: sessions.reduce((sum, s) => sum + s.completedCycles * s.focusMinutes, 0),
        completedCycles: sessions.reduce((sum, s) => sum + s.completedCycles, 0),
        last7Days,
      };
    },
  };
}
```

`backend/src/modules/users/routes.ts`:

```ts
import { Router } from "express";
import type { Deps } from "../../deps";
import { requireAuth, userIdOf } from "../../middleware/auth";
import { createUserService } from "./service";

export function createUsersRouter(deps: Deps): Router {
  const users = createUserService(deps);
  const router = Router();
  router.use(requireAuth(deps.env));
  router.patch("/me", async (req, res) => {
    res.json(await users.updateProfile(userIdOf(req), req.body));
  });
  router.patch("/me/dot", async (req, res) => {
    res.json(await users.updateDot(userIdOf(req), req.body));
  });
  router.get("/me/stats", async (req, res) => {
    res.json(await users.getStats(userIdOf(req), req.query));
  });
  return router;
}
```

`app.ts`: `api.use("/users", createUsersRouter(deps));`

- [ ] **Step 4: Verificar e commitar**

Run: `npm test && npm run lint && npm run typecheck` (raiz) → PASS (inclui shared e frontend).

```bash
git add -A shared backend
git commit --author="Felipe Wapf Fettback <wapffelipe@gmail.com>" \
  -m "feat: expor perfil, dot e estatísticas no fuso do usuário" \
  -m "Co-Authored-By: Leonardo Tanaka Cortez <leonardotanaka0513@gmail.com>"
```

---

### Task 6: Assuntos e sessões de estudo com anti-trapaça no servidor

**Autor:** Leonardo · **Coautor:** Felipe

**Files:**
- Create: `backend/src/modules/subjects/{service,routes}.ts`, `backend/src/modules/sessions/{service,routes}.ts`, `backend/test/sessions.test.ts`
- Modify: `backend/src/serialize.ts` (`toSession`), `backend/src/app.ts`

**Interfaces:**
- Consumes: `canCompleteCycle`, `COINS`, `Deps.now`, `Deps.random`.
- Produces:
  - `toSession(record): StudySession`
  - Assuntos:
    - `GET /subjects` → `Subject[]` (temas ordenados por id)
    - `GET /subjects/:id/random-theme` → `Theme`
  - Sessões:
    - `POST /sessions` (body `StartSessionInput`) → 201 `StudySession`
    - `POST /sessions/:id/cycles` → `{ session, reward }`
    - `PATCH /sessions/:id` (body `{ notes?: string; status?: "completed" | "abandoned" }`) → `StudySession`
    - `GET /sessions` → `StudySession[]` (mais recente primeiro)

- [ ] **Step 1: Testes (falhando)**

`backend/test/sessions.test.ts`:

```ts
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { seedDemo } from "../src/seed/demo";
import { createTestContext, getTestPrisma, loginAs, resetDb } from "./helpers";

async function setup(random = () => 0.99) {
  await resetDb();
  await seedDemo(getTestPrisma(), new Date("2026-09-29T12:00:00.000Z"));
  const ctx = createTestContext({ random });
  const { token } = await loginAs(ctx.app);
  const api = {
    get: (p: string) => request(ctx.app).get(`/api/v1${p}`).set("Authorization", `Bearer ${token}`),
    post: (p: string, b?: object) => request(ctx.app).post(`/api/v1${p}`).set("Authorization", `Bearer ${token}`).send(b),
    patch: (p: string, b: object) => request(ctx.app).patch(`/api/v1${p}`).set("Authorization", `Bearer ${token}`).send(b),
  };
  return { ...ctx, api };
}

describe("subjects", () => {
  beforeEach(resetDb);
  it("lista 5 assuntos com 6 temas e sorteia tema", async () => {
    const { api } = await setup(() => 0);
    const list = await api.get("/subjects");
    expect(list.body).toHaveLength(5);
    expect(list.body[0]).toMatchObject({ id: 1, name: "Matemática", icon: "sigma" });
    expect(list.body[0].themes).toHaveLength(6);
    expect((await api.get("/subjects/2/random-theme")).body).toMatchObject({ subjectId: 2, title: "Mecânica Clássica" });
    expect((await api.get("/subjects/99/random-theme")).body.error.code).toBe("NOT_FOUND");
  });
});

describe("sessions", () => {
  it("desafio aleatório sorteia assunto 5 e tema 506 com random 0.99", async () => {
    const { api } = await setup();
    const res = await api.post("/sessions", { mode: "challenge", subjectId: "random", focusMinutes: 25 });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ mode: "challenge", subjectId: 5, themeId: 506, plannedCycles: 1, breakMinutes: 0, status: "in_progress", startedAt: "2026-09-29T12:00:00.000Z" });
  });

  it("valida entrada", async () => {
    const { api } = await setup();
    expect((await api.post("/sessions", { mode: "challenge", subjectId: 1, focusMinutes: 0 })).body.error.code).toBe("VALIDATION");
    expect((await api.post("/sessions", { mode: "free", label: null, focusMinutes: 25, breakMinutes: 5, plannedCycles: 13 })).body.error.code).toBe("VALIDATION");
    expect((await api.post("/sessions", { mode: "outro" })).body.error.code).toBe("VALIDATION");
  });

  it("ciclo cedo demais → 409 CYCLE_TOO_SOON; no tempo → +10 e sessão concluída", async () => {
    const { api, clock, prisma } = await setup();
    const s = (await api.post("/sessions", { mode: "challenge", subjectId: 1, focusMinutes: 25 })).body;
    clock.advance(60_000);
    const early = await api.post(`/sessions/${s.id}/cycles`);
    expect(early.status).toBe(409);
    expect(early.body.error).toEqual({ code: "CYCLE_TOO_SOON", message: "Esse ciclo ainda não terminou." });
    clock.advance(21.5 * 60_000); // 22min30s = 90% de 25min
    const ok = await api.post(`/sessions/${s.id}/cycles`);
    expect(ok.status).toBe(200);
    expect(ok.body.reward).toEqual({ coinsEarned: 10, balance: 850 });
    expect(ok.body.session).toMatchObject({ completedCycles: 1, status: "completed" });
    expect(await prisma.coinTransaction.findFirst({ where: { refId: s.id } })).toMatchObject({ amount: 10, reason: "cycle" });
    expect((await api.post(`/sessions/${s.id}/cycles`)).body.error.code).toBe("SESSION_CLOSED");
  });

  it("duas conclusões simultâneas do mesmo ciclo pagam uma vez só", async () => {
    const { api, clock, prisma } = await setup();
    const s = (await api.post("/sessions", { mode: "free", label: null, focusMinutes: 10, breakMinutes: 2, plannedCycles: 3 })).body;
    clock.advance(10 * 60_000);
    const results = await Promise.all([api.post(`/sessions/${s.id}/cycles`), api.post(`/sessions/${s.id}/cycles`)]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: "u_demo" } })).coins).toBe(850);
    expect((await prisma.studySession.findUniqueOrThrow({ where: { id: s.id } })).completedCycles).toBe(1);
  });

  it("iniciar outra sessão abandona a anterior (recarregou a página)", async () => {
    const { api, clock } = await setup();
    const old = (await api.post("/sessions", { mode: "challenge", subjectId: 1, focusMinutes: 25 })).body;
    await api.post("/sessions", { mode: "challenge", subjectId: 2, focusMinutes: 25 });
    clock.advance(30 * 60_000);
    expect((await api.post(`/sessions/${old.id}/cycles`)).body.error.code).toBe("SESSION_CLOSED");
    expect((await api.get("/sessions")).body.find((x: { id: string }) => x.id === old.id).status).toBe("abandoned");
  });

  it("anotações, finalizar e isolamento entre usuários", async () => {
    const { api, app } = await setup();
    const s = (await api.post("/sessions", { mode: "challenge", subjectId: 1, focusMinutes: 25 })).body;
    expect((await api.patch(`/sessions/${s.id}`, { notes: "limites e derivadas" })).body.notes).toBe("limites e derivadas");
    expect((await api.patch(`/sessions/${s.id}`, { status: "abandoned" })).body.status).toBe("abandoned");
    expect((await api.patch("/sessions/seed_u_ana_1", { notes: "x" })).body.error.code).toBe("NOT_FOUND");
    const other = await request(app).post("/api/v1/auth/register").send({ name: "Outra", email: "o@x.com", password: "segredo12" });
    const res = await request(app).post(`/api/v1/sessions/${s.id}/cycles`).set("Authorization", `Bearer ${other.body.token}`);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("GET /sessions devolve só as minhas, mais recentes primeiro", async () => {
    const { api } = await setup();
    const list = (await api.get("/sessions")).body;
    expect(list.every((s: { userId: string }) => s.userId === "u_demo")).toBe(true);
    expect(list[0].id).toBe("h1");
  });
});
```

- [ ] **Step 2: Implementar**

Em `serialize.ts`:

```ts
import type { StudySession } from "@dot-study/shared/contracts";
import type { StudySession as SessionRow } from "@prisma/client";

export function toSession(s: SessionRow): StudySession {
  return {
    id: s.id, userId: s.userId, mode: s.mode, subjectId: s.subjectId, themeId: s.themeId, label: s.label,
    focusMinutes: s.focusMinutes, breakMinutes: s.breakMinutes, plannedCycles: s.plannedCycles,
    completedCycles: s.completedCycles, notes: s.notes, status: s.status,
    startedAt: s.startedAt.toISOString(), lastCycleAt: s.lastCycleAt?.toISOString() ?? null,
    finishedAt: s.finishedAt?.toISOString() ?? null, rewardedPostId: s.rewardedPostId,
  };
}
```

`backend/src/modules/subjects/service.ts`:

```ts
import type { Subject, SubjectIcon, Theme } from "@dot-study/shared/contracts";
import type { Deps } from "../../deps";
import { AppError } from "../../errors";

export function pickIndex(random: () => number, length: number): number {
  return Math.min(length - 1, Math.floor(random() * length));
}

export function createSubjectService({ prisma, random }: Deps) {
  return {
    async list(): Promise<Subject[]> {
      const rows = await prisma.subject.findMany({ orderBy: { id: "asc" }, include: { themes: { orderBy: { id: "asc" } } } });
      return rows.map((s) => ({ id: s.id, name: s.name, color: s.color, icon: s.icon as SubjectIcon, themes: s.themes.map((t) => ({ id: t.id, title: t.title, subjectId: t.subjectId })) }));
    },
    async randomTheme(subjectId: number): Promise<Theme> {
      const themes = await prisma.theme.findMany({ where: { subjectId }, orderBy: { id: "asc" } });
      if (themes.length === 0) throw new AppError("NOT_FOUND", "Assunto não encontrado.");
      const t = themes[pickIndex(random, themes.length)];
      return { id: t.id, title: t.title, subjectId: t.subjectId };
    },
  };
}
```

`backend/src/modules/subjects/routes.ts`:

```ts
import { Router } from "express";
import type { Deps } from "../../deps";
import { AppError } from "../../errors";
import { requireAuth } from "../../middleware/auth";
import { createSubjectService } from "./service";

export function createSubjectsRouter(deps: Deps): Router {
  const subjects = createSubjectService(deps);
  const router = Router();
  router.use(requireAuth(deps.env));
  router.get("/", async (_req, res) => {
    res.json(await subjects.list());
  });
  router.get("/:id/random-theme", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new AppError("NOT_FOUND", "Assunto não encontrado.");
    res.json(await subjects.randomTheme(id));
  });
  return router;
}
```

`backend/src/modules/sessions/service.ts`:

```ts
import { COINS, canCompleteCycle } from "@dot-study/shared/rules";
import { z } from "zod";
import type { Deps } from "../../deps";
import { AppError } from "../../errors";
import { toSession } from "../../serialize";
import { parse } from "../../validate";
import { pickIndex } from "../subjects/service";

const minutes = (label: string, min: number, max: number) =>
  z.number({ invalid_type_error: `${label} deve estar entre ${min} e ${max}.`, required_error: `${label} deve estar entre ${min} e ${max}.` })
    .int(`${label} deve estar entre ${min} e ${max}.`).min(min, `${label} deve estar entre ${min} e ${max}.`).max(max, `${label} deve estar entre ${min} e ${max}.`);

const startSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("challenge"), subjectId: z.union([z.number().int(), z.literal("random")]), focusMinutes: minutes("O tempo de foco", 1, 120) }),
  z.object({
    mode: z.literal("free"),
    label: z.string().max(80, "O rótulo pode ter no máximo 80 caracteres.").nullable(),
    focusMinutes: minutes("O tempo de foco", 1, 120),
    breakMinutes: minutes("A pausa", 1, 60),
    plannedCycles: minutes("O número de ciclos", 1, 12),
  }),
], { errorMap: () => ({ message: "Modo de sessão inválido." }) });

const updateSchema = z.object({
  notes: z.string().max(5000, "As anotações passaram de 5 mil caracteres.").optional(),
  status: z.enum(["completed", "abandoned"]).optional(),
});

export function createSessionService(deps: Deps) {
  const { prisma } = deps;
  const findMine = async (userId: string, id: string) => {
    const s = await prisma.studySession.findFirst({ where: { id, userId } });
    if (!s) throw new AppError("NOT_FOUND", "Sessão não encontrada.");
    return s;
  };

  return {
    async start(userId: string, body: unknown) {
      const input = parse(startSchema, body);
      const now = deps.now();
      let subjectId: number | null = null;
      let themeId: number | null = null;
      if (input.mode === "challenge") {
        const subjects = await prisma.subject.findMany({ orderBy: { id: "asc" }, include: { themes: { orderBy: { id: "asc" } } } });
        const subject = input.subjectId === "random" ? subjects[pickIndex(deps.random, subjects.length)] : subjects.find((s) => s.id === input.subjectId);
        if (!subject) throw new AppError("NOT_FOUND", "Assunto não encontrado.");
        subjectId = subject.id;
        themeId = subject.themes[pickIndex(deps.random, subject.themes.length)].id;
      }
      const created = await prisma.$transaction(async (tx) => {
        await tx.studySession.updateMany({ where: { userId, status: "in_progress" }, data: { status: "abandoned", finishedAt: now } });
        return tx.studySession.create({
          data: {
            userId, mode: input.mode, subjectId, themeId,
            label: input.mode === "free" ? input.label?.trim() || null : null,
            focusMinutes: input.focusMinutes,
            breakMinutes: input.mode === "free" ? input.breakMinutes : 0,
            plannedCycles: input.mode === "free" ? input.plannedCycles : 1,
            startedAt: now,
          },
        });
      });
      return toSession(created);
    },

    async completeCycle(userId: string, id: string) {
      const now = deps.now();
      return prisma.$transaction(async (tx) => {
        const s = await tx.studySession.findFirst({ where: { id, userId } });
        if (!s) throw new AppError("NOT_FOUND", "Sessão não encontrada.");
        const check = canCompleteCycle(toSession(s), now.getTime());
        if (!check.ok) {
          throw new AppError(check.reason, check.reason === "CYCLE_TOO_SOON" ? "Esse ciclo ainda não terminou." : "Essa sessão já foi encerrada.");
        }
        const finished = s.completedCycles + 1 === s.plannedCycles;
        // update condicional: se outra requisição já concluiu este ciclo, count = 0
        const updated = await tx.studySession.updateMany({
          where: { id: s.id, status: "in_progress", completedCycles: s.completedCycles },
          data: { completedCycles: { increment: 1 }, lastCycleAt: now, ...(finished ? { status: "completed", finishedAt: now } : {}) },
        });
        if (updated.count === 0) throw new AppError("SESSION_CLOSED", "Esse ciclo já foi registrado.");
        const user = await tx.user.update({ where: { id: userId }, data: { coins: { increment: COINS.cycle } } });
        await tx.coinTransaction.create({ data: { userId, amount: COINS.cycle, reason: "cycle", refId: s.id, createdAt: now } });
        const fresh = await tx.studySession.findUniqueOrThrow({ where: { id: s.id } });
        return { session: toSession(fresh), reward: { coinsEarned: COINS.cycle, balance: user.coins } };
      });
    },

    async update(userId: string, id: string, body: unknown) {
      const input = parse(updateSchema, body);
      const s = await findMine(userId, id);
      const data: { notes?: string; status?: "completed" | "abandoned"; finishedAt?: Date } = {};
      if (input.notes !== undefined) data.notes = input.notes;
      if (input.status && s.status === "in_progress") {
        data.status = input.status;
        data.finishedAt = deps.now();
      }
      return toSession(await prisma.studySession.update({ where: { id: s.id }, data }));
    },

    async list(userId: string) {
      const rows = await prisma.studySession.findMany({ where: { userId } });
      return rows
        .map(toSession)
        .sort((a, b) => (b.lastCycleAt ?? b.startedAt).localeCompare(a.lastCycleAt ?? a.startedAt));
    },
  };
}
```

(Com duas requisições simultâneas, o `UPDATE … WHERE completedCycles = N` da segunda espera o lock da primeira. Em READ COMMITTED, o Postgres reavalia o `WHERE` depois do commit dela: `count = 0` e a segunda recebe 409. O teste de concorrência prova isso.)

`backend/src/modules/sessions/routes.ts`:

```ts
import { Router } from "express";
import type { Deps } from "../../deps";
import { requireAuth, userIdOf } from "../../middleware/auth";
import { createSessionService } from "./service";

export function createSessionsRouter(deps: Deps): Router {
  const sessions = createSessionService(deps);
  const router = Router();
  router.use(requireAuth(deps.env));
  router.post("/", async (req, res) => {
    res.status(201).json(await sessions.start(userIdOf(req), req.body));
  });
  router.get("/", async (req, res) => {
    res.json(await sessions.list(userIdOf(req)));
  });
  router.post("/:id/cycles", async (req, res) => {
    res.json(await sessions.completeCycle(userIdOf(req), req.params.id));
  });
  router.patch("/:id", async (req, res) => {
    res.json(await sessions.update(userIdOf(req), req.params.id, req.body));
  });
  return router;
}
```

`app.ts`: `api.use("/subjects", createSubjectsRouter(deps)); api.use("/sessions", createSessionsRouter(deps));`

- [ ] **Step 3: Verificar e commitar**

Run: `npm test -w backend && npm run lint && npm run typecheck` → PASS.

```bash
git add -A backend
git commit --author="Leonardo Tanaka Cortez <leonardotanaka0513@gmail.com>" \
  -m "feat: implementar sessões de estudo com anti-trapaça no servidor" \
  -m "Co-Authored-By: Felipe Wapf Fettback <wapffelipe@gmail.com>"
```

---

### Task 7: Posts, comentários, curtidas, salvos e ranking

**Autor:** Felipe · **Coautor:** Leonardo

**Files:**
- Create: `backend/src/modules/posts/{service,routes}.ts`, `backend/src/modules/rankings/{service,routes}.ts`, `backend/test/posts.test.ts`, `backend/test/rankings.test.ts`
- Modify: `backend/src/serialize.ts` (`postInclude(meId)`, `toPost`, `toCommentTree`), `backend/src/app.ts`

**Interfaces:**
- Consumes: `COINS`, `MEDIA_LIMITS`, `computeSubjectScores`, `rankEntries`, `toAuthor`.
- Produces:
  - Posts:
    - `GET /posts?subjectId&type&savedOnly&cursor&limit` → `Page<Post>`
    - `GET /posts/:id` → `Post`
    - `POST /posts` (body `CreatePostInput`) → 201 `{ post, reward }`
    - `POST|DELETE /posts/:id/like` e `/posts/:id/save` → `Post`
    - `GET /posts/:id/comments` → `Comment[]` (em árvore)
    - `POST /posts/:id/comments` → 201 `Comment`
  - Ranking: `GET /rankings/:subjectId` → `RankEntry[]`
  - `createPostService(deps)` com o método `resolveMedia`, que a Task 9 amplia (posts de áudio/vídeo exigem uma mídia enviada pelo próprio usuário). **Nesta task**, posts com `type` diferente de `text` recebem `VALIDATION` "Grave ou envie a mídia antes de publicar."
  - Cursor = `"<createdAt ISO>|<id>"`; `limit` padrão 10, máximo 50.

- [ ] **Step 1: Testes (falhando)**

`backend/test/posts.test.ts`:

```ts
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { seedDemo } from "../src/seed/demo";
import { createTestContext, getTestPrisma, loginAs, resetDb } from "./helpers";

async function setup() {
  await resetDb();
  await seedDemo(getTestPrisma(), new Date("2026-09-29T12:00:00.000Z"));
  const ctx = createTestContext();
  const { token } = await loginAs(ctx.app);
  const auth = (r: request.Test) => r.set("Authorization", `Bearer ${token}`);
  const api = {
    get: (p: string) => auth(request(ctx.app).get(`/api/v1${p}`)),
    post: (p: string, b?: object) => auth(request(ctx.app).post(`/api/v1${p}`)).send(b),
    del: (p: string) => auth(request(ctx.app).delete(`/api/v1${p}`)),
  };
  return { ...ctx, api };
}

describe("posts", () => {
  beforeEach(resetDb);

  it("feed do mais novo para o mais antigo com contadores do seed", async () => {
    const { api } = await setup();
    const page = (await api.get("/posts")).body;
    expect(page.items.map((p: { id: string }) => p.id)).toEqual(["p1", "p2", "p3", "p4"]);
    expect(page.items[1]).toMatchObject({ likeCount: 89, likedByMe: true, savedByMe: true, author: { name: "Pedro Lima" } });
    expect(page.items[0]).toMatchObject({ commentCount: 4, subjectId: 1, type: "text" });
    expect(page.nextCursor).toBeNull();
  });

  it("filtros e paginação por cursor", async () => {
    const { api } = await setup();
    expect((await api.get("/posts?subjectId=5")).body.items.map((p: { id: string }) => p.id)).toEqual(["p2"]);
    expect((await api.get("/posts?type=audio")).body.items.map((p: { id: string }) => p.id)).toEqual(["p3"]);
    expect((await api.get("/posts?savedOnly=true")).body.items.map((p: { id: string }) => p.id)).toEqual(["p2"]);
    const first = (await api.get("/posts?limit=2")).body;
    expect(first.items).toHaveLength(2);
    const second = (await api.get(`/posts?limit=2&cursor=${encodeURIComponent(first.nextCursor)}`)).body;
    expect(second.items.map((p: { id: string }) => p.id)).toEqual(["p3", "p4"]);
    expect(second.nextCursor).toBeNull();
    expect((await api.get("/posts?limit=0")).body.error.code).toBe("VALIDATION");
  });

  it("publicar da sessão concluída dá +30 uma vez; sem ciclo ou sem sessão não dá", async () => {
    const { api, clock } = await setup();
    const s = (await api.post("/sessions", { mode: "challenge", subjectId: 1, focusMinutes: 25 })).body;
    const early = (await api.post("/posts", { sessionId: s.id, type: "text", title: "Cedo demais", content: "" })).body;
    expect(early.reward).toBeNull();
    clock.advance(25 * 60_000);
    await api.post(`/sessions/${s.id}/cycles`);
    clock.advance(1000);
    const first = await api.post("/posts", { sessionId: s.id, type: "text", title: "Aprendi limites", content: "texto" });
    expect(first.status).toBe(201);
    // "Cedo demais" não levou a recompensa porque a sessão não tinha ciclo; esta leva
    expect(first.body.reward).toEqual({ coinsEarned: 30, balance: 880 });
    expect(first.body.post).toMatchObject({ subjectId: 1, likeCount: 0, author: { id: "u_demo" } });
    clock.advance(1000);
    expect((await api.post("/posts", { sessionId: s.id, type: "text", title: "De novo", content: "" })).body.reward).toBeNull();
    expect((await api.post("/posts", { sessionId: null, type: "text", title: "Solto", content: "" })).body.reward).toBeNull();
    expect((await api.get("/posts")).body.items[0].title).toBe("Solto");
  });

  it("duas publicações simultâneas da mesma sessão recompensam uma vez", async () => {
    const { api, clock, prisma } = await setup();
    const s = (await api.post("/sessions", { mode: "challenge", subjectId: 1, focusMinutes: 25 })).body;
    clock.advance(25 * 60_000);
    await api.post(`/sessions/${s.id}/cycles`);
    const [a, b] = await Promise.all([
      api.post("/posts", { sessionId: s.id, type: "text", title: "Post A", content: "" }),
      api.post("/posts", { sessionId: s.id, type: "text", title: "Post B", content: "" }),
    ]);
    expect([a.body.reward, b.body.reward].filter(Boolean)).toHaveLength(1);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: "u_demo" } })).coins).toBe(880);
  });

  it("valida título, conteúdo e sessão de outro usuário", async () => {
    const { api } = await setup();
    expect((await api.post("/posts", { sessionId: null, type: "text", title: "ab", content: "" })).body.error).toEqual({ code: "VALIDATION", message: "O título precisa ter entre 3 e 120 caracteres." });
    expect((await api.post("/posts", { sessionId: "seed_u_ana_1", type: "text", title: "Roubando", content: "" })).body.error.code).toBe("NOT_FOUND");
    expect((await api.post("/posts", { sessionId: null, type: "audio", title: "Áudio", content: "" })).body.error).toEqual({ code: "VALIDATION", message: "Grave ou envie a mídia antes de publicar." });
  });

  it("curtir/salvar idempotentes; post inexistente 404", async () => {
    const { api } = await setup();
    expect((await api.post("/posts/p1/like")).body.likeCount).toBe(48);
    expect((await api.post("/posts/p1/like")).body.likeCount).toBe(48);
    expect((await api.del("/posts/p1/like")).body.likeCount).toBe(47);
    expect((await api.post("/posts/p1/save")).body.savedByMe).toBe(true);
    expect((await api.del("/posts/p1/save")).body.savedByMe).toBe(false);
    expect((await api.post("/posts/nada/like")).status).toBe(404);
  });

  it("comentários em árvore e validação", async () => {
    const { api } = await setup();
    const tree = (await api.get("/posts/p1/comments")).body;
    expect(tree).toHaveLength(2);
    expect(tree.find((c: { id: string }) => c.id === "c1").replies.map((r: { id: string }) => r.id)).toEqual(["c11"]);
    const c = (await api.post("/posts/p2/comments", { content: "Ótimo post!" })).body;
    await api.post("/posts/p2/comments", { content: "Concordo", parentId: c.id });
    const list = (await api.get("/posts/p2/comments")).body;
    expect(list[0].replies[0].content).toBe("Concordo");
    expect((await api.get("/posts/p2")).body.commentCount).toBe(2);
    expect((await api.post("/posts/p2/comments", { content: "   " })).body.error.code).toBe("VALIDATION");
    expect((await api.post("/posts/p2/comments", { content: "x", parentId: "c1" })).body.error.code).toBe("NOT_FOUND");
  });
});
```

`backend/test/rankings.test.ts`:

```ts
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { seedDemo } from "../src/seed/demo";
import { createTestContext, getTestPrisma, loginAs, resetDb } from "./helpers";

describe("rankings", () => {
  beforeEach(async () => {
    await resetDb();
    await seedDemo(getTestPrisma(), new Date("2026-09-29T12:00:00.000Z"));
  });

  it("Matemática: Ana 510, Rafael 420, Carla 360; demo marcado com isMe e 30 pontos", async () => {
    const { app } = createTestContext();
    const { token } = await loginAs(app);
    const res = await request(app).get("/api/v1/rankings/1").set("Authorization", `Bearer ${token}`);
    expect(res.body.slice(0, 3).map((e: { user: { name: string }; score: number }) => [e.user.name, e.score])).toEqual([
      ["Ana Clara M.", 510], ["Rafael Costa", 420], ["Carla Nunes", 360],
    ]);
    expect(res.body.find((e: { isMe: boolean }) => e.isMe)).toMatchObject({ user: { name: "Guilherme" }, score: 30 });
  });

  it("assunto inexistente devolve lista vazia; id inválido 404", async () => {
    const { app } = createTestContext();
    const { token } = await loginAs(app);
    expect((await request(app).get("/api/v1/rankings/99").set("Authorization", `Bearer ${token}`)).body).toEqual([]);
    expect((await request(app).get("/api/v1/rankings/abc").set("Authorization", `Bearer ${token}`)).status).toBe(404);
  });
});
```

- [ ] **Step 2: Implementar**

Em `serialize.ts`:

```ts
import type { Comment, Post } from "@dot-study/shared/contracts";

export function postInclude(meId: string) {
  return {
    author: true,
    _count: { select: { likes: true, comments: true } },
    likes: { where: { userId: meId }, select: { userId: true } },
    saves: { where: { userId: meId }, select: { userId: true } },
  } satisfies Prisma.PostInclude;
}

type PostRecord = Prisma.PostGetPayload<{ include: ReturnType<typeof postInclude> }>;

export function toPost(p: PostRecord): Post {
  return {
    id: p.id, author: toAuthor(p.author), sessionId: p.sessionId, subjectId: p.subjectId, type: p.type,
    title: p.title, content: p.content, mediaUrl: p.mediaUrl, mediaDurationSec: p.mediaDurationSec,
    createdAt: p.createdAt.toISOString(), likeCount: p.baseLikeCount + p._count.likes,
    commentCount: p._count.comments, likedByMe: p.likes.length > 0, savedByMe: p.saves.length > 0,
  };
}

type CommentRow = Prisma.CommentGetPayload<{ include: { author: true } }>;

export function toCommentTree(rows: CommentRow[]): Comment[] {
  const byId = new Map<string, Comment>();
  for (const r of rows) {
    byId.set(r.id, { id: r.id, postId: r.postId, author: toAuthor(r.author), parentId: r.parentId, content: r.content, createdAt: r.createdAt.toISOString(), replies: [] });
  }
  const roots: Comment[] = [];
  for (const c of byId.values()) {
    const parent = c.parentId ? byId.get(c.parentId) : undefined;
    (parent ? parent.replies : roots).push(c);
  }
  return roots;
}
```

`backend/src/modules/posts/service.ts`:

```ts
import { COINS } from "@dot-study/shared/rules";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import type { Deps } from "../../deps";
import { AppError } from "../../errors";
import { postInclude, toCommentTree, toPost } from "../../serialize";
import { parse } from "../../validate";

const listSchema = z.object({
  subjectId: z.coerce.number().int().optional(),
  type: z.enum(["text", "audio", "video"]).optional(),
  savedOnly: z.enum(["true", "false"]).optional().transform((v) => v === "true"),
  cursor: z.string().regex(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z\|[^|]+$/, "Cursor inválido.").optional(),
  limit: z.coerce.number().int().min(1, "O limite deve estar entre 1 e 50.").max(50, "O limite deve estar entre 1 e 50.").default(10),
});

const createSchema = z.object({
  sessionId: z.string().nullable(),
  type: z.enum(["text", "audio", "video"], { errorMap: () => ({ message: "Tipo de post inválido." }) }),
  title: z.string().trim().min(3, "O título precisa ter entre 3 e 120 caracteres.").max(120, "O título precisa ter entre 3 e 120 caracteres."),
  content: z.string().max(20_000, "O texto passou do limite de 20 mil caracteres.").default(""),
  mediaUrl: z.string().nullable().optional(),
  mediaDurationSec: z.number().nullable().optional(),
});

const commentSchema = z.object({
  content: z.string().trim().min(1, "Escreva um comentário de até 2000 caracteres.").max(2000, "Escreva um comentário de até 2000 caracteres."),
  parentId: z.string().nullable().optional(),
});

export type MediaResolver = (tx: Prisma.TransactionClient, userId: string, input: z.infer<typeof createSchema>) => Promise<{ mediaId: string; mediaUrl: string; mediaDurationSec: number } | null>;

/** Nesta task só existem posts de texto; a Task 9 troca este resolver pelo que valida a mídia enviada. */
export const textOnlyMedia: MediaResolver = async (_tx, _userId, input) => {
  if (input.type === "text") return null;
  throw new AppError("VALIDATION", "Grave ou envie a mídia antes de publicar.");
};

export function createPostService(deps: Deps, resolveMedia: MediaResolver = textOnlyMedia) {
  const { prisma } = deps;
  const findPost = async (meId: string, id: string) => {
    const post = await prisma.post.findUnique({ where: { id }, include: postInclude(meId) });
    if (!post) throw new AppError("NOT_FOUND", "Post não encontrado.");
    return post;
  };

  return {
    async list(meId: string, query: unknown) {
      const f = parse(listSchema, query);
      const where: Prisma.PostWhereInput = {
        ...(f.subjectId !== undefined ? { subjectId: f.subjectId } : {}),
        ...(f.type ? { type: f.type } : {}),
        ...(f.savedOnly ? { saves: { some: { userId: meId } } } : {}),
      };
      if (f.cursor) {
        const [iso, id] = f.cursor.split("|");
        const at = new Date(iso);
        where.OR = [{ createdAt: { lt: at } }, { createdAt: at, id: { lt: id } }];
      }
      const rows = await prisma.post.findMany({ where, include: postInclude(meId), orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: f.limit + 1 });
      const items = rows.slice(0, f.limit).map(toPost);
      const last = items.at(-1);
      return { items, nextCursor: rows.length > f.limit && last ? `${last.createdAt}|${last.id}` : null };
    },

    async get(meId: string, id: string) {
      return toPost(await findPost(meId, id));
    },

    async create(meId: string, body: unknown) {
      const input = parse(createSchema, body);
      const now = deps.now();
      return prisma.$transaction(async (tx) => {
        const session = input.sessionId ? await tx.studySession.findFirst({ where: { id: input.sessionId, userId: meId } }) : null;
        if (input.sessionId && !session) throw new AppError("NOT_FOUND", "Sessão não encontrada.");
        const media = await resolveMedia(tx, meId, input);
        const post = await tx.post.create({
          data: {
            authorId: meId, sessionId: session?.id ?? null, subjectId: session?.subjectId ?? null, type: input.type,
            title: input.title, content: input.content.trim(), mediaId: media?.mediaId ?? null,
            mediaUrl: media?.mediaUrl ?? null, mediaDurationSec: media?.mediaDurationSec ?? null, createdAt: now,
          },
        });
        let reward = null;
        if (session && session.completedCycles > 0) {
          // update condicional: só a primeira publicação da sessão leva a recompensa
          const claimed = await tx.studySession.updateMany({ where: { id: session.id, rewardedPostId: null }, data: { rewardedPostId: post.id } });
          if (claimed.count === 1) {
            const user = await tx.user.update({ where: { id: meId }, data: { coins: { increment: COINS.post } } });
            await tx.coinTransaction.create({ data: { userId: meId, amount: COINS.post, reason: "post", refId: post.id, createdAt: now } });
            reward = { coinsEarned: COINS.post, balance: user.coins };
          }
        }
        const full = await tx.post.findUniqueOrThrow({ where: { id: post.id }, include: postInclude(meId) });
        return { post: toPost(full), reward };
      });
    },

    async toggle(meId: string, id: string, list: "like" | "save", on: boolean) {
      await findPost(meId, id);
      const key = { userId_postId: { userId: meId, postId: id } };
      if (list === "like") {
        if (on) await prisma.like.upsert({ where: key, create: { userId: meId, postId: id }, update: {} });
        else await prisma.like.deleteMany({ where: { userId: meId, postId: id } });
      } else {
        if (on) await prisma.save.upsert({ where: key, create: { userId: meId, postId: id }, update: {} });
        else await prisma.save.deleteMany({ where: { userId: meId, postId: id } });
      }
      return toPost(await findPost(meId, id));
    },

    async listComments(meId: string, postId: string) {
      await findPost(meId, postId);
      const rows = await prisma.comment.findMany({ where: { postId }, include: { author: true }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
      return toCommentTree(rows);
    },

    async addComment(meId: string, postId: string, body: unknown) {
      const input = parse(commentSchema, body);
      await findPost(meId, postId);
      if (input.parentId && !(await prisma.comment.findFirst({ where: { id: input.parentId, postId } }))) {
        throw new AppError("NOT_FOUND", "Comentário não encontrado.");
      }
      const row = await prisma.comment.create({
        data: { postId, authorId: meId, parentId: input.parentId ?? null, content: input.content, createdAt: deps.now() },
        include: { author: true },
      });
      return toCommentTree([row])[0];
    },
  };
}
```

(A unicidade de `rewardedPostId` no schema + o `updateMany … rewardedPostId: null` garantem uma recompensa por sessão mesmo com publicações simultâneas.)

`backend/src/modules/posts/routes.ts`:

```ts
import { Router } from "express";
import type { Deps } from "../../deps";
import { requireAuth, userIdOf } from "../../middleware/auth";
import { createPostService, type MediaResolver } from "./service";

export function createPostsRouter(deps: Deps, resolveMedia?: MediaResolver): Router {
  const posts = createPostService(deps, resolveMedia);
  const router = Router();
  router.use(requireAuth(deps.env));
  router.get("/", async (req, res) => {
    res.json(await posts.list(userIdOf(req), req.query));
  });
  router.post("/", async (req, res) => {
    res.status(201).json(await posts.create(userIdOf(req), req.body));
  });
  router.get("/:id", async (req, res) => {
    res.json(await posts.get(userIdOf(req), req.params.id));
  });
  router.post("/:id/like", async (req, res) => {
    res.json(await posts.toggle(userIdOf(req), req.params.id, "like", true));
  });
  router.delete("/:id/like", async (req, res) => {
    res.json(await posts.toggle(userIdOf(req), req.params.id, "like", false));
  });
  router.post("/:id/save", async (req, res) => {
    res.json(await posts.toggle(userIdOf(req), req.params.id, "save", true));
  });
  router.delete("/:id/save", async (req, res) => {
    res.json(await posts.toggle(userIdOf(req), req.params.id, "save", false));
  });
  router.get("/:id/comments", async (req, res) => {
    res.json(await posts.listComments(userIdOf(req), req.params.id));
  });
  router.post("/:id/comments", async (req, res) => {
    res.status(201).json(await posts.addComment(userIdOf(req), req.params.id, req.body));
  });
  return router;
}
```

`backend/src/modules/rankings/service.ts`:

```ts
import type { StudySession } from "@dot-study/shared/contracts";
import { computeSubjectScores, rankEntries } from "@dot-study/shared/rules";
import type { Deps } from "../../deps";
import { toAuthor } from "../../serialize";

export function createRankingService({ prisma }: Deps) {
  return {
    async bySubject(meId: string, subjectId: number) {
      const sessions = await prisma.studySession.findMany({ where: { subjectId, completedCycles: { gt: 0 } }, select: { userId: true, subjectId: true, completedCycles: true } });
      const posts = await prisma.post.findMany({ where: { subjectId }, select: { authorId: true, subjectId: true } });
      const scores = computeSubjectScores(subjectId, sessions as unknown as StudySession[], posts);
      const users = await prisma.user.findMany({ where: { id: { in: [...scores.keys()] } } });
      return rankEntries(scores, new Map(users.map((u) => [u.id, toAuthor(u)])), meId);
    },
  };
}
```

(`computeSubjectScores` só lê `userId`, `subjectId` e `completedCycles` das sessões; o `as unknown as` fica restrito a essa linha, com o comentário `// só esses campos são lidos`.)

`backend/src/modules/rankings/routes.ts`:

```ts
import { Router } from "express";
import type { Deps } from "../../deps";
import { AppError } from "../../errors";
import { requireAuth, userIdOf } from "../../middleware/auth";
import { createRankingService } from "./service";

export function createRankingsRouter(deps: Deps): Router {
  const rankings = createRankingService(deps);
  const router = Router();
  router.use(requireAuth(deps.env));
  router.get("/:subjectId", async (req, res) => {
    const id = Number(req.params.subjectId);
    if (!Number.isInteger(id)) throw new AppError("NOT_FOUND", "Assunto não encontrado.");
    res.json(await rankings.bySubject(userIdOf(req), id));
  });
  return router;
}
```

`app.ts`: `api.use("/posts", createPostsRouter(deps)); api.use("/rankings", createRankingsRouter(deps));`

- [ ] **Step 3: Verificar e commitar**

Run: `npm test -w backend && npm run lint && npm run typecheck` → PASS.

```bash
git add -A backend
git commit --author="Felipe Wapf Fettback <wapffelipe@gmail.com>" \
  -m "feat: implementar feed, comentários, curtidas e ranking na API" \
  -m "Co-Authored-By: Leonardo Tanaka Cortez <leonardotanaka0513@gmail.com>"
```

---

### Task 8: Loja com débito atômico

**Autor:** Leonardo · **Coautor:** Felipe

**Files:**
- Create: `backend/src/modules/shop/{service,routes}.ts`, `backend/test/shop.test.ts`
- Modify: `backend/src/app.ts`

**Interfaces:**
- Produces:
  - `GET /shop/accessories` → `Accessory[]` (ordem do catálogo)
  - `POST /shop/purchase` (body `{ accessoryId }`) → `User`

- [ ] **Step 1: Testes (falhando)**

`backend/test/shop.test.ts`:

```ts
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { seedDemo } from "../src/seed/demo";
import { createTestContext, getTestPrisma, loginAs, resetDb } from "./helpers";

describe("shop", () => {
  beforeEach(async () => {
    await resetDb();
    await seedDemo(getTestPrisma(), new Date("2026-09-29T12:00:00.000Z"));
  });

  it("lista os 10 acessórios na ordem do catálogo", async () => {
    const { app } = createTestContext();
    const { token } = await loginAs(app);
    const res = await request(app).get("/api/v1/shop/accessories").set("Authorization", `Bearer ${token}`);
    expect(res.body).toHaveLength(10);
    expect(res.body[0]).toEqual({ id: "hat", name: "Chapéu de Formatura", cost: 500 });
  });

  it("compra debita, desbloqueia e registra a transação", async () => {
    const { app, prisma } = createTestContext();
    const { token } = await loginAs(app);
    const res = await request(app).post("/api/v1/shop/purchase").set("Authorization", `Bearer ${token}`).send({ accessoryId: "bow" });
    expect(res.status).toBe(200);
    expect(res.body.coins).toBe(590);
    expect(res.body.unlockedAccessoryIds).toContain("bow");
    expect(await prisma.coinTransaction.findFirst({ where: { userId: "u_demo", reason: "purchase" } })).toMatchObject({ amount: -250, refId: "bow" });
  });

  it("recusa já desbloqueado, saldo insuficiente e inexistente", async () => {
    const { app } = createTestContext();
    const { token } = await loginAs(app);
    const buy = async (accessoryId: string) => (await request(app).post("/api/v1/shop/purchase").set("Authorization", `Bearer ${token}`).send({ accessoryId })).body.error;
    expect(await buy("hat")).toEqual({ code: "ALREADY_OWNED", message: "Você já tem esse acessório." });
    expect(await buy("crown")).toEqual({ code: "INSUFFICIENT_COINS", message: "Moedas insuficientes." });
    expect((await buy("nada")).code).toBe("NOT_FOUND");
  });

  it("clique duplo / duas abas: compras simultâneas debitam uma vez só", async () => {
    const { app, prisma } = createTestContext();
    const { token } = await loginAs(app);
    const buy = () => request(app).post("/api/v1/shop/purchase").set("Authorization", `Bearer ${token}`).send({ accessoryId: "bow" });
    const results = await Promise.all([buy(), buy(), buy()]);
    expect(results.filter((r) => r.status === 200)).toHaveLength(1);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: "u_demo" } })).coins).toBe(590);
    expect(await prisma.coinTransaction.count({ where: { userId: "u_demo", reason: "purchase" } })).toBe(1);
  });
});
```

- [ ] **Step 2: Implementar**

`backend/src/modules/shop/service.ts`:

```ts
import { ACCESSORIES } from "@dot-study/shared/catalog";
import { z } from "zod";
import type { Deps } from "../../deps";
import { AppError, isUniqueViolation } from "../../errors";
import { toUser, userInclude } from "../../serialize";
import { parse } from "../../validate";

const purchaseSchema = z.object({ accessoryId: z.string({ required_error: "Escolha um acessório." }).min(1, "Escolha um acessório.") });
const catalogOrder = new Map(ACCESSORIES.map((a, i) => [a.id, i]));

export function createShopService(deps: Deps) {
  const { prisma } = deps;
  return {
    async list() {
      const rows = await prisma.accessory.findMany();
      return rows
        .map((a) => ({ id: a.id, name: a.name, cost: a.cost }))
        .sort((a, b) => (catalogOrder.get(a.id) ?? 99) - (catalogOrder.get(b.id) ?? 99));
    },

    async purchase(userId: string, body: unknown) {
      const { accessoryId } = parse(purchaseSchema, body);
      const item = await prisma.accessory.findUnique({ where: { id: accessoryId } });
      if (!item) throw new AppError("NOT_FOUND", "Acessório não encontrado.");
      const now = deps.now();
      try {
        const user = await prisma.$transaction(async (tx) => {
          if (await tx.userAccessory.findUnique({ where: { userId_accessoryId: { userId, accessoryId } } })) {
            throw new AppError("ALREADY_OWNED", "Você já tem esse acessório.");
          }
          // a chave primária (userId, accessoryId) impede o segundo desbloqueio simultâneo
          await tx.userAccessory.create({ data: { userId, accessoryId, unlockedAt: now } });
          const debited = await tx.user.updateMany({ where: { id: userId, coins: { gte: item.cost } }, data: { coins: { decrement: item.cost } } });
          if (debited.count === 0) throw new AppError("INSUFFICIENT_COINS", "Moedas insuficientes.");
          await tx.coinTransaction.create({ data: { userId, amount: -item.cost, reason: "purchase", refId: item.id, createdAt: now } });
          return tx.user.findUniqueOrThrow({ where: { id: userId }, include: userInclude });
        });
        return toUser(user);
      } catch (error) {
        if (isUniqueViolation(error)) throw new AppError("ALREADY_OWNED", "Você já tem esse acessório.");
        throw error;
      }
    },
  };
}
```

`backend/src/modules/shop/routes.ts`:

```ts
import { Router } from "express";
import type { Deps } from "../../deps";
import { requireAuth, userIdOf } from "../../middleware/auth";
import { createShopService } from "./service";

export function createShopRouter(deps: Deps): Router {
  const shop = createShopService(deps);
  const router = Router();
  router.use(requireAuth(deps.env));
  router.get("/accessories", async (_req, res) => {
    res.json(await shop.list());
  });
  router.post("/purchase", async (req, res) => {
    res.json(await shop.purchase(userIdOf(req), req.body));
  });
  return router;
}
```

`app.ts`: `api.use("/shop", createShopRouter(deps));`

- [ ] **Step 3: Verificar e commitar**

Run: `npm test -w backend && npm run lint && npm run typecheck` → PASS. Rodar `npm test -w backend -- shop` 5 vezes seguidas, para checar que o teste de concorrência é estável.

```bash
git add -A backend
git commit --author="Leonardo Tanaka Cortez <leonardotanaka0513@gmail.com>" \
  -m "feat: implementar loja com débito atômico de moedas" \
  -m "Co-Authored-By: Felipe Wapf Fettback <wapffelipe@gmail.com>"
```

---

### Task 9: Upload de mídia (multer + validação de assinatura) e driver Cloudinary

**Autor:** Felipe · **Coautor:** Lucas

**Files:**
- Create: `backend/src/storage/sniff.ts`, `backend/src/storage/cloudinary.ts`, `backend/src/modules/uploads/{service,routes}.ts`, `backend/test/uploads.test.ts`
- Modify: `backend/src/config/env.ts` (`STORAGE_DRIVER` ganha `cloudinary` e `CLOUDINARY_URL`), `backend/src/storage/index.ts`, `backend/src/app.ts` (monta `/uploads` e passa o `mediaResolver` para os posts), `backend/test/storage.test.ts` (Cloudinary com o SDK mockado)

**Interfaces:**
- Consumes: `MEDIA_LIMITS`, `StorageDriver`, `MediaResolver` (Task 7).
- Produces:
  - `sniffContainer(head: Buffer): "webm" | "mp4" | "ogg" | "mpeg" | "wav" | null`
  - `POST /uploads` (multipart: `file`, `kind` = `audio` | `video`, `durationSec`) → 201 `{ url, durationSec }`
  - `ownedMediaResolver: MediaResolver` (exige uma `Media` do próprio usuário, do mesmo `kind` e ainda sem post)
  - `createCloudinaryStorage(): StorageDriver`
  - `createStorage(env)` escolhe o driver pelo `STORAGE_DRIVER`

- [ ] **Step 1: Testes (falhando)**

`backend/test/uploads.test.ts`:

```ts
import { existsSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { seedDemo } from "../src/seed/demo";
import { sniffContainer } from "../src/storage/sniff";
import { createTestContext, getTestPrisma, loginAs, resetDb } from "./helpers";

const WEBM = Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.alloc(2048, 1)]);
const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from("ftypisom"), Buffer.alloc(2048, 2)]);
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(512)]);
const tmpDir = path.join(os.tmpdir(), "dotstudy-uploads");
const tmpCount = () => (existsSync(tmpDir) ? readdirSync(tmpDir).length : 0);

async function setup() {
  await resetDb();
  await seedDemo(getTestPrisma(), new Date("2026-09-29T12:00:00.000Z"));
  const ctx = createTestContext();
  const { token } = await loginAs(ctx.app);
  const upload = (buf: Buffer, opts: { kind: string; durationSec: string; mime: string; name?: string }) =>
    request(ctx.app).post("/api/v1/uploads").set("Authorization", `Bearer ${token}`)
      .field("kind", opts.kind).field("durationSec", opts.durationSec)
      .attach("file", buf, { filename: opts.name ?? "gravacao.webm", contentType: opts.mime });
  const post = (b: object) => request(ctx.app).post("/api/v1/posts").set("Authorization", `Bearer ${token}`).send(b);
  return { ...ctx, token, upload, post };
}

describe("sniffContainer", () => {
  it("reconhece webm, mp4, ogg, mpeg e wav; rejeita png", () => {
    expect(sniffContainer(WEBM)).toBe("webm");
    expect(sniffContainer(MP4)).toBe("mp4");
    expect(sniffContainer(Buffer.from("OggS\0\0\0\0"))).toBe("ogg");
    expect(sniffContainer(Buffer.from("ID3\x04\0\0\0\0"))).toBe("mpeg");
    expect(sniffContainer(Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WAVE")]))).toBe("wav");
    expect(sniffContainer(PNG)).toBeNull();
  });
});

describe("uploads", () => {
  beforeEach(resetDb);

  it("envia áudio, devolve /media/... servido pela API e publica o post com ele", async () => {
    const { upload, post, app } = await setup();
    const res = await upload(WEBM, { kind: "audio", durationSec: "12.4", mime: "audio/webm;codecs=opus" });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ url: expect.stringMatching(/^\/media\/.+\.webm$/), durationSec: 12 });
    expect((await request(app).get(res.body.url)).status).toBe(200);
    const created = await post({ sessionId: null, type: "audio", title: "Meu áudio", content: "", mediaUrl: res.body.url, mediaDurationSec: 999 });
    expect(created.status).toBe(201);
    expect(created.body.post).toMatchObject({ type: "audio", mediaUrl: res.body.url, mediaDurationSec: 12 }); // duração vem do upload, não do cliente
  });

  it("rejeita MIME falso pela assinatura do arquivo", async () => {
    const { upload } = await setup();
    const before = tmpCount();
    const res = await upload(PNG, { kind: "video", durationSec: "5", mime: "video/webm", name: "falso.webm" });
    expect(res.status).toBe(415);
    expect(res.body.error).toEqual({ code: "MEDIA_UNSUPPORTED", message: "Formato de arquivo não suportado." });
    expect(tmpCount()).toBe(before);
  });

  it("rejeita áudio > 10 MB, duração acima do limite e kind inválido", async () => {
    const { upload } = await setup();
    const big = Buffer.concat([WEBM, Buffer.alloc(10 * 1024 * 1024)]);
    const r1 = await upload(big, { kind: "audio", durationSec: "10", mime: "audio/webm" });
    expect(r1.status).toBe(413);
    expect(r1.body.error.code).toBe("MEDIA_TOO_LARGE");
    const r2 = await upload(MP4, { kind: "video", durationSec: "121", mime: "video/mp4", name: "v.mp4" });
    expect(r2.body.error).toEqual({ code: "MEDIA_TOO_LONG", message: "A gravação passou de 2 minutos." });
    expect((await upload(WEBM, { kind: "imagem", durationSec: "1", mime: "audio/webm" })).body.error.code).toBe("VALIDATION");
    expect(tmpCount()).toBe(0);
  });

  it("arquivo acima de 50 MB é cortado pelo multer com MEDIA_TOO_LARGE", async () => {
    const { upload } = await setup();
    const huge = Buffer.concat([MP4, Buffer.alloc(50 * 1024 * 1024)]);
    const res = await upload(huge, { kind: "video", durationSec: "10", mime: "video/mp4", name: "v.mp4" });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe("MEDIA_TOO_LARGE");
  });

  it("post de mídia só aceita upload do próprio usuário, do mesmo tipo e não reutilizado", async () => {
    const { upload, post, app } = await setup();
    const audio = (await upload(WEBM, { kind: "audio", durationSec: "3", mime: "audio/webm" })).body;
    expect((await post({ sessionId: null, type: "video", title: "Tipo errado", content: "", mediaUrl: audio.url })).body.error.code).toBe("VALIDATION");
    expect((await post({ sessionId: null, type: "audio", title: "Inventada", content: "", mediaUrl: "/media/nao-existe.webm" })).body.error.code).toBe("VALIDATION");
    expect((await post({ sessionId: null, type: "audio", title: "Primeiro", content: "", mediaUrl: audio.url })).status).toBe(201);
    expect((await post({ sessionId: null, type: "audio", title: "Reuso", content: "", mediaUrl: audio.url })).body.error.code).toBe("VALIDATION");
    const other = await request(app).post("/api/v1/auth/register").send({ name: "Outra", email: "o@x.com", password: "segredo12" });
    const audio2 = (await upload(WEBM, { kind: "audio", durationSec: "3", mime: "audio/webm" })).body;
    const steal = await request(app).post("/api/v1/posts").set("Authorization", `Bearer ${other.body.token}`).send({ sessionId: null, type: "audio", title: "Roubo", content: "", mediaUrl: audio2.url });
    expect(steal.body.error.code).toBe("VALIDATION");
  });

  it("exige login", async () => {
    const { app } = await setup();
    expect((await request(app).post("/api/v1/uploads")).status).toBe(401);
  });
});
```

Em `backend/test/storage.test.ts`, acrescentar:

```ts
import { vi } from "vitest";

vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    uploader: { upload: vi.fn(async () => ({ secure_url: "https://res.cloudinary.com/demo/video/upload/v1/dotstudy/abc.webm" })) },
  },
}));

describe("storage cloudinary", () => {
  it("envia como resource_type video na pasta dotstudy, apaga o temporário e devolve a URL segura", async () => {
    const { v2 } = await import("cloudinary");
    const { createCloudinaryStorage } = await import("../src/storage/cloudinary");
    const tmp = path.join(await mkdtemp(path.join(os.tmpdir(), "dotstudy-tmp-")), "f");
    await writeFile(tmp, "x");
    const { url } = await createCloudinaryStorage().save({ tmpPath: tmp, ext: "webm", mimeType: "audio/webm" });
    expect(url).toBe("https://res.cloudinary.com/demo/video/upload/v1/dotstudy/abc.webm");
    expect(v2.uploader.upload).toHaveBeenCalledWith(tmp, expect.objectContaining({ resource_type: "video", folder: "dotstudy" }));
    expect(existsSync(tmp)).toBe(false);
  });
});
```

- [ ] **Step 2: Implementar**

`backend/src/storage/sniff.ts`:

```ts
export type Container = "webm" | "mp4" | "ogg" | "mpeg" | "wav";

export function sniffContainer(head: Buffer): Container | null {
  if (head.length >= 4 && head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3) return "webm";
  if (head.length >= 8 && head.toString("ascii", 4, 8) === "ftyp") return "mp4";
  if (head.length >= 4 && head.toString("ascii", 0, 4) === "OggS") return "ogg";
  if (head.length >= 3 && head.toString("ascii", 0, 3) === "ID3") return "mpeg";
  if (head.length >= 2 && head[0] === 0xff && (head[1] & 0xe0) === 0xe0) return "mpeg";
  if (head.length >= 12 && head.toString("ascii", 0, 4) === "RIFF" && head.toString("ascii", 8, 12) === "WAVE") return "wav";
  return null;
}

export const ALLOWED: Record<"audio" | "video", Container[]> = {
  audio: ["webm", "ogg", "mp4", "mpeg", "wav"],
  video: ["webm", "mp4"],
};

export const EXTENSION: Record<Container, string> = { webm: "webm", mp4: "mp4", ogg: "ogg", mpeg: "mp3", wav: "wav" };
```

`backend/src/storage/cloudinary.ts`:

```ts
import { unlink } from "node:fs/promises";
import { v2 as cloudinary } from "cloudinary";
import type { StorageDriver } from "./driver";

/** Lê as credenciais de CLOUDINARY_URL (variável de ambiente lida pelo próprio SDK). */
export function createCloudinaryStorage(): StorageDriver {
  cloudinary.config({ secure: true });
  return {
    async save({ tmpPath }) {
      try {
        // áudio e vídeo usam resource_type "video" no Cloudinary
        const result = await cloudinary.uploader.upload(tmpPath, { resource_type: "video", folder: "dotstudy" });
        return { url: result.secure_url };
      } finally {
        await unlink(tmpPath).catch(() => undefined);
      }
    },
  };
}
```

`env.ts`: `STORAGE_DRIVER: z.enum(["local", "cloudinary"]).default("local")`, `CLOUDINARY_URL: z.string().optional()` e um `.superRefine`:

```ts
.superRefine((e, ctx) => {
  if (e.STORAGE_DRIVER === "cloudinary" && !e.CLOUDINARY_URL) {
    ctx.addIssue({ code: "custom", path: ["CLOUDINARY_URL"], message: "CLOUDINARY_URL é obrigatório com STORAGE_DRIVER=cloudinary" });
  }
});
```

`storage/index.ts`:

```ts
export function createStorage(env: Env): StorageDriver {
  return env.STORAGE_DRIVER === "cloudinary" ? createCloudinaryStorage() : createLocalStorage(env.UPLOAD_DIR);
}
```

`backend/src/modules/uploads/service.ts`:

```ts
import { open, unlink } from "node:fs/promises";
import { MEDIA_LIMITS } from "@dot-study/shared/contracts";
import { z } from "zod";
import type { Deps } from "../../deps";
import { AppError } from "../../errors";
import { ALLOWED, EXTENSION, sniffContainer } from "../../storage/sniff";
import { parse } from "../../validate";
import type { MediaResolver } from "../posts/service";

const fieldsSchema = z.object({
  kind: z.enum(["audio", "video"], { errorMap: () => ({ message: "Tipo de mídia inválido." }) }),
  durationSec: z.coerce.number({ invalid_type_error: "Duração inválida." }).positive("Duração inválida."),
});

async function readHead(filePath: string): Promise<Buffer> {
  const fh = await open(filePath, "r");
  try {
    const buf = Buffer.alloc(16);
    const { bytesRead } = await fh.read(buf, 0, 16, 0);
    return buf.subarray(0, bytesRead);
  } finally {
    await fh.close();
  }
}

export function createUploadService(deps: Deps) {
  return {
    async upload(userId: string, file: Express.Multer.File | undefined, body: unknown) {
      if (!file) throw new AppError("VALIDATION", "Envie um arquivo de áudio ou vídeo.");
      let stored = false;
      try {
        const { kind, durationSec } = parse(fieldsSchema, body);
        const limits = MEDIA_LIMITS[kind];
        if (!file.mimetype.startsWith(`${kind}/`)) throw new AppError("MEDIA_UNSUPPORTED", "Formato de arquivo não suportado.");
        const container = sniffContainer(await readHead(file.path));
        if (!container || !ALLOWED[kind].includes(container)) throw new AppError("MEDIA_UNSUPPORTED", "Formato de arquivo não suportado.");
        if (file.size > limits.maxBytes) throw new AppError("MEDIA_TOO_LARGE", `O arquivo passou de ${limits.maxBytes / 1024 / 1024} MB.`);
        if (durationSec > limits.maxSeconds) throw new AppError("MEDIA_TOO_LONG", `A gravação passou de ${limits.maxSeconds / 60} minutos.`);
        const { url } = await deps.storage.save({ tmpPath: file.path, ext: EXTENSION[container], mimeType: file.mimetype });
        stored = true;
        const rounded = Math.max(1, Math.round(durationSec));
        await deps.prisma.media.create({ data: { ownerId: userId, url, kind, durationSec: rounded, sizeBytes: file.size, createdAt: deps.now() } });
        return { url, durationSec: rounded };
      } finally {
        if (!stored) await unlink(file.path).catch(() => undefined);
      }
    },
  };
}

export const ownedMediaResolver: MediaResolver = async (tx, userId, input) => {
  if (input.type === "text") return null;
  const media = input.mediaUrl
    ? await tx.media.findFirst({ where: { url: input.mediaUrl, ownerId: userId, kind: input.type, post: null } })
    : null;
  if (!media) throw new AppError("VALIDATION", "Grave ou envie a mídia antes de publicar.");
  return { mediaId: media.id, mediaUrl: media.url, mediaDurationSec: media.durationSec };
};
```

(Duas publicações simultâneas com a mesma mídia: a segunda esbarra no `@unique` de `Post.mediaId` (P2002). Em `posts/service.ts > create`, envolver o `tx.post.create` e converter `isUniqueViolation` em `AppError("VALIDATION", "Essa mídia já foi publicada.")`.)

`backend/src/modules/uploads/routes.ts`:

```ts
import os from "node:os";
import path from "node:path";
import { MEDIA_LIMITS } from "@dot-study/shared/contracts";
import { Router, type ErrorRequestHandler } from "express";
import multer from "multer";
import type { Deps } from "../../deps";
import { AppError } from "../../errors";
import { requireAuth, userIdOf } from "../../middleware/auth";
import { createUploadService } from "./service";

export function createUploadsRouter(deps: Deps): Router {
  const service = createUploadService(deps);
  const upload = multer({
    dest: path.join(os.tmpdir(), "dotstudy-uploads"),
    limits: { fileSize: MEDIA_LIMITS.video.maxBytes, files: 1, fields: 5 },
  });
  const multerErrors: ErrorRequestHandler = (err, _req, _res, next) => {
    if (err instanceof multer.MulterError) {
      next(err.code === "LIMIT_FILE_SIZE"
        ? new AppError("MEDIA_TOO_LARGE", `O arquivo passou de ${MEDIA_LIMITS.video.maxBytes / 1024 / 1024} MB.`)
        : new AppError("VALIDATION", "Envio de arquivo inválido."));
      return;
    }
    next(err);
  };
  const router = Router();
  router.post("/", requireAuth(deps.env), upload.single("file"), multerErrors, async (req, res) => {
    res.status(201).json(await service.upload(userIdOf(req), req.file, req.body));
  });
  return router;
}
```

`app.ts`: `api.use("/uploads", createUploadsRouter(deps));` e trocar a montagem dos posts por `api.use("/posts", createPostsRouter(deps, ownedMediaResolver));`.

O multer apaga o arquivo parcial quando dá `LIMIT_FILE_SIZE`. O teste `tmpCount()` comprova.

- [ ] **Step 3: Verificar e commitar**

Run: `npm test -w backend && npm run lint && npm run typecheck && npm run build` → PASS.

```bash
git add -A backend
git commit --author="Felipe Wapf Fettback <wapffelipe@gmail.com>" \
  -m "feat: receber uploads de áudio e vídeo com validação e Cloudinary" \
  -m "Co-Authored-By: Lucas Rodrigues Grecco <79089727+lucvs07@users.noreply.github.com>"
```

---

### Task 10: Frontend — cliente HTTP, token e serviços de auth/usuário/assuntos

**Autor:** Tiago · **Coautor:** Rafael

**Files:**
- Create: `frontend/src/services/api/{tokens,http,auth,users,subjects}.ts`, `frontend/src/services/api/http.test.ts`, `frontend/src/services/api/auth-users.test.ts`
- Modify: `frontend/src/app/providers.tsx` (escuta `dotstudy:unauthorized` e zera o `me`), `frontend/src/app/providers.test.tsx` (novo teste)

**Interfaces:**
- Consumes: `ServiceError`, `ServiceErrorCode`, `User`, `UserStats`, `Subject`, `Theme`, `AuthService`, `UserService`, `SubjectService`, `queryKeys.me`.
- Produces:
  - `TokenStore { get(): string | null; set(token: string | null): void }`; `browserTokenStore(key = "dotstudy:token")`; `memoryTokenStore()`
  - `UNAUTHORIZED_EVENT = "dotstudy:unauthorized"`
  - `HttpClient { baseUrl: string; tokens: TokenStore; request<T>(method, path, opts?): Promise<T> }` e `createHttpClient({ baseUrl, tokens, fetchFn?, onUnauthorized? })`
  - `createApiAuthService(http)`, `createApiUserService(http)`, `createApiSubjectService(http)`

- [ ] **Step 1: Testes do cliente HTTP (falhando)**

`frontend/src/services/api/http.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { ServiceError } from "@/services/contracts";
import { createHttpClient } from "./http";
import { memoryTokenStore } from "./tokens";

const json = (status: number, body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));

describe("createHttpClient", () => {
  it("monta URL com /api/v1, query, JSON e Authorization", async () => {
    const tokens = memoryTokenStore();
    tokens.set("tok");
    const fetchFn = vi.fn((..._args: unknown[]) => json(200, { ok: true }));
    const http = createHttpClient({ baseUrl: "http://api.test", tokens, fetchFn });
    await http.request("POST", "/posts", { body: { a: 1 }, query: { limit: 2, savedOnly: true, cursor: null } });
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://api.test/api/v1/posts?limit=2&savedOnly=true");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ a: 1 }));
    expect((init.headers as Record<string, string>)["Authorization"]).toBe("Bearer tok");
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
  });

  it("baseUrl vazio usa caminho relativo (mesma origem, Docker)", async () => {
    const fetchFn = vi.fn((..._args: unknown[]) => json(200, {}));
    await createHttpClient({ baseUrl: "", tokens: memoryTokenStore(), fetchFn }).request("GET", "/health");
    expect(fetchFn.mock.calls[0][0]).toBe("/api/v1/health");
  });

  it("erro da API vira ServiceError com o mesmo code e mensagem", async () => {
    const http = createHttpClient({ baseUrl: "", tokens: memoryTokenStore(), fetchFn: () => json(409, { error: { code: "EMAIL_TAKEN", message: "Já existe uma conta com esse email." } }) });
    await expect(http.request("POST", "/auth/register")).rejects.toEqual(new ServiceError("EMAIL_TAKEN", "Já existe uma conta com esse email."));
  });

  it("falha de rede ou resposta estranha vira NETWORK em pt-BR", async () => {
    const down = createHttpClient({ baseUrl: "", tokens: memoryTokenStore(), fetchFn: () => Promise.reject(new TypeError("Failed to fetch")) });
    await expect(down.request("GET", "/health")).rejects.toMatchObject({ code: "NETWORK", message: "Não foi possível falar com o servidor. Verifique sua conexão e tente de novo." });
    const html = createHttpClient({ baseUrl: "", tokens: memoryTokenStore(), fetchFn: () => Promise.resolve(new Response("<html>502</html>", { status: 502 })) });
    await expect(html.request("GET", "/health")).rejects.toMatchObject({ code: "NETWORK", message: "O servidor respondeu com um erro inesperado. Tente de novo." });
  });

  it("401 com token salvo apaga o token e avisa (sessão expirada)", async () => {
    const tokens = memoryTokenStore();
    tokens.set("velho");
    const onUnauthorized = vi.fn();
    const http = createHttpClient({ baseUrl: "", tokens, onUnauthorized, fetchFn: () => json(401, { error: { code: "UNAUTHORIZED", message: "Sua sessão expirou. Faça login de novo." } }) });
    await expect(http.request("GET", "/auth/me")).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(tokens.get()).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("401 de login errado (sem token) não dispara o aviso", async () => {
    const onUnauthorized = vi.fn();
    const http = createHttpClient({ baseUrl: "", tokens: memoryTokenStore(), onUnauthorized, fetchFn: () => json(401, { error: { code: "INVALID_CREDENTIALS", message: "Email ou senha incorretos." } }) });
    await expect(http.request("POST", "/auth/login")).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("multipart não define Content-Type (o navegador põe o boundary)", async () => {
    const fetchFn = vi.fn((..._args: unknown[]) => json(201, {}));
    const form = new FormData();
    form.append("kind", "audio");
    await createHttpClient({ baseUrl: "", tokens: memoryTokenStore(), fetchFn }).request("POST", "/uploads", { form });
    const init = fetchFn.mock.calls[0][1] as RequestInit;
    expect(init.body).toBe(form);
    expect((init.headers as Record<string, string>)["Content-Type"]).toBeUndefined();
  });
});
```

- [ ] **Step 2: Implementar `tokens.ts` e `http.ts`**

```ts
// tokens.ts
export interface TokenStore {
  get(): string | null;
  set(token: string | null): void;
}

export function memoryTokenStore(): TokenStore {
  let token: string | null = null;
  return { get: () => token, set: (t) => void (token = t) };
}

/** localStorage com fallback em memória (modo privado / storage bloqueado). */
export function browserTokenStore(key = "dotstudy:token"): TokenStore {
  const memory = memoryTokenStore();
  return {
    get() {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return memory.get();
      }
    },
    set(token) {
      memory.set(token);
      try {
        if (token) window.localStorage.setItem(key, token);
        else window.localStorage.removeItem(key);
      } catch {
        // storage bloqueado: o token fica só em memória até recarregar
      }
    },
  };
}
```

```ts
// http.ts
import { ServiceError, type ServiceErrorCode } from "@/services/contracts";
import type { TokenStore } from "./tokens";

export const UNAUTHORIZED_EVENT = "dotstudy:unauthorized";

const KNOWN_CODES: ReadonlySet<string> = new Set<ServiceErrorCode>([
  "INVALID_CREDENTIALS", "EMAIL_TAKEN", "VALIDATION", "UNAUTHORIZED", "NOT_FOUND", "INSUFFICIENT_COINS",
  "ALREADY_OWNED", "NOT_OWNED", "CYCLE_TOO_SOON", "SESSION_CLOSED", "MEDIA_TOO_LARGE", "MEDIA_TOO_LONG",
  "MEDIA_UNSUPPORTED", "NETWORK",
]);

type Method = "GET" | "POST" | "PATCH" | "DELETE";
type Query = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  body?: unknown;
  query?: Query;
  form?: FormData;
}

export interface HttpClient {
  baseUrl: string;
  tokens: TokenStore;
  request<T>(method: Method, path: string, opts?: RequestOptions): Promise<T>;
}

type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;

function queryString(query: Query | undefined): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null) params.set(k, String(v));
  const s = params.toString();
  return s ? `?${s}` : "";
}

export function createHttpClient({
  baseUrl,
  tokens,
  fetchFn = (input, init) => globalThis.fetch(input, init),
  onUnauthorized = () => window.dispatchEvent(new Event(UNAUTHORIZED_EVENT)),
}: {
  baseUrl: string;
  tokens: TokenStore;
  fetchFn?: FetchFn;
  onUnauthorized?: () => void;
}): HttpClient {
  const base = baseUrl.replace(/\/+$/, "");
  return {
    baseUrl: base,
    tokens,
    async request<T>(method: Method, path: string, opts: RequestOptions = {}) {
      const headers: Record<string, string> = { Accept: "application/json" };
      const token = tokens.get();
      if (token) headers["Authorization"] = `Bearer ${token}`;
      let body: BodyInit | undefined;
      if (opts.form) body = opts.form;
      else if (opts.body !== undefined) {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(opts.body);
      }
      let res: Response;
      try {
        res = await fetchFn(`${base}/api/v1${path}${queryString(opts.query)}`, { method, headers, body });
      } catch {
        throw new ServiceError("NETWORK", "Não foi possível falar com o servidor. Verifique sua conexão e tente de novo.");
      }
      const data: unknown = res.status === 204 ? null : await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 401 && token) {
          tokens.set(null);
          onUnauthorized();
        }
        const err = (data as { error?: { code?: unknown; message?: unknown } } | null)?.error;
        if (err && typeof err.code === "string" && KNOWN_CODES.has(err.code)) {
          throw new ServiceError(err.code as ServiceErrorCode, typeof err.message === "string" ? err.message : "Algo deu errado.");
        }
        throw new ServiceError("NETWORK", "O servidor respondeu com um erro inesperado. Tente de novo.");
      }
      return data as T;
    },
  };
}
```

- [ ] **Step 3: Testes dos serviços de auth/usuário/assuntos (falhando)**

`frontend/src/services/api/auth-users.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { createApiAuthService } from "./auth";
import { createHttpClient } from "./http";
import { memoryTokenStore } from "./tokens";
import { createApiSubjectService } from "./subjects";
import { createApiUserService } from "./users";

const user = { id: "u1", name: "Ana", email: "a@b.com", coins: 250, dotColor: "#22CFD5", activeAccessoryId: null, unlockedAccessoryIds: [], createdAt: "2026-09-29T12:00:00.000Z" };
const json = (status: number, body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status }));

function setup(handler: (url: string, init: RequestInit) => Promise<Response>) {
  const tokens = memoryTokenStore();
  const fetchFn = vi.fn(handler);
  const http = createHttpClient({ baseUrl: "http://api", tokens, fetchFn, onUnauthorized: () => {} });
  return { tokens, fetchFn, auth: createApiAuthService(http), users: createApiUserService(http), subjects: createApiSubjectService(http) };
}

describe("serviços api: auth/usuário/assuntos", () => {
  it("login guarda o token e devolve o usuário; logout apaga", async () => {
    const { auth, tokens, fetchFn } = setup(() => json(200, { token: "jwt", user }));
    expect(await auth.login({ email: "a@b.com", password: "segredo12" })).toEqual(user);
    expect(tokens.get()).toBe("jwt");
    expect(fetchFn.mock.calls[0][0]).toBe("http://api/api/v1/auth/login");
    await auth.logout();
    expect(tokens.get()).toBeNull();
  });

  it("me(): sem token não chama a API; token expirado devolve null", async () => {
    const { auth, tokens, fetchFn } = setup(() => json(401, { error: { code: "UNAUTHORIZED", message: "Sua sessão expirou. Faça login de novo." } }));
    expect(await auth.me()).toBeNull();
    expect(fetchFn).not.toHaveBeenCalled();
    tokens.set("velho");
    expect(await auth.me()).toBeNull();
    expect(tokens.get()).toBeNull();
  });

  it("getStats envia o fuso do navegador", async () => {
    const { users, fetchFn, tokens } = setup(() => json(200, { streakDays: 1, totalMinutes: 25, completedCycles: 1, last7Days: [] }));
    tokens.set("jwt");
    await users.getStats();
    expect(fetchFn.mock.calls[0][0]).toBe(`http://api/api/v1/users/me/stats?tzOffset=${new Date().getTimezoneOffset()}`);
  });

  it("updateDot e updateProfile usam PATCH", async () => {
    const { users, fetchFn, tokens } = setup(() => json(200, user));
    tokens.set("jwt");
    await users.updateDot({ activeAccessoryId: null });
    await users.updateProfile({ name: "Bia" });
    expect(fetchFn.mock.calls.map((c) => [(c[1] as RequestInit).method, c[0]])).toEqual([
      ["PATCH", "http://api/api/v1/users/me/dot"],
      ["PATCH", "http://api/api/v1/users/me"],
    ]);
  });

  it("assuntos e tema aleatório", async () => {
    const { subjects, fetchFn, tokens } = setup((url) => json(200, url.endsWith("/random-theme") ? { id: 201, title: "Mecânica Clássica", subjectId: 2 } : []));
    tokens.set("jwt");
    await subjects.list();
    expect((await subjects.randomTheme(2)).title).toBe("Mecânica Clássica");
    expect(fetchFn.mock.calls[1][0]).toBe("http://api/api/v1/subjects/2/random-theme");
  });
});
```

- [ ] **Step 4: Implementar `auth.ts`, `users.ts`, `subjects.ts`**

```ts
// auth.ts
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
```

```ts
// users.ts
import type { User, UserService, UserStats } from "@/services/contracts";
import type { HttpClient } from "./http";

export function createApiUserService(http: HttpClient): UserService {
  return {
    updateProfile: (input) => http.request<User>("PATCH", "/users/me", { body: input }),
    updateDot: (input) => http.request<User>("PATCH", "/users/me/dot", { body: input }),
    getStats: () => http.request<UserStats>("GET", "/users/me/stats", { query: { tzOffset: new Date().getTimezoneOffset() } }),
  };
}
```

```ts
// subjects.ts
import type { Subject, SubjectService, Theme } from "@/services/contracts";
import type { HttpClient } from "./http";

export function createApiSubjectService(http: HttpClient): SubjectService {
  return {
    list: () => http.request<Subject[]>("GET", "/subjects"),
    randomTheme: (subjectId) => http.request<Theme>("GET", `/subjects/${subjectId}/random-theme`),
  };
}
```

- [ ] **Step 5: Sessão expirada no app (Review Focus 3)**

Em `frontend/src/app/providers.tsx`, dentro de `AppProviders`, adicionar o efeito:

```tsx
useEffect(() => {
  const onUnauthorized = () => client.setQueryData(queryKeys.me, null);
  window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
}, [client]);
```

Teste `frontend/src/app/providers.test.tsx` (`// @vitest-environment jsdom`):
- Renderiza `<AppRoutes />` com `renderWithProviders`, usuário demo logado, na rota `/ranking`.
- Dispara `window.dispatchEvent(new Event("dotstudy:unauthorized"))` dentro de `act`.
- Espera `findByRole("heading", { name: /entrar/i })`.

- [ ] **Step 6: Verificar e commitar**

Run: `npm test -w frontend && npm run lint && npm run typecheck` → PASS.

```bash
git add -A frontend
git commit --author="Tiago Brito Nário <tiago.tibi.nario@gmail.com>" \
  -m "feat: criar cliente HTTP e serviços de autenticação para a API" \
  -m "Co-Authored-By: Rafael Augusto Oliveira Silva <rafael.a.os@hotmail.com>"
```

---

### Task 11: Frontend — demais serviços da API e seleção `VITE_DATA_SOURCE=api`

**Autor:** Rafael · **Coautor:** Monique

**Files:**
- Create: `frontend/src/services/api/{sessions,posts,rankings,shop,media,index}.ts`, `frontend/src/services/api/services.test.ts`, `frontend/.env.api`
- Modify: `frontend/src/services/index.ts`, `frontend/src/services/index.test.ts`, `frontend/package.json` (script `dev:api`), `package.json` raiz (`dev:api`), `.gitignore` (`!.env.api`)

**Interfaces:**
- Consumes: `createHttpClient`, `browserTokenStore`, `createApiAuthService`, `createApiUserService`, `createApiSubjectService` (Task 10).
- Produces:
  - `createApiSessionService(http)`, `createApiPostService(http)`, `createApiRankingService(http)`, `createApiShopService(http)`, `createApiMediaService(http)`
  - `createApiServices({ baseUrl, tokens?, fetchFn? }): Services`
  - `createServices("api")` passa a funcionar e usa `import.meta.env.VITE_API_URL ?? ""`

- [ ] **Step 1: Testes (falhando)**

`frontend/src/services/api/services.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { createApiServices } from "./index";
import { memoryTokenStore } from "./tokens";

const json = (status: number, body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status }));

function setup(body: unknown = {}) {
  const tokens = memoryTokenStore();
  tokens.set("jwt");
  const fetchFn = vi.fn((..._args: unknown[]) => json(200, body));
  const services = createApiServices({ baseUrl: "http://api", tokens, fetchFn });
  const calls = () => fetchFn.mock.calls.map((c) => [(c[1] as RequestInit).method, c[0] as string, (c[1] as RequestInit).body]);
  return { services, fetchFn, calls };
}

describe("serviços api: sessões, posts, ranking, loja, mídia", () => {
  it("sessões mapeiam para as rotas do contrato", async () => {
    const { services, calls } = setup();
    await services.sessions.start({ mode: "challenge", subjectId: "random", focusMinutes: 25 });
    await services.sessions.completeCycle("s1");
    await services.sessions.updateNotes("s1", "notas");
    await services.sessions.finish("s1", "abandoned");
    await services.sessions.list();
    expect(calls()).toEqual([
      ["POST", "http://api/api/v1/sessions", JSON.stringify({ mode: "challenge", subjectId: "random", focusMinutes: 25 })],
      ["POST", "http://api/api/v1/sessions/s1/cycles", undefined],
      ["PATCH", "http://api/api/v1/sessions/s1", JSON.stringify({ notes: "notas" })],
      ["PATCH", "http://api/api/v1/sessions/s1", JSON.stringify({ status: "abandoned" })],
      ["GET", "http://api/api/v1/sessions", undefined],
    ]);
  });

  it("posts: filtros viram query, curtir/salvar usam POST e DELETE", async () => {
    const { services, calls } = setup({ items: [], nextCursor: null });
    await services.posts.list({ subjectId: 1, savedOnly: true, cursor: "2026-09-29T12:00:00.000Z|p1", limit: 10 });
    await services.posts.like("p1");
    await services.posts.unlike("p1");
    await services.posts.save("p1");
    await services.posts.unsave("p1");
    await services.posts.addComment("p1", { content: "oi", parentId: null });
    expect(calls().map(([m, u]) => `${m} ${u}`)).toEqual([
      "GET http://api/api/v1/posts?subjectId=1&savedOnly=true&cursor=2026-09-29T12%3A00%3A00.000Z%7Cp1&limit=10",
      "POST http://api/api/v1/posts/p1/like",
      "DELETE http://api/api/v1/posts/p1/like",
      "POST http://api/api/v1/posts/p1/save",
      "DELETE http://api/api/v1/posts/p1/save",
      "POST http://api/api/v1/posts/p1/comments",
    ]);
  });

  it("ranking e loja", async () => {
    const { services, calls } = setup([]);
    await services.rankings.bySubject(3);
    await services.shop.listAccessories();
    await services.shop.purchase("bow");
    expect(calls()).toEqual([
      ["GET", "http://api/api/v1/rankings/3", undefined],
      ["GET", "http://api/api/v1/shop/accessories", undefined],
      ["POST", "http://api/api/v1/shop/purchase", JSON.stringify({ accessoryId: "bow" })],
    ]);
  });

  it("mídia: upload multipart com nome e tipo; resolveUrl prefixa a API em caminhos relativos", async () => {
    const { services, fetchFn } = setup({ url: "/media/x.webm", durationSec: 3 });
    const res = await services.media.upload(new Blob(["a"], { type: "audio/webm;codecs=opus" }), "audio", 3.2);
    expect(res).toEqual({ url: "/media/x.webm", durationSec: 3 });
    const form = (fetchFn.mock.calls[0][1] as RequestInit).body as FormData;
    expect(form.get("kind")).toBe("audio");
    expect(form.get("durationSec")).toBe("3.2");
    expect((form.get("file") as File).name).toBe("gravacao.webm");
    expect(await services.media.resolveUrl("/media/x.webm")).toBe("http://api/media/x.webm");
    expect(await services.media.resolveUrl("https://res.cloudinary.com/a.webm")).toBe("https://res.cloudinary.com/a.webm");
  });

  it("não expõe resetDemoData (só existe no mock)", () => {
    expect("resetDemoData" in setup().services).toBe(false);
  });
});
```

Em `frontend/src/services/index.test.ts`, trocar o teste antigo por:

```ts
it("aceita mock e api; recusa fonte desconhecida", () => {
  expect(createServices("api").auth).toBeDefined();
  expect(() => createServices("graphql")).toThrow(/VITE_DATA_SOURCE="graphql" inválido/);
});
```

(O teste de `"mock"` continua coberto pelos testes de página.)

- [ ] **Step 2: Implementar**

```ts
// sessions.ts
import type { CoinReward, SessionService, StudySession } from "@/services/contracts";
import type { HttpClient } from "./http";

export function createApiSessionService(http: HttpClient): SessionService {
  return {
    start: (input) => http.request<StudySession>("POST", "/sessions", { body: input }),
    completeCycle: (id) => http.request<{ session: StudySession; reward: CoinReward }>("POST", `/sessions/${encodeURIComponent(id)}/cycles`),
    updateNotes: (id, notes) => http.request<StudySession>("PATCH", `/sessions/${encodeURIComponent(id)}`, { body: { notes } }),
    finish: (id, status) => http.request<StudySession>("PATCH", `/sessions/${encodeURIComponent(id)}`, { body: { status } }),
    list: () => http.request<StudySession[]>("GET", "/sessions"),
  };
}
```

```ts
// posts.ts
import type { Comment, CoinReward, Page, Post, PostService } from "@/services/contracts";
import type { HttpClient } from "./http";

export function createApiPostService(http: HttpClient): PostService {
  const p = (id: string) => `/posts/${encodeURIComponent(id)}`;
  return {
    list: (filter = {}) =>
      http.request<Page<Post>>("GET", "/posts", {
        query: { subjectId: filter.subjectId, type: filter.type, savedOnly: filter.savedOnly || undefined, cursor: filter.cursor, limit: filter.limit },
      }),
    get: (id) => http.request<Post>("GET", p(id)),
    create: (input) => http.request<{ post: Post; reward: CoinReward | null }>("POST", "/posts", { body: input }),
    like: (id) => http.request<Post>("POST", `${p(id)}/like`),
    unlike: (id) => http.request<Post>("DELETE", `${p(id)}/like`),
    save: (id) => http.request<Post>("POST", `${p(id)}/save`),
    unsave: (id) => http.request<Post>("DELETE", `${p(id)}/save`),
    listComments: (postId) => http.request<Comment[]>("GET", `${p(postId)}/comments`),
    addComment: (postId, input) => http.request<Comment>("POST", `${p(postId)}/comments`, { body: input }),
  };
}
```

```ts
// rankings.ts
import type { RankEntry, RankingService } from "@/services/contracts";
import type { HttpClient } from "./http";

export function createApiRankingService(http: HttpClient): RankingService {
  return { bySubject: (subjectId) => http.request<RankEntry[]>("GET", `/rankings/${subjectId}`) };
}
```

```ts
// shop.ts
import type { Accessory, ShopService, User } from "@/services/contracts";
import type { HttpClient } from "./http";

export function createApiShopService(http: HttpClient): ShopService {
  return {
    listAccessories: () => http.request<Accessory[]>("GET", "/shop/accessories"),
    purchase: (accessoryId) => http.request<User>("POST", "/shop/purchase", { body: { accessoryId } }),
  };
}
```

```ts
// media.ts
import type { MediaService } from "@/services/contracts";
import type { HttpClient } from "./http";

function extensionOf(type: string): string {
  if (type.includes("mp4")) return "mp4";
  if (type.includes("ogg")) return "ogg";
  if (type.includes("mpeg")) return "mp3";
  if (type.includes("wav")) return "wav";
  return "webm";
}

export function createApiMediaService(http: HttpClient): MediaService {
  return {
    async upload(blob, kind, durationSec) {
      const form = new FormData();
      form.append("kind", kind);
      form.append("durationSec", String(durationSec));
      form.append("file", blob, `gravacao.${extensionOf(blob.type)}`);
      return http.request<{ url: string; durationSec: number }>("POST", "/uploads", { form });
    },
    async resolveUrl(url) {
      return url.startsWith("/") ? `${http.baseUrl}${url}` : url;
    },
  };
}
```

```ts
// index.ts
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

export function createApiServices({ baseUrl, tokens = browserTokenStore(), fetchFn }: {
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
```

`frontend/src/services/index.ts`:

```ts
export function createServices(source: string | undefined): AppServices {
  if (source === undefined || source === "" || source === "mock") return createMockServices();
  if (source === "api") return createApiServices({ baseUrl: import.meta.env.VITE_API_URL ?? "" });
  throw new Error(`VITE_DATA_SOURCE="${source}" inválido (use "mock" ou "api").`);
}
```

`frontend/.env.api` (sem segredos; versionado):

```
VITE_DATA_SOURCE=api
VITE_API_URL=http://127.0.0.1:3000
```

Scripts: no frontend, `"dev:api": "vite --mode api"`; na raiz, `"dev:api": "npm run dev:api -w frontend"`. No `.gitignore`, `!.env.api`.

- [ ] **Step 3: Verificar (incluindo de ponta a ponta local) e commitar**

Run: `npm test && npm run lint && npm run typecheck && npm run build` → PASS.

Verificação manual com o banco de desenvolvimento:
1. `npm run db:dev:up -w backend`
2. `npx -w backend prisma migrate deploy`
3. `npm run db:seed -w backend`
4. Rodar `npm run dev:backend` e `npm run dev:api` em paralelo.
5. Abrir `http://127.0.0.1:5173` e entrar com o demo.

Esperado: feed com p1..p4, ranking de Matemática com a Ana em 510. Registrar no report. Encerrar tudo depois.

```bash
git add -A frontend package.json .gitignore
git commit --author="Rafael Augusto Oliveira Silva <rafael.a.os@hotmail.com>" \
  -m "feat: ligar o frontend à API real com VITE_DATA_SOURCE=api" \
  -m "Co-Authored-By: Monique Ferreira dos Anjos <anjos.moniqueferreira@gmail.com>"
```

---

### Task 12: Frontend — "Acordando o servidor" e polimento do modo API

**Autor:** Monique · **Coautor:** Tiago

**Files:**
- Create: `frontend/src/hooks/useServerWakeup.ts`, `frontend/src/hooks/useServerWakeup.test.ts`, `frontend/src/components/ServerStatusBanner.tsx`, `frontend/src/components/ServerStatusBanner.test.tsx`
- Modify: `frontend/src/app/providers.tsx` ou `frontend/src/main.tsx` (monta o banner quando `VITE_DATA_SOURCE=api`), `frontend/src/pages/PostPage.tsx` (mensagem de mídia indisponível sem citar IndexedDB no modo API)

**Interfaces:**
- Produces:
  - `type WakeupState = "checking" | "waking" | "ready" | "down"`
  - `useServerWakeup(ping: () => Promise<void>, opts?: { slowAfterMs?: number; giveUpAfterMs?: number; retryEveryMs?: number }): { state: WakeupState; retry(): void }`. Padrões: 2000 / 70 000 / 5000.
  - `ServerStatusBanner({ ping })`. Não renderiza nada em `checking`/`ready`.
  - `pingApi(baseUrl)` → `fetch(<base>/api/v1/health)`, que lança se não for 200.

- [ ] **Step 1: Testes do hook (falhando)**

```ts
// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useServerWakeup } from "./useServerWakeup";

describe("useServerWakeup", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("resposta rápida: nunca mostra 'acordando'", async () => {
    const ping = vi.fn(() => Promise.resolve());
    const { result } = renderHook(() => useServerWakeup(ping));
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });
    expect(result.current.state).toBe("ready");
  });

  it("servidor lento (Render hibernando): após 2 s vira 'waking' e depois 'ready'", async () => {
    let resolve!: () => void;
    const ping = vi.fn(() => new Promise<void>((r) => { resolve = r; }));
    const { result } = renderHook(() => useServerWakeup(ping));
    await act(async () => { await vi.advanceTimersByTimeAsync(2100); });
    expect(result.current.state).toBe("waking");
    await act(async () => { resolve(); await vi.advanceTimersByTimeAsync(0); });
    expect(result.current.state).toBe("ready");
  });

  it("falhas repetidas: tenta de novo a cada 5 s e desiste em 70 s; retry recomeça", async () => {
    const ping = vi.fn(() => Promise.reject(new Error("down")));
    const { result } = renderHook(() => useServerWakeup(ping));
    await act(async () => { await vi.advanceTimersByTimeAsync(2100); });
    expect(result.current.state).toBe("waking");
    await act(async () => { await vi.advanceTimersByTimeAsync(70_000); });
    expect(result.current.state).toBe("down");
    expect(ping.mock.calls.length).toBeGreaterThanOrEqual(10);
    ping.mockImplementation(() => Promise.resolve());
    await act(async () => { result.current.retry(); await vi.advanceTimersByTimeAsync(10); });
    expect(result.current.state).toBe("ready");
  });
});
```

- [ ] **Step 2: Implementar o hook**

```ts
import { useCallback, useEffect, useRef, useState } from "react";

export type WakeupState = "checking" | "waking" | "ready" | "down";

export function useServerWakeup(
  ping: () => Promise<void>,
  { slowAfterMs = 2000, giveUpAfterMs = 70_000, retryEveryMs = 5000 }: { slowAfterMs?: number; giveUpAfterMs?: number; retryEveryMs?: number } = {},
) {
  const [state, setState] = useState<WakeupState>("checking");
  const [attempt, setAttempt] = useState(0);
  const pingRef = useRef(ping);
  pingRef.current = ping;

  useEffect(() => {
    let alive = true;
    const started = Date.now();
    setState("checking");
    const slow = setTimeout(() => alive && setState((s) => (s === "checking" ? "waking" : s)), slowAfterMs);
    let retry: ReturnType<typeof setTimeout> | undefined;
    const tryOnce = () => {
      pingRef.current().then(
        () => {
          if (!alive) return;
          clearTimeout(slow);
          setState("ready");
        },
        () => {
          if (!alive) return;
          if (Date.now() - started >= giveUpAfterMs) {
            clearTimeout(slow);
            setState("down");
            return;
          }
          retry = setTimeout(tryOnce, retryEveryMs);
        },
      );
    };
    tryOnce();
    return () => {
      alive = false;
      clearTimeout(slow);
      clearTimeout(retry);
    };
  }, [attempt, slowAfterMs, giveUpAfterMs, retryEveryMs]);

  const retryNow = useCallback(() => setAttempt((n) => n + 1), []);
  return { state, retry: retryNow };
}

export function pingApi(baseUrl: string): () => Promise<void> {
  return async () => {
    const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/api/v1/health`, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`health ${res.status}`);
  };
}
```

(Com timers falsos, `Date.now()` também avança, pois o Vitest falsifica `Date` por padrão.)

- [ ] **Step 3: Banner e montagem**

```tsx
// ServerStatusBanner.tsx
import { useServerWakeup } from "@/hooks/useServerWakeup";

export function ServerStatusBanner({ ping }: { ping: () => Promise<void> }) {
  const { state, retry } = useServerWakeup(ping);
  if (state === "checking" || state === "ready") return null;
  const waking = state === "waking";
  return (
    <div role="status" aria-live="polite" className="fixed top-3 left-1/2 -translate-x-1/2 z-50 rounded-full px-4 py-2 text-sm flex items-center gap-3 shadow"
      style={{ background: waking ? "#FFF6DB" : "rgba(238,27,63,0.1)", color: waking ? "#7A5A00" : "#B4102C", border: `1px solid ${waking ? "#FFC23D" : "rgba(238,27,63,0.3)"}` }}>
      {waking ? (
        <>
          <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: "#FFC23D" }} />
          Acordando o servidor… (até ~1 min no plano gratuito)
        </>
      ) : (
        <>
          Servidor indisponível no momento.
          <button onClick={retry} className="underline font-semibold">Tentar de novo</button>
        </>
      )}
    </div>
  );
}
```

`ServerStatusBanner.test.tsx` (jsdom):
- Com um `ping` que nunca resolve, após 2,1 s aparece o texto "Acordando o servidor… (até ~1 min no plano gratuito)".
- Com um `ping` que resolve na hora, nada é renderizado.

Montagem: em `main.tsx`, quando `import.meta.env.VITE_DATA_SOURCE === "api"`, renderizar `<ServerStatusBanner ping={pingApi(import.meta.env.VITE_API_URL ?? "")} />` antes do `<AppRoutes />`, dentro de `AppProviders`. O ping é estável: criar com `const ping = pingApi(...)` fora do `render`.

`PostPage.tsx`: a mensagem "Esta mídia foi gravada em outro navegador e não está disponível aqui." só faz sentido no mock. Para URL `idb://`, mantê-la. Para as demais, em erro, usar "Não foi possível carregar a mídia. Tente de novo mais tarde."

- [ ] **Step 4: Verificar e commitar**

Run: `npm test -w frontend && npm run lint && npm run typecheck && npm run build` → PASS.

```bash
git add -A frontend
git commit --author="Monique Ferreira dos Anjos <anjos.moniqueferreira@gmail.com>" \
  -m "feat: avisar quando o servidor está acordando no modo API" \
  -m "Co-Authored-By: Tiago Brito Nário <tiago.tibi.nario@gmail.com>"
```

---

### Task 13: Instalável — Dockerfiles, nginx e `docker compose up`

**Autor:** Lucas · **Coautor:** Leonardo

**Files:**
- Create: `backend/Dockerfile`, `frontend/Dockerfile`, `frontend/nginx.conf`, `docker-compose.yml`, `.dockerignore`, `render.yaml`

**Interfaces:**
- Produces: `docker compose up --build` sobe:
  - `db` (Postgres 16)
  - `api` (migra, faz o seed idempotente e sobe a API na porta 3000)
  - `web` (nginx na porta 8080, servindo o build do frontend com `VITE_DATA_SOURCE=api` e `VITE_API_URL=""`, e fazendo proxy de `/api/` e `/media/` para `api:3000`)

- [ ] **Step 1: Arquivos**

`.dockerignore`:

```
**/node_modules
**/dist
**/coverage
.git
.github
.superpowers
docs
**/.env
**/.env.local
backend/uploads
backend/.test-uploads
```

`backend/Dockerfile`:

```dockerfile
FROM node:22-alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --workspace @dot-study/backend --workspace @dot-study/shared --include-workspace-root
COPY shared shared
COPY backend backend
RUN npx --workspace @dot-study/backend prisma generate && npm run build -w @dot-study/backend
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
WORKDIR /app/backend
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/seed.js && node dist/server.js"]
```

`frontend/nginx.conf`:

```nginx
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  client_max_body_size 60m;

  location /api/ {
    proxy_pass http://api:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 120s;
  }

  location /media/ {
    proxy_pass http://api:3000;
  }

  location / {
    try_files $uri /index.html;
  }
}
```

`frontend/Dockerfile`:

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY frontend/package.json frontend/
COPY backend/package.json backend/
RUN npm ci --workspace @dot-study/frontend --workspace @dot-study/shared --include-workspace-root
COPY shared shared
COPY frontend frontend
ARG VITE_DATA_SOURCE=api
ARG VITE_API_URL=
ARG VITE_SPOTIFY_CLIENT_ID=
ENV VITE_DATA_SOURCE=$VITE_DATA_SOURCE VITE_API_URL=$VITE_API_URL VITE_SPOTIFY_CLIENT_ID=$VITE_SPOTIFY_CLIENT_ID
RUN npm run build -w @dot-study/frontend

FROM nginx:1.27-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
```

`docker-compose.yml`:

```yaml
name: dotstudy

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: dotstudy
      POSTGRES_PASSWORD: dotstudy
      POSTGRES_DB: dotstudy
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dotstudy -d dotstudy"]
      interval: 5s
      timeout: 3s
      retries: 20

  api:
    build:
      context: .
      dockerfile: backend/Dockerfile
    environment:
      DATABASE_URL: postgresql://dotstudy:dotstudy@db:5432/dotstudy
      # Segredo só para a instalação local; em produção use um valor próprio (ver docs/09-manual.md)
      JWT_SECRET: ${JWT_SECRET:-instalacao-local-dotstudy-troque-em-producao}
      WEB_ORIGIN: http://127.0.0.1:8080,http://localhost:8080
      STORAGE_DRIVER: local
      UPLOAD_DIR: /data/uploads
      LOG_LEVEL: info
    volumes:
      - uploads:/data/uploads
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://127.0.0.1:3000/api/v1/health || exit 1"]
      interval: 5s
      timeout: 3s
      retries: 30
      start_period: 20s

  web:
    build:
      context: .
      dockerfile: frontend/Dockerfile
      args:
        VITE_DATA_SOURCE: api
        VITE_API_URL: ""
        VITE_SPOTIFY_CLIENT_ID: ${VITE_SPOTIFY_CLIENT_ID:-}
    ports:
      - "8080:80"
    depends_on:
      api:
        condition: service_healthy

volumes:
  pgdata:
  uploads:
```

`render.yaml` (blueprint opcional para a API no Render; os valores secretos ficam com `sync: false`):

```yaml
services:
  - type: web
    name: dot-study-api
    runtime: node
    plan: free
    buildCommand: npm ci --workspace @dot-study/backend --workspace @dot-study/shared --include-workspace-root && npx --workspace @dot-study/backend prisma generate && npm run build -w @dot-study/backend
    startCommand: cd backend && npx prisma migrate deploy && node dist/seed.js && node dist/server.js
    healthCheckPath: /api/v1/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: WEB_ORIGIN
        sync: false
      - key: STORAGE_DRIVER
        value: cloudinary
      - key: CLOUDINARY_URL
        sync: false
```

- [ ] **Step 2: Subir e verificar de ponta a ponta**

```bash
docker compose up -d --build
docker compose ps
```

Expected: `db`, `api` e `web` com status `healthy`/`running`. Depois:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8080/
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8080/ranking
curl -s http://127.0.0.1:8080/api/v1/health
curl -s -X POST http://127.0.0.1:8080/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"demo@dotstudy.app","password":"dotstudy123"}' -o /tmp/claude-1000/login.json
node -e 'const r=require("/tmp/claude-1000/login.json");console.log(r.user.name, r.user.coins)'
```

Expected:
- `200`, `200` (fallback da SPA), `{"status":"ok"}`.
- `Guilherme 840`.

Testar a idempotência do seed:

```bash
docker compose restart api
docker compose logs api | grep "Seed:"
```

Expected: a última linha é `Seed: dados de demonstração já existiam, nada a fazer.`

Upload pelo proxy: gerar um arquivo webm mínimo com `node -e 'require("fs").writeFileSync("/tmp/claude-1000/a.webm", Buffer.concat([Buffer.from([0x1a,0x45,0xdf,0xa3]), Buffer.alloc(1024)]))'`. Enviar via `curl -F kind=audio -F durationSec=3 -F "file=@/tmp/claude-1000/a.webm;type=audio/webm" -H "Authorization: Bearer <token>" http://127.0.0.1:8080/api/v1/uploads`. Fazer `curl` da URL `/media/...` devolvida.

Expected: 201 no upload e 200 na mídia.

Registrar as saídas no report. Encerrar com `docker compose down` (sem `-v`).

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml .dockerignore render.yaml backend/Dockerfile frontend/Dockerfile frontend/nginx.conf
git commit --author="Lucas Rodrigues Grecco <79089727+lucvs07@users.noreply.github.com>" \
  -m "feat: empacotar o app com Docker Compose (banco, API e web)" \
  -m "Co-Authored-By: Leonardo Tanaka Cortez <leonardotanaka0513@gmail.com>"
```

---

### Task 14: CI com backend, banco de teste e build das imagens

**Autor:** Lucas · **Coautor:** Felipe

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Workflow**

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  app:
    name: shared + frontend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx --workspace @dot-study/backend prisma generate
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test -w @dot-study/shared
      - run: npm test -w @dot-study/frontend
      - run: npm run build -w @dot-study/frontend

  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: dotstudy_test
        ports:
          - 5433:5432
        options: >-
          --health-cmd "pg_isready -U postgres"
          --health-interval 5s
          --health-timeout 3s
          --health-retries 20
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx --workspace @dot-study/backend prisma generate
      - run: npm test -w @dot-study/backend
      - run: npm run build -w @dot-study/backend

  docker:
    runs-on: ubuntu-latest
    needs: [app, backend]
    steps:
      - uses: actions/checkout@v4
      - run: docker compose build
```

(O `prisma generate` precisa rodar antes do `typecheck`, porque os tipos do backend vêm do client gerado. Conferir que o `npm run typecheck` da raiz passa localmente logo depois de um `npm ci` limpo + `prisma generate`. Se o `npm ci`/`npm install` já gerar o client via `postinstall` do `@prisma/client`, o passo fica redundante, mas é inofensivo.)

- [ ] **Step 2: Verificar localmente e commitar**

Run:
1. `npx --yes @action-validator/cli@0.6.0 .github/workflows/ci.yml`. Se o validador não rodar no ambiente, conferir a sintaxe com `node -e "require('yaml')"`, que não está disponível; nesse caso revisar à mão e registrar no report.
2. `npm ci && npx -w backend prisma generate && npm run lint && npm run typecheck && npm test && npm run build`, com o banco de teste no ar.

Expected: tudo verde.

```bash
git add .github/workflows/ci.yml
git commit --author="Lucas Rodrigues Grecco <79089727+lucvs07@users.noreply.github.com>" \
  -m "ci: testar backend com Postgres e validar o build das imagens" \
  -m "Co-Authored-By: Felipe Wapf Fettback <wapffelipe@gmail.com>"
```

---

### Task 15: Documentação final — requisitos, escopo, UML e jornada

**Autor:** Tiago · **Coautor:** Lucas

**Files:**
- Modify: `docs/02-requisitos.md`, `docs/03-escopo.md`, `docs/04-modelagem-uml.md`, `docs/08-jornada.md`

- [ ] **Step 1: `docs/02-requisitos.md`**

- **Coluna de status:** trocar "Status CP5" por "Status final (CP6)". Os RFs implementados de forma real (com API e banco) ficam como `Implementado (API + Postgres)`.
- **RF13 (mídia):** `Implementado (upload real: volume local no Docker, Cloudinary no deploy)`.
- **RF14 (Spotify):** `Implementado (embed + PKCE opcional; limitado a 5 contas pelo Spotify)`.
- **Novos RNFs:**
  - RNF09: "Dados persistidos em PostgreSQL com transações nas operações que envolvem moedas".
  - RNF10: "Instalável com `docker compose up` em `http://127.0.0.1:8080`".
  - RNF11: "Regras de pontuação e anti-trapaça aplicadas no servidor".
- **Placeholders `<URL do CP5>` e `<URL do CP6>`:** mantê-los; o grupo preenche depois do deploy.

- [ ] **Step 2: `docs/03-escopo.md`**

- Versão final.
- "Persistência real / autenticação real / API real" sai de "Fora do escopo" e entra em "Dentro do escopo".
- "Fora do escopo" mantém: Google, eventos, apps nativos, recuperação de senha por email, curtidas em comentários, Web Playback SDK.

- [ ] **Step 3: `docs/04-modelagem-uml.md`** — diagramas conferidos contra o código real

- **Diagrama de classes:** atualizar para o schema Prisma (`backend/prisma/schema.prisma`), incluindo `Media` e `Post.mediaId`.
- **Novos diagramas de sequência (Mermaid):**
  1. Login com JWT: LoginPage → `useAuth` → `services/api/auth.ts` → `POST /api/v1/auth/login` → `modules/auth/service.ts` (bcrypt) → JWT → `localStorage`.
  2. Sessão → ciclo → publicação na API: `POST /sessions` → `POST /sessions/:id/cycles` (update condicional, +10) → `POST /uploads` (multer → sniff → `StorageDriver`) → `POST /posts` (mídia própria, recompensa +30 uma vez).
  3. Upload de mídia com os ramos de erro: `MEDIA_UNSUPPORTED`, `MEDIA_TOO_LARGE`, `MEDIA_TOO_LONG`.
  4. Conexão Spotify (PKCE): `SpotifyPlayer` → accounts.spotify.com → `/spotify/callback` → `exchangeCode` → `saveToken` → evento de token → playlists.
  5. Sessão expirada: 401 → `http.ts` apaga o token → evento `dotstudy:unauthorized` → `/login`.
- **Diagrama de implantação** (`flowchart`):
  - navegador → Vercel (web) → Render (API) → Neon (Postgres) e Cloudinary (mídia)
  - no Docker: navegador → nginx:8080 → api:3000 → db:5432 e o volume de uploads
- **Diagramas do CP5:** os de atividade continuam valendo. Revisar as legendas para citar os arquivos reais dos dois modos (mock e API).

Validar cada bloco com `npx -y @mermaid-js/mermaid-cli@11.4.2 -i <bloco>.mmd -o /tmp/claude-1000/<nome>.svg` num diretório temporário em `/tmp/claude-1000/`.

- [ ] **Step 4: `docs/08-jornada.md`**

Nova seção "CP5 → CP6", com uma tabela Decisão | Motivo | Impacto. Itens:
- Pacote `shared` como fonte única do contrato e das regras.
- Express 5 + Prisma 6.
- JWT no `localStorage` (trade-off).
- bcryptjs em vez de bcrypt nativo (imagem Docker sem compilação).
- Estatísticas no fuso do usuário (`tzOffset`).
- Travas de concorrência no banco (update condicional e chaves únicas).
- Duração da mídia vinda do cliente e limitada (sem ffprobe no servidor).
- Validação da assinatura do arquivo.
- Mídia ligada ao dono (`Media`).
- Seed idempotente.
- nginx fazendo proxy de `/api` e `/media` no Docker (mesma origem, sem CORS).
- Render free com hibernação e o banner "Acordando o servidor".
- Cloudinary no deploy por causa do disco efêmero do Render.

Fechar com uma seção "O que ficou para depois": recuperação de senha, moderação, eventos, notificações e testes E2E no navegador.

- [ ] **Step 5: Verificar e commitar**

Run: `npm run lint && npm test` → PASS.

```bash
git add docs
git commit --author="Tiago Brito Nário <tiago.tibi.nario@gmail.com>" \
  -m "docs: atualizar requisitos, escopo, UML e jornada para a versão final" \
  -m "Co-Authored-By: Lucas Rodrigues Grecco <79089727+lucvs07@users.noreply.github.com>"
```

---

### Task 16: Manual de uso, teste de instalação, roteiro do vídeo e README final

**Autor:** Lucas · **Coautor:** Monique

**Files:**
- Create: `docs/09-manual.md`, `docs/10-teste-instalacao.md`
- Modify: `docs/11-roteiros-video.md`, `README.md`

- [ ] **Step 1: `docs/09-manual.md`**

Seções:
1. **Requisitos:** Docker Desktop (Windows/macOS) ou Docker Engine + Compose v2 (Linux); 4 GB livres; portas 8080 livres.
2. **Instalar e rodar (caminho principal):**
   - `git clone https://github.com/lucvs07/dot-study.git`
   - `cd dot-study`
   - `docker compose up --build`
   - Abrir `http://127.0.0.1:8080`. A primeira vez leva alguns minutos.
3. **Entrar:** conta demo `demo@dotstudy.app` / `dotstudy123`, ou criar uma conta (ganha 250 moedas).
4. **Usar:** passo a passo de cada tela — Início, Estudar (desafio e livre, anotações, leitura), publicar (texto, áudio, vídeo e permissões do navegador), Feed, Ranking, Histórico, Loja, Ajustes e Spotify.
5. **Parar e remover:**
   - `docker compose down` mantém os dados.
   - `docker compose down -v` apaga banco e uploads.
6. **Problemas comuns:**
   - **Porta 8080 ocupada:** trocar para `"8081:80"` no compose e incluir `http://127.0.0.1:8081` no `WEB_ORIGIN`.
   - **Docker sem memória.**
   - **Microfone bloqueado:** abrir por `127.0.0.1`, que é contexto seguro.
   - **Spotify "não liberado":** limite de 5 contas.
7. **Rodar sem Docker** (desenvolvimento):
   - `npm install`
   - `npm run db:dev:up -w backend`
   - copiar `backend/.env.example` para `backend/.env`
   - `npx -w backend prisma migrate deploy`
   - `npm run db:seed -w backend`
   - `npm run dev:backend` + `npm run dev:api`
   - modo só-mock: `npm run dev` / `npm run dev:demo`
8. **Rodar os testes:** `npm run db:test:up -w backend` e depois `npm test`.
9. **Deploy público (para o grupo):**
   - Vercel (Root Directory `frontend`, `VITE_DATA_SOURCE=api`, `VITE_API_URL=<URL do Render>`).
   - Render (`render.yaml` ou manual).
   - Neon (`DATABASE_URL`).
   - Cloudinary (`CLOUDINARY_URL`).
   - `WEB_ORIGIN` = URL da Vercel.
   - Redirect URIs do Spotify.

- [ ] **Step 2: `docs/10-teste-instalacao.md`**

Modelo para o teste feito por alguém de fora do grupo. Campos a preencher: nome do testador (com autorização), data, sistema operacional e versão do Docker, passos seguidos (link para o manual), tempo até abrir o app, fluxos testados (checklist) e problemas encontrados com as soluções. Um resultado de exemplo **não deve ser inventado**: deixar os campos com `—` e uma nota "preencher após o teste".

Checklist dos fluxos:
- [ ] cadastro
- [ ] login demo
- [ ] desafio (modo normal ou com `VITE_DEMO_MODE`)
- [ ] publicar texto
- [ ] publicar áudio
- [ ] feed (curtir, comentar)
- [ ] ranking mudou
- [ ] compra na loja
- [ ] reiniciar o compose e os dados continuam lá

- [ ] **Step 3: `docs/11-roteiros-video.md`**

Acrescentar o roteiro do vídeo do CP6 (3 min), com tempo, fala e o que aparece na tela:

| Tempo | Conteúdo |
|---|---|
| 0:00–0:20 | Evolução CP4 → CP5 → CP6 |
| 0:20–0:50 | Arquitetura (diagrama de implantação) e `docker compose up` |
| 0:50–1:30 | Fluxo completo com dados reais (cadastro → desafio Demo → áudio → feed → ranking → loja) |
| 1:30–2:00 | Persistência: reiniciar o compose e os dados continuam |
| 2:00–2:30 | Qualidade: CI verde, testes de concorrência e de anti-trapaça |
| 2:30–3:00 | Link público, manual e teste de instalação externo |

Instruir a gravar com o frontend em modo API e o demo ligado. Para o Docker, gerar o build com `VITE_DEMO_MODE=true` como argumento extra. Documentar o comando `docker compose build --build-arg VITE_DEMO_MODE=true web`, que exige adicionar `ARG/ENV VITE_DEMO_MODE` ao `frontend/Dockerfile` e o `args` correspondente no compose (`VITE_DEMO_MODE: ${VITE_DEMO_MODE:-false}`). **Fazer essa pequena alteração nesta task** e testá-la com `docker compose build web`.

- [ ] **Step 4: `README.md` final**

- **Status:** "CP6 — Entrega final".
- **Links:** CP5 (`<URL do CP5>`), CP6 (`<URL do CP6>`), vídeos.
- **Instalação rápida:** 3 comandos do Docker.
- **Stack final** e estrutura do monorepo (`shared`, `frontend`, `backend`).
- **Como rodar** (Docker, dev com API, só-mock) e **como testar**.
- **Equipe:** coluna "Papel no CP6".
- **Links para todos os docs:** 01–11.

- [ ] **Step 5: Verificar e commitar**

Run: `npm run lint && npm test && docker compose build web` → PASS.

```bash
git add docs README.md frontend/Dockerfile docker-compose.yml
git commit --author="Lucas Rodrigues Grecco <79089727+lucvs07@users.noreply.github.com>" \
  -m "docs: adicionar manual, roteiro do teste de instalação e README final" \
  -m "Co-Authored-By: Monique Ferreira dos Anjos <anjos.moniqueferreira@gmail.com>"
```

---

### Task 17: Entrega do CP6 (com confirmação do usuário)

**Autor:** Lucas (sem novos commits de código)

- [ ] **Step 1: Verificação final local**

- `npm ci && npx -w backend prisma generate`
- `npm run db:test:up -w backend`
- `npm run lint && npm run typecheck && npm test && npm run build`
- `docker compose up -d --build`
- Percorrer no navegador, em `http://127.0.0.1:8080`: cadastro → desafio → publicar áudio → feed → ranking → loja → ajustes → sair → login demo.
- `docker compose restart` e confirmar que os dados continuam.
- `docker compose down`.

- [ ] **Step 2: Conferir autoria**

- `git log feat/cp5..feat/cp6 --format='%an' | sort | uniq -c`
- Os trailers `Co-Authored-By`.
- `git log feat/cp5..feat/cp6 | grep -ic claude` deve dar `0`.

- [ ] **Step 3: Pedir confirmação e publicar**

Perguntar ao usuário antes de:
- `git push -u origin feat/cp6`
- `gh pr create`: base `feat/cp5` enquanto o PR #1 não estiver mergeado, ou `main` depois do merge. Título "CP6 — Entrega final com API, banco e Docker", sem linha do Claude Code.

- [ ] **Step 4: Tarefas do grupo** (listar para o usuário, não executar)

1. Criar Neon, Render (via `render.yaml`), Cloudinary e o projeto principal da Vercel; configurar as variáveis.
2. Preencher `<URL do CP6>`.
3. Pedir a alguém de fora do grupo para seguir `docs/09-manual.md` e preencher `docs/10-teste-instalacao.md`.
4. Gravar o vídeo de 3 min.
5. Depois do merge: `git tag cp6`.
