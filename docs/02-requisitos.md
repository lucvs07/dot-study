# Requisitos Funcionais e Não Funcionais

## Requisitos Funcionais (RF)

| # | Requisito | Status final (CP6) |
|---|---|---|
| RF01 | O sistema deve permitir selecionar uma área de assunto | Implementado (API + Postgres) |
| RF02 | O sistema deve sugerir uma temática aleatória dentro da área escolhida | Implementado (API + Postgres) |
| RF03 | O sistema deve fornecer um timer pomodoro configurável (duração de foco/pausa) | Implementado (API + Postgres) |
| RF04 | O sistema deve permitir registrar anotações durante a sessão de estudo | Implementado (API + Postgres) |
| RF05 | O sistema deve permitir publicar um artigo com base na sessão de estudo | Implementado (API + Postgres) |
| RF06 | O sistema deve exibir um feed com os artigos publicados pela comunidade | Implementado (API + Postgres) |
| RF07 | O sistema deve calcular e exibir um ranking de usuários por assunto | Implementado (API + Postgres) |
| RF08 | O sistema deve conceder moedas por ações de engajamento (pomodoro completo, artigo publicado) | Implementado (API + Postgres) |
| RF09 | O sistema deve permitir customizar o personagem "dot" (cor, acessórios) usando moedas acumuladas | Implementado (API + Postgres) |
| RF10 | O sistema deve exibir um perfil do usuário com progresso, moedas e personagem customizado | Implementado (API + Postgres) |
| RF11 | O sistema deve permitir cadastro e login com email e senha | Implementado (API + Postgres) |
| RF12 | O sistema deve permitir comentar, responder, curtir e salvar posts | Implementado (API + Postgres) |
| RF13 | O sistema deve permitir publicar posts em áudio e vídeo gravados no navegador | Implementado (upload real: volume local no Docker, Cloudinary no deploy) |
| RF14 | O sistema deve oferecer player do Spotify com playlists de foco e conexão opcional com a conta do usuário | Implementado (embed + PKCE opcional; limitado a 5 contas pelo Spotify) |
| RF15 | O sistema deve exibir histórico de sessões e estatísticas (sequência de dias, tempo total) | Implementado (API + Postgres) |

### Fórmulas de pontuação (definidas neste checkpoint)

| Ação | Moedas | Pontos no ranking do assunto |
|---|---|---|
| Ciclo de pomodoro concluído | +10 | +10 (somente modo desafio, que tem assunto) |
| Post publicado (qualquer tipo) | +30 (máx. 1 recompensa por sessão, só se a sessão tiver ≥ 1 ciclo concluído) | +30 (só o post recompensado, que tem o assunto da sessão) |
| Compra de acessório | −custo | — |
| Cadastro (bônus de boas-vindas) | +250 | — |

Pontuação do usuário no assunto = `10 × ciclos concluídos no assunto + 30 × posts recompensados no assunto` (período total). Um post conta se for o post recompensado da sua sessão (o primeiro publicado depois de ≥ 1 ciclo concluído); posts extras da mesma sessão ou de sessão sem ciclo não pontuam. Os posts do seed de demonstração, que não têm sessão, contam (`computeSubjectScores` em `shared/src/rules.ts`). O ranking não é uma tabela própria: é calculado por consulta sobre sessões e posts (ver `docs/04-modelagem-uml.md`).

### Regras anti-trapaça

- Um ciclo só é aceito se `agora − (ultimoCicloEm ?? iniciadaEm) ≥ 0,9 × minutosFoco × 60.000 ms`.
- `ciclosConcluidos` nunca passa de `ciclosPlanejados`.
- Cada sessão gera recompensa por, no máximo, 1 post.
- Compra falha se saldo < custo ou o acessório já estiver desbloqueado.

## Requisitos Não Funcionais (RNF)

| # | Requisito |
|---|---|
| RNF01 | Interface responsiva (desktop e mobile via navegador) |
| RNF02 | Telas principais devem carregar com fluidez perceptível (sem loaders longos) |
| RNF03 | Frontend organizado em componentes reutilizáveis (React), preparando evolução para CP5/CP6 |
| RNF04 | Cumprido: `services/contracts.ts` define o contrato de dados; a implementação mock (`services/mock/`) é trocável pela implementação real (CP6) via `VITE_DATA_SOURCE` |
| RNF05 | Identidade visual (paleta, tipografia, mascote) aplicada de forma consistente entre todas as telas |
| RNF06 | Aplicação hospedada em serviço gratuito de deploy, acessível publicamente a partir do CP5 — URL do protótipo (CP5): https://dot-study-cp5.vercel.app; URL final (CP6, frontend Vercel + API Render): https://dot-study-final.vercel.app (API: https://dot-study-api.onrender.com) |
| RNF07 | Timer preciso mesmo com a aba em segundo plano |
| RNF08 | Mensagens de erro em português em todos os fluxos |
| RNF09 | Dados persistidos em PostgreSQL com transações nas operações que envolvem moedas |
| RNF10 | Instalável com `docker compose up` em `http://127.0.0.1:8080` |
| RNF11 | Regras de pontuação e anti-trapaça aplicadas no servidor |
