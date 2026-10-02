# Jornada do Projeto

## CP4 → CP5

O CP4 definiu o contrato de dados (RNF04) e deixou a fórmula de pontuação como detalhe de implementação. O CP5 fecha essas decisões, implementa o protótipo com dados mockados e evolui o escopo com base no que o time considerou viável e valioso dentro do prazo.

| Decisão | Motivo | Impacto |
|---|---|---|
| Protótipo de alta fidelidade do Figma Make como base, com limpeza de dependências não usadas (shadcn/ui, MUI, scripts auxiliares) | Preservar o visual já validado no CP4 sem herdar código morto ou dependências fora do Tech Stack combinado | `frontend/` nasce a partir do zip do Figma Make; App.tsx de ~2.500 linhas é quebrado em páginas, componentes e hooks |
| Camada de serviços com contrato único (`services/contracts.ts`) e implementação mock trocável por `VITE_DATA_SOURCE` | Cumprir o RNF04 do CP4: as telas não podem mudar quando o CP6 trocar o mock pela API real | Todo acesso a dado passa por uma interface (`AuthService`, `SessionService`, `PostService` etc.); o mock vive em `services/mock/` |
| Cadastro e login com email e senha adicionados (RF11) | O CP4 não previa autenticação; sem ela não há como isolar dados por usuário nem simular o fluxo real do CP6 | Novas telas `LoginPage`/`CadastroPage`; sessão mantida via `currentUserId` no `MockDb` |
| Login com Google removido (inclusive de Ajustes) | Fora do escopo combinado para o CP5/CP6; evitaria configurar OAuth por ambiente sem necessidade | Nenhuma opção de login social nas telas de autenticação |
| Fórmulas de pontuação definidas (+10 ciclo, +30 post, +250 cadastro) | O CP4 deixou a fórmula em aberto; o CP5 precisa de números concretos para o mock e para o vídeo de demonstração | `domain/rules.ts` centraliza `COINS`/`POINTS`; bônus de boas-vindas permite que uma conta nova complete o fluxo ponta a ponta (estudar → publicar → comprar o acessório mais barato) |
| Regras anti-trapaça aplicadas no mock | Sem elas, o cronômetro poderia ser manipulado para completar ciclos instantaneamente | Ciclo só é aceito se decorreu ao menos 90% do tempo de foco (`canCompleteCycle` em `domain/rules.ts`); `ciclosConcluidos` nunca ultrapassa `ciclosPlanejados` |
| `RankingEntry` deixa de ser uma tabela e passa a ser calculado por consulta | Evita dado duplicado e desatualizado entre sessões e posts | `computeSubjectScores`/`rankEntries` em `domain/rules.ts` agregam `SessaoEstudo` e `Post` sob demanda |
| `PerfilDot` incorporado ao próprio `Usuario` (cor + acessório ativo) | O CP4 modelava perfil e usuário como entidades separadas sem necessidade prática no mock | Campos `dotColor`/`activeAccessoryId` diretamente em `User` (`services/contracts.ts`) |
| `Artigo` renomeado para `Post`, com campo `tipo` (`texto`\|`audio`\|`video`) | O escopo cresceu para incluir publicação em áudio e vídeo (RF13), não só texto | `PostRecord`/`Post` carregam `midiaUrl`/`midiaDuracaoSeg`; feed e detalhe do post tratam os três tipos |
| Mídia real gravada no navegador (MediaRecorder), não simulada | Demonstrar de forma crível o fluxo de publicação em áudio/vídeo, mesmo sem backend | `hooks/useMediaRecorder.ts` grava e mede duração; `services/mock/media.ts` guarda o blob no IndexedDB (`dotstudy-media`) para sobreviver ao reload |
| Curtidas em comentário removidas do escopo | Simplifica o modelo (`Comentario` só precisa de `parentId` para respostas) sem perder a interação principal (curtir o post) | Comentários têm resposta, mas não curtida própria |
| Spotify implementado de forma híbrida (embed com playlists curadas + "Conectar Spotify" opcional via PKCE) | Desde 09/03/2026 o modo desenvolvedor do Spotify exige dono Premium e limita a 5 usuários em allowlist; um app aberto para toda a turma não seria viável | Player na navegação inferior sempre funciona com playlists curadas (`spotify/playlists.ts`); conexão OAuth é best-effort, com fallback automático em caso de erro ou usuário fora da allowlist |
| Modo demo (`VITE_DEMO_MODE=true`) com dificuldade "Demo" de 1 minuto | Gravar o vídeo de 2 minutos exige sessões curtas; a regra anti-trapaça continua valendo sobre os 54s mínimos da sessão de 1 minuto | Dificuldade extra some por padrão nos deploys (`VITE_DEMO_MODE=false`) |
| Timer baseado em horário-limite (`Date.now()`), não em contagem de ticks | Abas em segundo plano estrangulam `setInterval`; um timer por ticks atrasaria o fim da sessão | `hooks/useCountdown.ts` recalcula o tempo restante a cada tick e ao voltar a ficar visível (`visibilitychange`) |

## Próximo: CP6

O CP6 troca a camada mock pela API real, sem reescrever as telas — é exatamente o que o contrato de serviços do CP5 existe para viabilizar.

- **Backend real:** API Express + TypeScript + Prisma + PostgreSQL, com autenticação JWT e regras de negócio (pontuação, anti-trapaça, compra) replicadas do mock e testadas com Vitest/Supertest.
- **Persistência real:** troca de `localStorage`/IndexedDB por Postgres (via Prisma) e por um `StorageDriver` de mídia (local em Docker Compose, Cloudinary em produção).
- **Instalável:** `docker-compose.yml` com banco, API e web, para alguém de fora do grupo rodar `docker compose up` e testar (`docs/10-teste-instalacao.md`).
- **Deploy final:** frontend na Vercel (`VITE_DATA_SOURCE=api`), API no Render, banco no Neon — com tela de "acordando o servidor" para a hibernação do plano gratuito do Render.
- **Documentação:** manual de instalação (`docs/09-manual.md`), registro do teste de instalação externo e roteiro do vídeo de 3 minutos do CP6.
