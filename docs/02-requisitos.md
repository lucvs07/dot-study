# Requisitos Funcionais e Não Funcionais

## Requisitos Funcionais (RF)

| # | Requisito | Status CP5 |
|---|---|---|
| RF01 | O sistema deve permitir selecionar uma área de assunto | Implementado (mock) |
| RF02 | O sistema deve sugerir uma temática aleatória dentro da área escolhida | Implementado (mock) |
| RF03 | O sistema deve fornecer um timer pomodoro configurável (duração de foco/pausa) | Implementado (mock) |
| RF04 | O sistema deve permitir registrar anotações durante a sessão de estudo | Implementado (mock) |
| RF05 | O sistema deve permitir publicar um artigo com base na sessão de estudo | Implementado (mock) |
| RF06 | O sistema deve exibir um feed com os artigos publicados pela comunidade | Implementado (mock) |
| RF07 | O sistema deve calcular e exibir um ranking de usuários por assunto | Implementado (mock) |
| RF08 | O sistema deve conceder moedas por ações de engajamento (pomodoro completo, artigo publicado) | Implementado (mock) |
| RF09 | O sistema deve permitir customizar o personagem "dot" (cor, acessórios) usando moedas acumuladas | Implementado (mock) |
| RF10 | O sistema deve exibir um perfil do usuário com progresso, moedas e personagem customizado | Implementado (mock) |
| RF11 | O sistema deve permitir cadastro e login com email e senha | Implementado (mock) |
| RF12 | O sistema deve permitir comentar, responder, curtir e salvar posts | Implementado (mock) |
| RF13 | O sistema deve permitir publicar posts em áudio e vídeo gravados no navegador | Implementado (mock, mídia no navegador) |
| RF14 | O sistema deve oferecer player do Spotify com playlists de foco e conexão opcional com a conta do usuário | Implementado |
| RF15 | O sistema deve exibir histórico de sessões e estatísticas (sequência de dias, tempo total) | Implementado (mock) |

### Fórmulas de pontuação (definidas neste checkpoint)

| Ação | Moedas | Pontos no ranking do assunto |
|---|---|---|
| Ciclo de pomodoro concluído | +10 | +10 (somente modo desafio, que tem assunto) |
| Post publicado (qualquer tipo) | +30 (máx. 1 recompensa por sessão) | +30 (se o post tiver assunto) |
| Compra de acessório | −custo | — |
| Cadastro (bônus de boas-vindas) | +250 | — |

Pontuação do usuário no assunto = `10 × ciclos concluídos no assunto + 30 × posts no assunto` (período total). O ranking não é uma tabela própria: é calculado por consulta sobre sessões e posts (ver `docs/04-modelagem-uml.md`).

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
| RNF06 | Aplicação hospedada em serviço gratuito de deploy, acessível publicamente a partir do CP5 — URL: `<URL do CP5>` |
| RNF07 | Timer preciso mesmo com a aba em segundo plano |
| RNF08 | Mensagens de erro em português em todos os fluxos |
