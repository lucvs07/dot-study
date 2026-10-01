# Roteiro do Vídeo — CP5 (2 minutos)

Vídeo de demonstração do protótipo funcional, gravado a partir do app publicado (ou local, com o modo demo ligado).

**Configuração para gravar:**

```bash
npm run dev:demo
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

---

# Roteiro do Vídeo — CP6 (3 minutos)

Vídeo de demonstração da entrega final: backend real, Postgres, upload de mídia e deploy instalável via Docker Compose. Grave com o frontend em **modo API** (`VITE_DATA_SOURCE=api`) e o **modo demo ligado**, para que a dificuldade "Demo" (1 minuto) esteja disponível sem esperar o tempo real de foco.

**Configuração para gravar:**

- **Local, API real:** `npm run dev:backend` + `npm run dev:api` (modo API) com `frontend/.env.local` contendo `VITE_DEMO_MODE=true` — ou grave direto na URL pública do CP6, se o deploy já tiver essa variável ligada.
- **Docker:** para empacotar a mesma demonstração com a dificuldade "Demo" disponível na imagem, gere o build com o argumento extra:

  ```bash
  docker compose build --build-arg VITE_DEMO_MODE=true web
  docker compose up -d
  ```

  O `docker compose build` sozinho (sem o `--build-arg`) reconstrói a imagem com `VITE_DEMO_MODE=false` de novo (o valor padrão do compose, via `${VITE_DEMO_MODE:-false}`) — **não rode `docker compose up --build` depois do build com o argumento**, ou a imagem volta a ser reconstruída sem o modo demo. Suba só com `docker compose up -d`, reaproveitando a imagem já construída.

## Blocos

| Tempo | Fala | Tela |
|---|---|---|
| 0:00–0:20 | Evolução do projeto: CP4 (ideia e contrato de dados) → CP5 (protótipo funcional com dados mockados) → CP6 (API real, Postgres, upload de mídia e instalação via Docker) | Logo do dot.study e, em texto/tela, as três fases |
| 0:20–0:50 | Arquitetura da entrega final (diagrama de implantação: web/nginx, API Express, Postgres, Cloudinary) e instalação com um comando | Diagrama de implantação (`docs/04-modelagem-uml.md`) → terminal rodando `docker compose up --build` até abrir `http://127.0.0.1:8080` |
| 0:50–1:30 | Fluxo completo com dados reais persistidos no Postgres: cadastro de uma conta nova, desafio na dificuldade "Demo" (1 minuto), publicação de um post em áudio gravado na hora, aparecendo no feed e no ranking | Cadastro → EstudarPage (dificuldade Demo) → ciclo concluído → gravação de áudio → FeedPage com o novo post → RankingPage atualizado |
| 1:30–2:00 | Persistência real: reinicia o `docker compose` e os dados continuam (conta, moedas, post, ranking) | Terminal: `docker compose down` → `docker compose up` → app reaberto com os mesmos dados |
| 2:00–2:30 | Qualidade: CI verde no GitHub Actions, testes automatizados de concorrência (duas requisições simultâneas não duplicam a recompensa) e de anti-trapaça (ciclo rejeitado antes do tempo mínimo) | Tela do GitHub Actions com o workflow verde → trecho dos testes de concorrência/anti-trapaça no editor |
| 2:30–3:00 | Encerra com o link público do CP6, o manual de instalação e o registro do teste de instalação feito por alguém de fora do grupo | Tela final com a URL `<URL do CP6>`, e os documentos `docs/09-manual.md` / `docs/10-teste-instalacao.md` |
