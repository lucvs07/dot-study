# dot.study — Design CP5 (Protótipo Funcional) e CP6 (Entrega Final)

**Data:** 2026-09-29
**Fases:** Checkpoint 5 — Protótipo funcional com dados mockados · Checkpoint 6 — Entrega final com persistência real
**Base:** protótipo de alta fidelidade do Figma Make ("Interface prototipação .study") + spec do CP4 (`2026-08-11-dot-study-cp4-design.md`)

## 1. Objetivo e critérios de sucesso

| Checkpoint | Resultado esperado | Sucesso significa |
|---|---|---|
| CP5 | App navegável com dados mockados, publicado em URL pública, README com instruções, requisitos e UML (sequência/atividade) atualizados, roteiro do vídeo de demo (2 min) | O professor abre a URL, cria conta, faz login, completa uma sessão de estudo, publica um post, vê moedas/ranking mudarem, compra um acessório — tudo sem backend |
| CP6 | Mesmo app com API real, banco Postgres, upload de mídia real, instalável via Docker Compose e link público, documentação final, manual, jornada, teste de instalação externo, roteiro do vídeo (3 min) | Alguém de fora do grupo segue o manual, sobe o app com `docker compose up` e executa os fluxos principais; o link público funciona com dados persistidos |

A evolução CP4 → CP5 → CP6 deve ser visível: CP4 definiu o contrato de dados (RNF04), CP5 o implementa em mock, CP6 troca o mock pela API sem reescrever telas.

## 2. Decisões tomadas no brainstorming

| Decisão | Escolha | Motivo |
|---|---|---|
| Estratégia | Uma spec, dois planos (CP5 depois CP6); CP5 congelado em tag + URL própria | Mantém o CP5 acessível após o CP6 e evidencia a evolução |
| Troca mock → real | Camada de serviços com interface; `VITE_DATA_SOURCE=mock\|api` | Cumpre RNF04; telas não mudam entre checkpoints |
| Stack CP6 | Express + TypeScript + Prisma + PostgreSQL | Mantém o stack declarado no CP4 (Node/Express) |
| Hospedagem | Web na Vercel, API no Render (free), Postgres no Neon (free), mídia no Cloudinary (free) | Todos gratuitos; Render apaga disco, então mídia vai para storage externo |
| Instalável | `docker-compose.yml` (db + api + web) + link público | Roda offline, fora da máquina do grupo |
| Autenticação | Email + senha, bcrypt + JWT | Login real sem depender de provedor externo |
| Login com Google | **Removido** (inclusive da tela de Ajustes) | Fora do escopo; evita configurar OAuth por ambiente |
| Mídia (áudio/vídeo) | **Real** — gravação no navegador + upload | Escolha do grupo; maior risco de prazo, mitigado com limites |
| Spotify | **Híbrido**: iFrame API com playlists curadas para todos + "Conectar Spotify" (OAuth PKCE) opcional | Desde 09/03/2026 o modo desenvolvedor do Spotify exige dono Premium e limita a 5 usuários em allowlist |
| Gerenciador de pacotes | npm workspaces (sai o pnpm do Figma Make) | Um único padrão no monorepo |
| UI kit | Componentes próprios do protótipo + lucide-react; saem MUI e shadcn/ui | O protótipo não importa nenhum deles |

## 3. Estrutura do repositório

```
dot-study/
├── package.json            # npm workspaces: frontend, backend
├── frontend/               # Vite + React 18 + TS + Tailwind 4
├── backend/                # Express + TS + Prisma (CP6)
├── docker-compose.yml      # CP6: db + api + web
├── .github/workflows/ci.yml
├── docs/
└── README.md
```

**Do zip do Figma Make entram:** `src/` (App, componentes próprios, estilos, `imports/` com SVGs e imagens usados), `index.html`, `vite.config.ts`, `postcss.config.mjs`, `ATTRIBUTIONS.md`.
**Não entram:** todos os scripts `fix_*.cjs`, `*.sh`, `test_*`, `new_*.tsx`, `replacement.jsx`, `plan.txt`, `default_shadcn_theme.css`, `pnpm-workspace.yaml`, `src/app/components/ui/*` (shadcn não usado) e dependências não importadas (MUI, emotion, radix, etc.). Os arquivos de `src/imports/` que não forem referenciados também saem.

### Fluxo de branches e tags

1. CP5: branch `feat/cp5` → PR para `main` → tag `cp5` → branch `release/cp5` (nunca mais alterada). Vercel publica `release/cp5` em um projeto próprio (URL do CP5).
2. CP6: branch `feat/cp6` → PR para `main` → tag `cp6`. Vercel (projeto principal) publica `main`.

## 4. Modelo de dados

Evolui o diagrama de classes do CP4. Mudanças em relação ao CP4 ficam registradas em `docs/08-jornada.md`.

| Entidade | Campos principais | Observações |
|---|---|---|
| `Usuario` | id, nome, email (único), senhaHash, moedas, corDot, acessorioAtivoId?, criadoEm | `PerfilDot` do CP4 é incorporado ao usuário (cor + acessório ativo) |
| `Assunto` | id, nome, cor | Seed com os assuntos do protótipo (`SUBJECTS`) |
| `Tema` | id, titulo, assuntoId | Seed com `THEMES_BY_SUBJECT` |
| `SessaoEstudo` | id, usuarioId, modo (`desafio`\|`livre`), assuntoId?, temaId?, rotulo?, minutosFoco, minutosPausa, ciclosPlanejados, ciclosConcluidos, anotacoes, status (`em_andamento`\|`concluida`\|`abandonada`), iniciadaEm, ultimoCicloEm?, finalizadaEm? | Assunto/tema só no modo desafio |
| `Post` | id, usuarioId, sessaoId?, assuntoId?, tipo (`texto`\|`audio`\|`video`), titulo, conteudo, midiaUrl?, midiaDuracaoSeg?, criadoEm | Substitui `Artigo` do CP4 (artigo passa a ter tipos) |
| `Comentario` | id, postId, usuarioId, parentId?, conteudo, criadoEm | `parentId` permite resposta |
| `Curtida` | usuarioId, postId | Chave composta |
| `Salvo` | usuarioId, postId | Chave composta |
| `Acessorio` | id, chave, nome, tipo, custoMoedas | Seed com `ACCESSORIES_LIST` |
| `UsuarioAcessorio` | usuarioId, acessorioId, desbloqueadoEm | |
| `TransacaoMoeda` | id, usuarioId, valor (±), motivo (`boas_vindas`\|`ciclo`\|`post`\|`compra`), referenciaId, criadoEm | Registro auditável; `Usuario.moedas` atualizado na mesma transação |

**`RankingEntry` deixa de ser tabela**: o ranking é calculado por consulta (agregação sobre ciclos concluídos e posts por assunto). Evita dados duplicados e inconsistentes.

### Fórmulas de pontuação (definidas neste checkpoint, conforme nota do CP4)

| Ação | Moedas | Pontos no ranking do assunto |
|---|---|---|
| Ciclo de pomodoro concluído | +10 | +10 (somente modo desafio, que tem assunto) |
| Post publicado (qualquer tipo) | +30 | +30 (se o post tiver assunto) |
| Compra de acessório | −custo | — |
| Cadastro (bônus de boas-vindas) | +250 | — |

O bônus de boas-vindas permite que uma conta nova complete o fluxo de ponta a ponta (estudar → publicar → comprar o acessório mais barato, 250 moedas).

Pontuação do usuário no assunto = `10 × ciclos concluídos no assunto + 30 × posts no assunto`, período total.

### Regras anti-trapaça (aplicadas no servidor no CP6; replicadas no mock do CP5)

- Um ciclo só é aceito se `agora − (ultimoCicloEm ?? iniciadaEm) ≥ 0,9 × minutosFoco × 60 s`.
- `ciclosConcluidos` nunca passa de `ciclosPlanejados`.
- Cada sessão gera recompensa por no máximo 1 post.
- Compra falha se saldo < custo ou acessório já desbloqueado.

### Modo demo

Com `VITE_DEMO_MODE=true`, o modo desafio ganha a dificuldade "Demo" (1 minuto), usada para gravar os vídeos. A regra anti-trapaça continua valendo sobre os minutos da sessão (54 s). Desligado por padrão nos deploys.

## 5. Frontend

### Estrutura

```
frontend/src/
├── main.tsx
├── app/          # router (react-router), providers (QueryClient, Auth, Tema), AppLayout (BottomNav + player)
├── pages/        # LoginPage, CadastroPage, DashboardPage, EstudarPage, FeedPage, PostPage,
│                 # RankingPage, HistoricoPage, LojaPage, AjustesPage, LeituraPage
├── components/   # DotAvatar, StudyLogo, CircularTimer, DurationPicker, AudioWave, PostPublisher,
│                 # FloatingTimer, FreeSessionSummary, BottomNav, ... (extraídos do App.tsx)
├── services/
│   ├── contracts.ts   # tipos de domínio + interfaces de serviço
│   ├── mock/          # CP5: implementação em localStorage
│   ├── api/           # CP6: implementação HTTP
│   └── index.ts       # seleciona a implementação por VITE_DATA_SOURCE
├── spotify/      # pkce.ts, spotifyApi.ts, embedController.ts
├── hooks/        # useAuth, useTimer, useMediaRecorder, ...
├── content/      # articleData.ts (conteúdo editorial da tela de Leitura)
└── styles/
```

O `App.tsx` de ~2.500 linhas é quebrado nessas unidades. O visual do protótipo deve ser preservado; mudanças visuais só onde o fluxo exigir (login/cadastro novos, remoção do Google, estados de carregamento/erro).

### Rotas

| Rota | Página | Protegida |
|---|---|---|
| `/login`, `/cadastro` | Login, Cadastro | Não |
| `/` | Dashboard | Sim |
| `/estudar` | Timer (desafio/livre, anotações, publicação) | Sim |
| `/feed`, `/feed/:postId` | Feed, detalhe do post | Sim |
| `/ranking` | Ranking por assunto | Sim |
| `/historico` | Histórico + gráfico | Sim |
| `/loja` | Loja do dot | Sim |
| `/ajustes` | Nome, email, senha, tema claro/escuro | Sim |
| `/leitura/:id` | Leitor de artigo de referência | Sim |
| `/spotify/callback` | Retorno do OAuth do Spotify | Sim |

### Contrato de serviços (`services/contracts.ts`)

Interfaces assíncronas (retornam `Promise`) mesmo no mock, para que a troca seja transparente:

- `AuthService`: `register`, `login`, `logout`, `me`
- `UserService`: `updateProfile`, `updateDot`, `getStats`
- `SubjectService`: `list`, `randomTheme`
- `SessionService`: `start`, `completeCycle`, `update`, `finish`, `list`
- `PostService`: `list(filtro, cursor)`, `get`, `create`, `like/unlike`, `save/unsave`, `listComments`, `addComment`
- `RankingService`: `bySubject`
- `ShopService`: `listAccessories`, `purchase`
- `MediaService`: `upload(blob, tipo)` → `{ url, duracaoSeg }`

Erros de domínio usam uma classe `ServiceError` com `code` (`INVALID_CREDENTIALS`, `EMAIL_TAKEN`, `INSUFFICIENT_COINS`, `CYCLE_TOO_SOON`, `MEDIA_TOO_LARGE`, `UNAUTHORIZED`, `NETWORK`), iguais nas duas implementações. As telas tratam por `code`.

Estado de servidor via **TanStack Query**; estado de UI (timer, formulário) local.

### Mock do CP5

- Persistência em `localStorage` sob a chave `dotstudy:v1`, com seed a partir das constantes do protótipo (artigos, rankings, sessões, acessórios) e usuários de demo.
- Cadastro/login reais no navegador (senha guardada como hash SHA-256 via Web Crypto — é mock, mas não em texto puro).
- Pequena latência artificial (100–300 ms) para exibir estados de carregamento.
- Mesmas regras de pontuação e anti-trapaça da seção 4.
- Upload de mídia no mock: `URL.createObjectURL` + armazenamento em IndexedDB para sobreviver ao reload.
- Botão "Resetar dados de demo" em Ajustes.

## 6. Backend (CP6)

### Stack e organização

Express + TypeScript + Prisma + PostgreSQL. Validação com **zod**, segurança com **helmet**, **CORS** restrito a `WEB_ORIGIN`, **rate limit** em `/auth/*`, logs com **pino**.

```
backend/src/
├── app.ts / server.ts
├── config/env.ts          # leitura e validação das variáveis de ambiente
├── modules/<modulo>/      # auth, users, subjects, sessions, posts, rankings, shop, uploads
│   ├── routes.ts          # rotas + schemas zod
│   └── service.ts         # regras de negócio (testáveis sem HTTP)
├── storage/               # StorageDriver: local.ts, cloudinary.ts
├── middleware/            # auth (JWT), erro, validação
└── prisma/                # schema.prisma, migrations, seed.ts
```

### API REST (`/api/v1`)

| Método e rota | Descrição |
|---|---|
| `POST /auth/register`, `POST /auth/login`, `GET /auth/me` | Cadastro, login (retorna JWT), usuário atual |
| `PATCH /users/me` | Nome, email, senha (senha atual obrigatória para trocar senha/email) |
| `PATCH /users/me/dot` | Cor e acessório ativo (acessório precisa estar desbloqueado) |
| `GET /users/me/stats` | Sequência de dias, tempo total, dados do gráfico do histórico |
| `GET /subjects`, `GET /subjects/:id/random-theme` | Assuntos com temas; tema aleatório |
| `POST /sessions`, `POST /sessions/:id/cycles`, `PATCH /sessions/:id`, `GET /sessions` | Sessões e ciclos |
| `GET /posts?subjectId&type&cursor`, `POST /posts`, `GET /posts/:id` | Feed paginado por cursor, publicação, detalhe |
| `POST\|DELETE /posts/:id/like`, `POST\|DELETE /posts/:id/save` | Curtir e salvar |
| `GET\|POST /posts/:id/comments` | Comentários e respostas |
| `GET /rankings/:subjectId` | Ranking calculado |
| `GET /shop/accessories`, `POST /shop/purchase` | Loja |
| `POST /uploads` | Upload multipart de áudio/vídeo |
| `GET /health` | Saúde (usado para "acordar" o Render) |

Respostas de erro no formato `{ error: { code, message } }`, com os mesmos `code` do `ServiceError` do frontend. Operações que mexem em moedas rodam em transação Prisma.

JWT com validade de 7 dias, enviado no header `Authorization: Bearer`, guardado no `localStorage` do frontend (trade-off aceito para um projeto acadêmico e documentado na jornada).

## 7. Mídia

- **Gravação:** áudio pelo `MediaRecorder` (webm/opus); vídeo pela câmera (`MediaRecorder`) ou envio de arquivo (mp4/webm).
- **Limites:** áudio ≤ 5 min e ≤ 10 MB; vídeo ≤ 2 min e ≤ 50 MB. Duração validada no navegador; tamanho e MIME validados no servidor (multer com `limits`).
- **Fluxo:** frontend → `POST /uploads` → multer grava em disco temporário → `StorageDriver.save()` → retorna `{ url, duracaoSeg }` → frontend cria o post com `midiaUrl`.
- **Drivers** (`STORAGE_DRIVER=local|cloudinary`):
  - `local`: grava em volume Docker, servido em `/media` pela API. Usado no Docker Compose.
  - `cloudinary`: envia pelo SDK e apaga o temporário. Usado no deploy público.
- **Erros:** arquivo grande, formato inválido, permissão de microfone/câmera negada e falha de rede exibem mensagem clara e mantêm o rascunho do post.

## 8. Spotify (abordagem híbrida)

- **Sem login (todos os usuários):** player na BottomNav usa o **Spotify iFrame API** com 3 playlists de foco curadas (substituem `SPOTIFY_PLAYLISTS` do protótipo). Controles de play/pause e troca de playlist pela nossa UI.
- **"Conectar Spotify" (opcional):** OAuth Authorization Code com **PKCE**, feito inteiramente no frontend (sem client secret, sem backend). Token no `sessionStorage`. Com a conta conectada, lista `GET /me/playlists` e toca a escolhida pelo embed.
- **Restrições documentadas:** o app do Spotify fica em modo desenvolvedor — dono com Premium, no máximo 5 usuários em allowlist (os integrantes do grupo para a demo).
- **Fallback:** usuário fora da allowlist (403), token expirado ou erro de rede → aviso "Não foi possível conectar ao Spotify" e volta para as playlists curadas.
- **Redirect URIs cadastradas:** URL de produção da Vercel, URL do CP5 e `http://127.0.0.1:8080/spotify/callback` (o Spotify não aceita `localhost`).
- `VITE_SPOTIFY_CLIENT_ID` é público (PKCE); sem ele, o botão "Conectar Spotify" some e só o player curado aparece.

## 9. Deploy e instalável

| Ambiente | Onde | Configuração |
|---|---|---|
| CP5 | Vercel, projeto `dot-study-cp5`, branch `release/cp5` | `VITE_DATA_SOURCE=mock` |
| CP6 web | Vercel, projeto principal, branch `main` | `VITE_DATA_SOURCE=api`, `VITE_API_URL`, `VITE_SPOTIFY_CLIENT_ID` |
| CP6 API | Render (free web service) | `DATABASE_URL` (Neon), `JWT_SECRET`, `WEB_ORIGIN`, `STORAGE_DRIVER=cloudinary`, `CLOUDINARY_URL` |
| Instalável | `docker compose up` | Postgres + API (roda `prisma migrate deploy` + seed) + web (build servido por nginx) em `http://127.0.0.1:8080`; `STORAGE_DRIVER=local` |

- **Hibernação do Render:** ao abrir, o frontend chama `/health`; se passar de 2 s, mostra "Acordando o servidor… (até ~1 min no plano gratuito)".
- **SPA na Vercel:** `vercel.json` com rewrite para `index.html`.
- Todo segredo fica fora do git; cada pacote tem `.env.example`.
- Seed cria usuários de demo com credenciais documentadas no manual (são dados de teste).

## 10. Qualidade e testes

- TypeScript `strict` no front e no back; ESLint + Prettier.
- **Backend:** Vitest para os `service.ts` (pontuação, anti-trapaça, compra) + supertest para as rotas, contra um Postgres de teste.
- **Frontend:** Vitest para o mock dos serviços (mesmas regras de negócio) e para hooks de timer.
- **CI (GitHub Actions)** em todo PR: lint, testes (com container Postgres) e build de front e back.
- Nada de erro no console nos fluxos principais; estados de carregamento, vazio e erro em todas as telas com dados.

## 11. Documentação

| Arquivo | CP5 | CP6 |
|---|---|---|
| `README.md` | Como acessar (URL CP5) e rodar local; status CP5 | Links CP5 e CP6, instalação via Docker, status final |
| `docs/02-requisitos.md` | Revisado: RF11 cadastro/login, RF12 comentários/curtidas/salvos, RF13 posts em áudio/vídeo, RF14 Spotify, RF15 histórico/estatísticas; RNFs revisados | Marca o que foi implementado de forma real |
| `docs/03-escopo.md` | Atualizado (Google fora, mídia e Spotify dentro) | Versão final |
| `docs/04-modelagem-uml.md` | Classes e casos de uso atualizados; **sequência**: login, sessão de estudo → publicação, compra na loja; **atividade**: fluxo de estudo, publicação | Revisado para a versão final; sequência de upload de mídia e de conexão Spotify |
| `docs/08-jornada.md` | Decisões CP4 → CP5 | Decisões CP5 → CP6 (Google removido, limites Spotify, ranking calculado, PerfilDot incorporado, JWT em localStorage) |
| `docs/09-manual.md` | — | Instalar, rodar e usar (com usuários de demo) |
| `docs/10-teste-instalacao.md` | — | Registro do teste feito por alguém de fora do grupo (quem, quando, SO, passos, problemas, resultado) |
| `docs/11-roteiros-video.md` | Roteiro do vídeo de 2 min (CP5) | Roteiro do vídeo de 3 min (CP6) |

Diagramas em Mermaid, como no CP4.

## 12. Distribuição de commits

Cada commit tem autor (`git commit --author`) e coautores (`Co-Authored-By:`) conforme a frente de trabalho, seguindo os papéis do README. Horários reais, sem backdating. Os commits não levam coautoria do Claude — somente integrantes da equipe.

| Integrante | Identidade git |
|---|---|
| Lucas Rodrigues Grecco | `Lucas Rodrigues Grecco <79089727+lucvs07@users.noreply.github.com>` |
| Monique Ferreira dos Anjos | `Monique Ferreira dos Anjos <anjos.moniqueferreira@gmail.com>` |
| Tiago Brito Nário | `Tiago Brito Nário <tiago.tibi.nario@gmail.com>` |
| Rafael Augusto Oliveira Silva | `Rafael Augusto Oliveira Silva <rafael.a.os@hotmail.com>` |
| Felipe Wapf Fettback | `Felipe Wapf Fettback <wapffelipe@gmail.com>` |
| Leonardo Tanaka Cortez | `Leonardo Tanaka Cortez <leonardotanaka0513@gmail.com>` |

| Frente | Autor | Coautor |
|---|---|---|
| Frontend (telas, componentes, UI, mock) | Monique, Tiago, Rafael em rodízio | Um dos outros dois de UI |
| Backend (API, Prisma, auth, upload) | Felipe, Leonardo em rodízio | Lucas |
| Integração, infra, CI, Spotify | Lucas | Felipe ou Leonardo |
| Documentação e UML | Lucas | Quem implementou o fluxo documentado |

Meta: número de commits parecido por pessoa ao fim do CP6. O plano atribui autor e coautor a cada tarefa.

## 13. Tarefas exclusivas do grupo (fora do alcance do Claude)

1. Criar contas e projetos: Vercel (2 projetos), Render, Neon, Cloudinary, app no Spotify Developer (dono com Premium; cadastrar até 5 usuários e as redirect URIs).
2. Configurar variáveis de ambiente em cada serviço (o repositório só tem `.env.example`).
3. Gravar os vídeos (CP5: 2 min; CP6: 3 min) a partir dos roteiros.
4. Conseguir alguém de fora do grupo para testar a instalação e preencher `docs/10-teste-instalacao.md` com o resultado.
5. Revisar e aprovar os PRs.

## 14. Fora do escopo

- Login com Google ou qualquer outro provedor social.
- Sistema de eventos (desafios temáticos, maratonas) — segue como versão futura, conforme CP4.
- Apps nativos mobile (continua web responsivo).
- Reprodução de faixas completas do Spotify dentro do app via Web Playback SDK.
- Moderação de conteúdo, notificações, recuperação de senha por email (o botão de "esqueci minha senha" do protótipo sai).

## 15. Riscos

| Risco | Mitigação |
|---|---|
| Upload de mídia é o item mais trabalhoso e com mais pontos de falha | Limites rígidos, driver local para desenvolvimento, implementar por último no CP6, com texto funcionando antes |
| Render hiberna e o avaliador acha que o app caiu | Tela "acordando o servidor" + aviso no README; Docker Compose como alternativa |
| Spotify bloqueia usuário fora da allowlist | Fallback automático para playlists curadas; limitação documentada |
| Cotas gratuitas (Neon, Cloudinary) | Limites de mídia baixos; seed pequeno |
| Divergência entre mock e API | Contrato único em `contracts.ts`; mesmas regras testadas nas duas implementações |
