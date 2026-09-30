# dot.study

> Plataforma gamificada de estudos que recompensa quem transforma sessões de estudo solo em conhecimento compartilhado.

## Sobre o projeto

Quem estuda sozinho tem dificuldade em manter consistência e motivação. O dot.study transforma cada sessão de estudo (assunto → tema → pomodoro → anotações → post) em um ciclo com foco, registro, compartilhamento com a comunidade e recompensa (moedas + ranking + customização do personagem "dot").

## Stack

- **Frontend:** Vite + React 18 + TypeScript + Tailwind CSS, com TanStack Query para estado de servidor.
- **Dados (CP5):** mockados no navegador — `localStorage` (usuários, sessões, posts, moedas) e IndexedDB (arquivos de áudio/vídeo gravados). Nenhum dado sai do navegador nesta fase.
- **Backend (CP6):** Express + TypeScript + Prisma + PostgreSQL — troca o mock pela API real sem reescrever telas, via `services/contracts.ts`.
- **Spotify:** embed (iFrame API) com playlists de foco curadas para todos, mais conexão opcional (OAuth PKCE) com a conta do usuário.

## Estrutura do repositório

```
dot-study/
├── README.md
├── brainstorming-dot-study.txt  # anotações iniciais da ideia
├── docs/                        # documentação do projeto (ver seção abaixo)
├── frontend/                    # Vite + React + TS — app do CP5/CP6
│   ├── src/
│   │   ├── app/                 # rotas, providers, layout
│   │   ├── pages/                # telas
│   │   ├── components/           # componentes reutilizáveis
│   │   ├── services/              # contracts.ts + implementação mock (CP5) / api (CP6)
│   │   ├── spotify/               # PKCE, API e controlador do embed do Spotify
│   │   ├── hooks/                  # useAuth, useCountdown, useMediaRecorder, ...
│   │   └── domain/                  # regras de pontuação, marca, formatação
│   ├── vercel.json
│   └── .env.example
├── backend/                      # Express + Prisma — entra no CP6
└── .gitignore
```

## Como acessar o CP5

- **URL publicada:** `<URL do CP5>`
- **Conta de demonstração:** `demo@dotstudy.app` / `dotstudy123`
- Ou crie uma conta nova pelo cadastro (ganha 250 moedas de boas-vindas).

> No CP5 os dados ficam salvos apenas no seu navegador (`localStorage`/IndexedDB), sem backend. Se quiser recomeçar do zero, use o botão **"Restaurar dados de demonstração"** em Ajustes.

## Como rodar localmente

Pré-requisito: Node.js ≥ 20.

```bash
npm install
npm run dev
```

Abra `http://localhost:5173`.

Para gravar vídeos com sessões curtas, ligue o modo demo (dificuldade "Demo" de 1 minuto):

```bash
VITE_DEMO_MODE=true npm run dev
```

Outros comandos úteis (raiz do repositório):

```bash
npm test        # testes (Vitest)
npm run lint    # ESLint + Prettier
npm run build   # build de produção
```

## Equipe

Papéis definidos de forma ágil pelo próprio grupo, com base no que cada pessoa executou em cada checkpoint.

| Nome | RM | Papel no CP4 | Papel no CP5 |
|---|---|---|---|
| Lucas Rodrigues Grecco | 558261 | Scrum Master / Organização do projeto — repositório GitHub, quadro Trello e documentação inicial | Infra, CI, integração Spotify e documentação |
| Monique Ferreira dos Anjos | 558262 | UI/UX Designer — identidade visual, marca e prototipação | Telas e componentes do frontend |
| Tiago Brito Nário | 558248 | UI/UX — apoio à Monique no design e na prototipação | Telas e componentes do frontend |
| Rafael Augusto Oliveira Silva | 555154 | UI/UX — apoio à Monique no design e na prototipação | Telas e componentes do frontend |
| Felipe Wapf Fettback | 557217 | Apresentação — criação e apresentação do pitch do projeto | Camada de serviços mock e regras de negócio |
| Leonardo Tanaka Cortez | 556781 | Apresentação — criação e apresentação do pitch do projeto | Camada de serviços mock e regras de negócio |

## Documentação

- [Problema e Persona](docs/01-problema-e-persona.md)
- [Requisitos Funcionais e Não Funcionais](docs/02-requisitos.md)
- [Escopo do Projeto](docs/03-escopo.md)
- [Modelagem UML](docs/04-modelagem-uml.md)
- [Identidade Visual](docs/05-marca.md)
- [Pitch e Vídeo de Apresentação](docs/06-pitch.md)
- [Estrutura do Trello](docs/07-trello.md)
- [Jornada do Projeto](docs/08-jornada.md)
- [Roteiros de Vídeo](docs/11-roteiros-video.md)
- [Spec completa do CP4](docs/superpowers/specs/2026-08-11-dot-study-cp4-design.md)
- [Spec completa do CP5/CP6](docs/superpowers/specs/2026-09-29-dot-study-cp5-cp6-design.md)

## Links do projeto

- [Board do Trello](https://trello.com/invite/b/6a7cc49e2126473ad79f3ce2/ATTIcebbd851ce4d5e438e96a0797cc88bff46BC491A/dotstudy)
- [Identidade Visual no Figma](https://www.figma.com/design/dghZwyB9XNVTtDeIl3oFIo/Espa%C3%A7o-.Study?node-id=66-2&t=u720N9stHCUWybdX-1)
- [Protótipo de Alta Fidelidade no Figma Make](https://www.figma.com/make/yYRigvDsBLT0La7L5dXqwb/Interface-prototipa%C3%A7%C3%A3o-.study?t=i7rLvIxYVgJh6atv-1)
- [Vídeo — Apresentação do Projeto e Protótipo](https://youtu.be/0dKmLjSZ75s)
- [Vídeo — Pitch de Apresentação](https://youtu.be/lNhCYMHLotU)

## Status do projeto

**CP5 — Protótipo funcional (dados mockados)**. Próximo passo: CP6 — API real, banco Postgres, upload de mídia real e deploy instalável via Docker Compose.
