# dot.study

> Plataforma gamificada de estudos que recompensa quem transforma sessões de estudo solo em conhecimento compartilhado.

## Sobre o projeto

Quem estuda sozinho tem dificuldade em manter consistência e motivação. O dot.study transforma cada sessão de estudo (assunto → tema → pomodoro → anotações → post) em um ciclo com foco, registro, compartilhamento com a comunidade e recompensa (moedas + ranking + customização do personagem "dot").

## Stack final

- **Frontend:** Vite + React 18 + TypeScript + Tailwind CSS, com TanStack Query para estado de servidor.
- **Backend:** Express 5 + TypeScript + Prisma 6 + PostgreSQL — autenticação JWT, regras de negócio (pontuação, anti-trapaça, compra) e upload de mídia validado no servidor.
- **Pacote compartilhado (`@dot-study/shared`):** contrato de dados, códigos de erro e regras de pontuação usados por frontend e backend, para os dois nunca divergirem.
- **Fonte de dados do frontend:** mock no navegador (`localStorage`/IndexedDB, modo usado no CP5) ou API real, trocável por `VITE_DATA_SOURCE` sem reescrever telas (`services/contracts.ts`).
- **Mídia:** gravação de áudio/vídeo no navegador (MediaRecorder), upload validado por MIME e assinatura do arquivo, armazenado em volume local (Docker) ou Cloudinary (deploy).
- **Spotify:** embed (iFrame API) com playlists de foco curadas para todos, mais conexão opcional (OAuth PKCE) com a conta do usuário.
- **Instalação:** `docker-compose.yml` com banco, API e web, para rodar com um único comando.

## Estrutura do repositório

```
dot-study/
├── README.md
├── docker-compose.yml           # banco, API e web (instalação via Docker)
├── render.yaml                  # deploy da API no Render
├── brainstorming-dot-study.txt  # anotações iniciais da ideia
├── docs/                        # documentação do projeto (ver seção abaixo)
├── shared/                      # @dot-study/shared — contrato, regras e dados de demo
│   └── src/
│       ├── contracts.ts         # tipos, ServiceError/ServiceErrorCode, MEDIA_LIMITS
│       ├── rules.ts             # COINS, canCompleteCycle
│       ├── catalog.ts           # assuntos, temas e acessórios do seed
│       └── demo.ts              # dataset de demonstração (igual ao mock do CP5)
├── frontend/                    # Vite + React + TS
│   ├── src/
│   │   ├── app/                 # rotas, providers, layout
│   │   ├── pages/                # telas
│   │   ├── components/           # componentes reutilizáveis
│   │   ├── services/              # contracts.ts + implementação mock / api (@dot-study/shared)
│   │   ├── spotify/               # PKCE, API e controlador do embed do Spotify
│   │   ├── hooks/                  # useAuth, useCountdown, useMediaRecorder, ...
│   │   └── domain/                  # formatação e apresentação (regras vêm do shared)
│   ├── Dockerfile / nginx.conf
│   ├── vercel.json
│   └── .env.example
├── backend/                      # Express + Prisma
│   ├── src/
│   │   ├── modules/              # auth, sessions, posts, rankings, shop, subjects, uploads, users
│   │   ├── storage/               # driver local / Cloudinary + validação de assinatura do arquivo
│   │   ├── middleware/, config/, seed/
│   │   └── app.ts, server.ts
│   ├── prisma/schema.prisma
│   ├── Dockerfile
│   └── .env.example
└── .gitignore
```

## Como acessar

- **URL do CP5 (protótipo, dados mockados):** `<URL do CP5>`
- **URL do CP6 (entrega final, API real):** `<URL do CP6>`
- **Conta de demonstração (válida nos dois):** `demo@dotstudy.app` / `dotstudy123`
- Ou crie uma conta nova pelo cadastro (ganha 250 moedas de boas-vindas).

> **Tempo de um desafio completo:** no modo normal, a menor dificuldade é de 15 minutos de foco. Para avaliar mais rápido, ligue `VITE_DEMO_MODE=true` (variável de ambiente na Vercel, ou `docker compose build --build-arg VITE_DEMO_MODE=true web && docker compose up -d` no Docker — sem o `--build` no `up`, senão a imagem volta a ser reconstruída sem o modo demo): libera a dificuldade "Demo" (1 minuto). A conta de demonstração já vem com loja, feed e ranking populados (840 moedas, posts e comentários de exemplo).

## Instalação rápida (Docker Compose)

```bash
git clone https://github.com/lucvs07/dot-study.git
cd dot-study
docker compose up --build
```

Abra `http://127.0.0.1:8080`. Veja o manual completo (requisitos, problemas comuns, deploy e como rodar sem Docker) em [`docs/09-manual.md`](docs/09-manual.md).

## Como rodar

| Modo | Comando | URL |
|---|---|---|
| Docker (banco + API + web) | `docker compose up --build` | `http://127.0.0.1:8080` |
| Dev com API real | `npm install`, banco e seed (ver seção 7 do manual), depois `npm run dev:backend` (outro terminal) `npm run dev:api` | `http://127.0.0.1:5173` |
| Só-mock (sem backend) | `npm install && npm run dev` (ou `npm run dev:demo` para a dificuldade "Demo") | `http://127.0.0.1:5173` |

O servidor de desenvolvimento fica em `127.0.0.1` (não `localhost`) porque o Spotify não aceita `localhost` como redirect URI do OAuth, e o microfone/câmera só liberam em contexto seguro.

## Como testar

```bash
npm run db:test:up -w backend   # Postgres de teste (porta 5433), uma vez
npm test                        # shared + backend + frontend (Vitest)
npm run lint                    # ESLint + Prettier
npm run typecheck
npm run build
```

### Testar "Conectar Spotify" localmente

Sem configuração, o player mostra só as playlists curadas do dot.study (não precisa de conta). Para testar a conexão com a conta do usuário:

1. Crie um app no [Spotify Developer Dashboard](https://developer.spotify.com/dashboard). Em modo desenvolvedor, o dono do app precisa ter Spotify Premium e só até 5 usuários cadastrados na allowlist do app conseguem conectar.
2. Cadastre a redirect URI `http://127.0.0.1:5173/spotify/callback` (dev) e/ou `http://127.0.0.1:8080/spotify/callback` (Docker).
3. Crie `frontend/.env.local` com o Client ID (público, sem segredo — o fluxo é PKCE):

   ```bash
   VITE_SPOTIFY_CLIENT_ID=<seu client id>
   ```

4. Reinicie o `npm run dev` (ou rebuilde o Docker passando `VITE_SPOTIFY_CLIENT_ID`) e abra o app. O botão "Conectar Spotify" aparece no menu de playlists do player.

## Equipe

Papéis definidos de forma ágil pelo próprio grupo, com base no que cada pessoa executou em cada checkpoint.

| Nome | RM | Papel no CP4 | Papel no CP5 | Papel no CP6 |
|---|---|---|---|---|
| Lucas Rodrigues Grecco | 558261 | Scrum Master / Organização do projeto — repositório GitHub, quadro Trello e documentação inicial | Infra, CI, integração Spotify e documentação | Infra e empacotamento (Dockerfiles, nginx, `docker compose up`), CI com Postgres e build das imagens, documentação final (manual, teste de instalação, README) |
| Monique Ferreira dos Anjos | 558262 | UI/UX Designer — identidade visual, marca e prototipação | Telas e componentes do frontend | Aviso de "servidor acordando" e polimento do modo API; coautoria da seleção `VITE_DATA_SOURCE=api` e da documentação final |
| Tiago Brito Nário | 558248 | UI/UX — apoio à Monique no design e na prototipação | Telas e componentes do frontend | Cliente HTTP e serviços de autenticação/usuário/assuntos da API; documentação final (requisitos, escopo, UML e jornada) |
| Rafael Augusto Oliveira Silva | 555154 | UI/UX — apoio à Monique no design e na prototipação | Telas e componentes do frontend | Demais serviços do frontend ligados à API (sessões, posts, ranking, loja) e seleção `VITE_DATA_SOURCE=api` |
| Felipe Wapf Fettback | 557217 | Apresentação — criação e apresentação do pitch do projeto | Camada de serviços mock e regras de negócio | Pacote shared, seed do banco, perfil/estatísticas, posts/comentários/ranking e upload de mídia (Cloudinary) |
| Leonardo Tanaka Cortez | 556781 | Apresentação — criação e apresentação do pitch do projeto | Camada de serviços mock e regras de negócio | Esqueleto do backend (Express/Prisma), autenticação JWT, sessões de estudo com anti-trapaça e loja |

## Documentação

- [Problema e Persona](docs/01-problema-e-persona.md)
- [Requisitos Funcionais e Não Funcionais](docs/02-requisitos.md)
- [Escopo do Projeto](docs/03-escopo.md)
- [Modelagem UML](docs/04-modelagem-uml.md)
- [Identidade Visual](docs/05-marca.md)
- [Pitch e Vídeo de Apresentação](docs/06-pitch.md)
- [Estrutura do Trello](docs/07-trello.md)
- [Jornada do Projeto](docs/08-jornada.md)
- [Manual de Instalação e Uso](docs/09-manual.md)
- [Teste de Instalação](docs/10-teste-instalacao.md)
- [Roteiros de Vídeo](docs/11-roteiros-video.md)
- [Spec completa do CP4](docs/superpowers/specs/2026-08-11-dot-study-cp4-design.md)
- [Spec completa do CP5/CP6](docs/superpowers/specs/2026-09-29-dot-study-cp5-cp6-design.md)

## Links do projeto

- [Board do Trello](https://trello.com/invite/b/6a7cc49e2126473ad79f3ce2/ATTIcebbd851ce4d5e438e96a0797cc88bff46BC491A/dotstudy)
- [Identidade Visual no Figma](https://www.figma.com/design/dghZwyB9XNVTtDeIl3oFIo/Espa%C3%A7o-.Study?node-id=66-2&t=u720N9stHCUWybdX-1)
- [Protótipo de Alta Fidelidade no Figma Make](https://www.figma.com/make/yYRigvDsBLT0La7L5dXqwb/Interface-prototipa%C3%A7%C3%A3o-.study?t=i7rLvIxYVgJh6atv-1)
- [Vídeo — Apresentação do Projeto e Protótipo](https://youtu.be/0dKmLjSZ75s)
- [Vídeo — Pitch de Apresentação](https://youtu.be/lNhCYMHLotU)
- [Vídeo — CP5 (protótipo)](<URL do vídeo CP5>)
- [Vídeo — CP6 (entrega final)](<URL do vídeo CP6>)

## Status do projeto

**CP6 — Entrega final.** API real, banco Postgres, upload de mídia real (local em Docker, Cloudinary em produção) e instalação via Docker Compose. Limitações conhecidas: o plano gratuito do Render hiberna a API após inatividade (primeira requisição pode demorar, com aviso na tela); o modo desenvolvedor do Spotify limita a 5 contas conectadas e exige que o dono do app tenha Premium; a duração de áudio/vídeo é a declarada pelo navegador do cliente (o tamanho do arquivo é o limite validado com certeza no servidor).
