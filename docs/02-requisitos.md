# Requisitos Funcionais e Não Funcionais

## Requisitos Funcionais (RF)

| # | Requisito |
|---|---|
| RF01 | O sistema deve permitir selecionar uma área de assunto |
| RF02 | O sistema deve sugerir uma temática aleatória dentro da área escolhida |
| RF03 | O sistema deve fornecer um timer pomodoro configurável (duração de foco/pausa) |
| RF04 | O sistema deve permitir registrar anotações durante a sessão de estudo |
| RF05 | O sistema deve permitir publicar um artigo com base na sessão de estudo |
| RF06 | O sistema deve exibir um feed com os artigos publicados pela comunidade |
| RF07 | O sistema deve calcular e exibir um ranking de usuários por assunto |
| RF08 | O sistema deve conceder moedas por ações de engajamento (pomodoro completo, artigo publicado) |
| RF09 | O sistema deve permitir customizar o personagem "dot" (cor, acessórios) usando moedas acumuladas |
| RF10 | O sistema deve exibir um perfil do usuário com progresso, moedas e personagem customizado |

> **Nota sobre pontuação/moedas:** tanto o ranking (RF07) quanto as moedas (RF08) são derivados do número de pomodoros completos e artigos publicados dentro de um assunto. A fórmula exata de conversão (quantas moedas por pomodoro, peso do artigo no ranking, etc.) é um detalhe de implementação a ser definido no CP5, quando o protótipo mockado entrar em construção.

## Requisitos Não Funcionais (RNF)

| # | Requisito |
|---|---|
| RNF01 | Interface responsiva (desktop e mobile via navegador) |
| RNF02 | Telas principais devem carregar com fluidez perceptível (sem loaders longos) |
| RNF03 | Frontend organizado em componentes reutilizáveis (React), preparando evolução para CP5/CP6 |
| RNF04 | Dados mockados devem seguir um contrato de dados definido, para troca por API real no CP6 sem retrabalho de tela |
| RNF05 | Identidade visual (paleta, tipografia, mascote) aplicada de forma consistente entre todas as telas |
| RNF06 | Aplicação hospedada em serviço gratuito de deploy, acessível publicamente a partir do CP5 |
