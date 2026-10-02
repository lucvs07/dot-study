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

## CP5 → CP6

O CP6 trocou a camada mock pelo backend real, sem reescrever as telas — exatamente o que o contrato de serviços do CP5 existia para viabilizar (RNF04). As decisões abaixo registram o que mudou (ou o que precisou ser decidido) nessa travessia.

| Decisão | Motivo | Impacto |
|---|---|---|
| Pacote `shared` (`@dot-study/shared`) como fonte única do contrato e das regras | Frontend e backend não podiam divergir na fórmula de pontuação, nos códigos de erro ou nos limites de mídia — um dos dois reimplementar essas constantes geraria bugs de inconsistência | `shared/src/contracts.ts` (tipos, `ServiceError`/`ServiceErrorCode`, `MEDIA_LIMITS`) e `shared/src/rules.ts` (`COINS`, `canCompleteCycle`) são importados por `backend/` e por `frontend/src/services/api/`; nada de fórmula copiada |
| Express 5 + Prisma 6 | Express 5 encaminha automaticamente throws síncronos e promises rejeitadas para o error handler (menos boilerplate de `try/catch` em cada rota); Prisma 6 é a major atual com suporte ao Postgres 16 | `backend/src/app.ts` usa um único error handler central; `backend/prisma/schema.prisma` gerado com `prisma-client-js` |
| JWT no `localStorage` (trade-off aceito) | Mais simples que um refresh token com cookie `httpOnly` para o prazo do checkpoint, e dispensa CSRF em uma API sem cookies de sessão | Vulnerável a XSS (qualquer script injetado na página rouba o token); mitigado por não ter `dangerouslySetInnerHTML` no app e por o token expirar em 7 dias |
| `bcryptjs` em vez de `bcrypt` nativo | `bcrypt` depende de compilação nativa (node-gyp); a imagem Docker do backend não tem toolchain de build, e isso quebraria `docker compose up` em ambientes sem as libs certas | `modules/auth/service.ts` usa `bcryptjs` (puro JS, mais lento, aceitável no volume do projeto) |
| Estatísticas no fuso do usuário (`tzOffset`) | O servidor roda em UTC; "sequência de dias" e "tempo de hoje" calculados em UTC dariam resultado errado para quem estuda à noite no fuso do Brasil | Endpoints de estatística recebem o offset do navegador e agregam por dia local, não por dia UTC |
| Travas de concorrência no banco (update condicional e chaves únicas) | Duas abas ou duas requisições quase simultâneas não podem conceder a mesma recompensa duas vezes (ciclo, post, compra) | `completeCycle` faz `updateMany` condicionado a `completedCycles` atual; `posts.create` faz `updateMany` condicionado a `rewardedPostId: null`; `UserAccessory` tem chave primária composta (`userId`, `accessoryId`) |
| Duração da mídia vinda do cliente, limitada no servidor (sem `ffprobe`) | Medir a duração real exigiria decodificar o arquivo no servidor (`ffprobe`/`ffmpeg`), uma dependência pesada fora do Tech Stack e sem benefício claro para o escopo do projeto | `durationSec` é medido no navegador (`MediaRecorder`) e só comparado contra `MEDIA_LIMITS[kind].maxSeconds`; um cliente malicioso pode mentir a duração, mas o `maxBytes` ainda limita o tamanho do arquivo |
| Validação da assinatura do arquivo (além do MIME) | O `Content-Type` enviado pelo navegador pode ser forjado ou genérico; aceitar só por MIME abriria a porta para qualquer arquivo disfarçado de áudio/vídeo | `storage/sniff.ts` lê os primeiros bytes do arquivo e reconhece o contêiner real (webm/mp4/ogg/mpeg/wav) antes de aceitar o upload |
| Mídia ligada ao dono (`Media`) | Sem essa entidade, qualquer usuário autenticado poderia citar a URL de mídia de outra pessoa ao criar um post | `Media.ownerId` + o resolver de mídia do backend conferem dono, tipo e que a mídia ainda não foi usada em outro post (`mediaId` é `@unique` em `Post`) antes de aceitar |
| Seed idempotente | O seed roda toda vez que o container sobe (`docker compose up`) e no deploy do Render a cada novo build; rodar duas vezes não pode duplicar assuntos, temas ou acessórios | `backend/src/seed.ts` usa `upsert` pelas chaves naturais (id do assunto/tema/acessório), nunca `create` puro |
| nginx fazendo proxy de `/api` e `/media` no Docker | Evita CORS: o navegador fala só com `127.0.0.1:8080`, e o nginx repassa para `api:3000` por trás, simplificando a configuração de origem permitida | `frontend/nginx.conf` tem `location /api/` e `location /media/` fazendo `proxy_pass` para o serviço `api` |
| Render free com hibernação e o banner "Acordando o servidor" | O plano gratuito do Render hiberna a API após inatividade; a primeira requisição depois disso pode levar dezenas de segundos, e sem aviso pareceria que o app travou | `frontend/src/hooks/useServerWakeup.ts` detecta a espera e `frontend/src/components/ServerStatusBanner.tsx` mostra o aviso (responsivo para celular) |
| Cloudinary no deploy, por causa do disco efêmero do Render | O disco do Render free é apagado a cada deploy/restart; gravar mídia em `UPLOAD_DIR` local perderia todo o conteúdo publicado | `STORAGE_DRIVER=local` no Docker Compose (volume persistente) e `STORAGE_DRIVER=cloudinary` no Render (`backend/src/storage/cloudinary.ts`), escolhido por variável de ambiente sem mudar o código do módulo de uploads |

## O que ficou para depois

- Recuperação de senha por email
- Moderação de conteúdo (posts, comentários e mídia)
- Sistema de eventos (desafios temáticos, maratonas de estudo)
- Notificações (comentário recebido, resposta, novo post de quem você segue)
- Testes E2E no navegador (ex.: Playwright cobrindo o fluxo estudar → publicar → ranking)

## Próximo: CP6

O CP6 troca a camada mock pela API real, sem reescrever as telas — é exatamente o que o contrato de serviços do CP5 existe para viabilizar.

- **Backend real:** API Express + TypeScript + Prisma + PostgreSQL, com autenticação JWT e regras de negócio (pontuação, anti-trapaça, compra) replicadas do mock e testadas com Vitest/Supertest.
- **Persistência real:** troca de `localStorage`/IndexedDB por Postgres (via Prisma) e por um `StorageDriver` de mídia (local em Docker Compose, Cloudinary em produção).
- **Instalável:** `docker-compose.yml` com banco, API e web, para alguém de fora do grupo rodar `docker compose up` e testar (`docs/10-teste-instalacao.md`).
- **Deploy final:** frontend na Vercel (`VITE_DATA_SOURCE=api`), API no Render, banco no Neon — com tela de "acordando o servidor" para a hibernação do plano gratuito do Render.
- **Documentação:** manual de instalação (`docs/09-manual.md`), registro do teste de instalação externo e roteiro do vídeo de 3 minutos do CP6.
