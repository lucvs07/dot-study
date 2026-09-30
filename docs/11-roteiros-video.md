# Roteiro do Vídeo — CP5 (2 minutos)

Vídeo de demonstração do protótipo funcional, gravado a partir do app publicado (ou local, com o modo demo ligado).

**Configuração para gravar:**

```bash
VITE_DEMO_MODE=true npm run dev
```

Isso libera a dificuldade "Demo" (1 minuto) no modo desafio, para não esperar o tempo real de foco durante a gravação. Cortes de tempo morto (carregamento, digitação) podem ser acelerados na edição.

## Blocos

| Tempo | Fala | Tela |
|---|---|---|
| 0:00–0:15 | Apresenta o problema (estudar sozinho é difícil de manter) e a proposta do dot.study: transformar sessões de estudo em ciclos com foco, registro, comunidade e recompensa | Logo do dot.study e o personagem "dot" |
| 0:15–0:35 | Cria uma conta nova, mostrando o bônus de boas-vindas de 250 moedas | Tela de Cadastro → Dashboard já logado, com o saldo de moedas visível |
| 0:35–1:05 | Inicia um desafio na dificuldade "Demo" (1 minuto): escolhe um assunto aleatório, mostra o tema sorteado, digita uma anotação rápida durante o foco, e o ciclo é concluído (+10 moedas) | EstudarPage: seleção de dificuldade/assunto → tema sorteado → cronômetro rodando com anotações → tela de ciclo concluído |
| 1:05–1:25 | Publica um post em áudio gravado na hora (+30 moedas), vê o post aparecer no feed, curte e comenta | PostPublisher gravando áudio → FeedPage mostrando o novo post → curtida e comentário |
| 1:25–1:40 | Mostra o ranking do assunto estudado, destacando a nova posição do usuário | RankingPage com a posição do usuário em destaque |
| 1:40–1:52 | Vai até a loja, compra o acessório "Laço Rosa" e equipa no personagem | LojaPage: compra → personagem com o acessório equipado |
| 1:52–2:00 | Mostra o player do Spotify tocando uma playlist de foco e encerra com o link do CP5 | SpotifyPlayer na navegação inferior → tela final com a URL `<URL do CP5>` |
