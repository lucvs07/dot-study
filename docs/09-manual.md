# Manual de Instalação e Uso (CP6)

Este manual cobre a forma recomendada de instalar o dot.study (Docker Compose), o uso de cada tela, e alternativas (rodar sem Docker, rodar os testes, fazer o deploy público). Serve de roteiro para o teste de instalação externo (`docs/10-teste-instalacao.md`).

## 1. Requisitos

- **Docker Desktop** (Windows/macOS) ou **Docker Engine + Compose v2** (Linux).
- **4 GB de RAM livres** para os três containers (banco, API e web).
- **Porta 8080 livre** na máquina (ver solução em "Problemas comuns" se estiver ocupada).

Não é preciso instalar Node.js, Postgres nem nada além do Docker para o caminho principal.

## 2. Instalar e rodar (caminho principal)

```bash
git clone https://github.com/lucvs07/dot-study.git
cd dot-study
docker compose up --build
```

Depois que os três serviços subirem (o terminal mostra `dotstudy-api-1` e `dotstudy-web-1` como `healthy`), abra:

```
http://127.0.0.1:8080
```

A primeira vez leva alguns minutos (build das imagens, download do Postgres, migração do banco e seed do catálogo). As próximas vezes que você rodar `docker compose up` (sem `--build`) sobem em segundos, reaproveitando as imagens já construídas.

> Use sempre `http://127.0.0.1:8080`, não `http://localhost:8080`: o microfone/câmera do navegador só liberam em um "contexto seguro" (HTTPS ou IP de loopback), e `127.0.0.1` garante isso em qualquer sistema.

## 3. Entrar

- **Conta de demonstração:** `demo@dotstudy.app` / `dotstudy123` — já vem com 840 moedas, posts, comentários e ranking populados em todos os assuntos (dados de seed, iguais ao mock do CP5).
- **Ou crie uma conta** pela tela de Cadastro — ganha 250 moedas de boas-vindas e começa com o progresso zerado.

## 4. Usar

A navegação principal fica na barra inferior: **Início**, **Estudar**, **Feed**, **Ranking**, **Histórico** e **Ajustes**; o atalho da **Loja** fica no centro da barra.

- **Início (Dashboard):** saudação do dia, resumo de moedas/sequência de dias, sessões recentes e atalho para continuar estudando.
- **Estudar:**
  - **Modo desafio:** escolha uma área de assunto → o app sorteia um tema dentro dela → configure a dificuldade (Fácil 15 min, Médio 25 min, Difícil 40 min — e **Demo** de 1 min, só quando `VITE_DEMO_MODE=true`) e a quantidade de ciclos → inicie o cronômetro (pomodoro de foco/pausa), digite anotações durante o foco, e ao final de cada ciclo o app credita +10 moedas (e +10 pontos no ranking do assunto, pois tem assunto).
  - **Sessão livre:** mesmo cronômetro, mas sem assunto/tema sorteado — não gera pontos de ranking, só moedas pelos ciclos.
  - Ao terminar a sessão, o app leva para a **Leitura** (resumo da sessão: tema, anotações, tempo total) e de lá para **Publicar**.
- **Publicar (post):** escreva um texto, ou grave **áudio** ou **vídeo** direto pelo navegador (o app pede permissão de microfone/câmera — por isso o acesso precisa ser por `127.0.0.1`). Um post publicado concede +30 moedas e +30 pontos no assunto da sessão, no máximo uma vez por sessão.
- **Feed:** lista os posts da comunidade (texto, áudio ou vídeo), com curtir, comentar, responder e salvar.
- **Ranking:** pontuação por assunto, calculada a partir de ciclos concluídos e posts publicados (não é uma tabela separada — é recalculada na consulta).
- **Histórico:** todas as sessões de estudo do usuário, com estatísticas (sequência de dias, tempo total, tempo de hoje) no fuso horário do navegador.
- **Loja:** compra de acessórios para o personagem "dot" com moedas (debita o saldo e equipa no personagem).
- **Ajustes:** dados da conta, cor do personagem, player do Spotify e sair da conta. O botão "Restaurar dados de demonstração" só aparece no modo mock (CP5/sem backend) — no Docker/API, para recomeçar do zero use `docker compose down -v` (ver seção 5).
- **Spotify:** o player de playlists de foco curadas aparece sempre na navegação, sem precisar de conta. O botão "Conectar Spotify" (menu do player) é opcional e usa OAuth PKCE com a conta pessoal do usuário — ver limitações na seção 6.

## 5. Parar e remover

```bash
docker compose down       # para os containers; o volume do banco e dos uploads continua
docker compose down -v    # além de parar, apaga o volume: zera banco e uploads
```

Depois de um `docker compose down` (sem `-v`) seguido de `docker compose up`, os dados continuam exatamente como estavam (contas criadas, posts, moedas, ranking).

## 6. Problemas comuns

- **Porta 8080 ocupada:** edite `docker-compose.yml`, troque a linha `"8080:80"` do serviço `web` para `"8081:80"` e inclua `http://127.0.0.1:8081` na variável `WEB_ORIGIN` do serviço `api` (separada por vírgula das demais origens). Depois acesse `http://127.0.0.1:8081`.
- **Docker sem memória:** se o `docker compose up --build` travar ou os containers reiniciarem em loop, aumente a memória alocada ao Docker Desktop (Configurações → Resources) para pelo menos 4 GB.
- **Microfone/câmera bloqueados:** confirme que está acessando por `http://127.0.0.1:8080` (não `localhost`, nem o IP da rede local, ex. `192.168.x.x`) — só `127.0.0.1`/HTTPS são contextos seguros para `getUserMedia`. Verifique também a permissão do navegador para o site.
- **Spotify "não liberado para o seu usuário":** o app do dot.study está em modo desenvolvedor no Spotify, limitado a 5 contas cadastradas na allowlist; o player de playlists curadas continua funcionando normalmente sem conectar a conta.

## 7. Rodar sem Docker (desenvolvimento)

Pré-requisito: Node.js ≥ 20.

```bash
npm install
npx -w backend prisma generate
npm run db:dev:up -w backend
cp backend/.env.example backend/.env    # edite se precisar (ex.: JWT_SECRET)
npx -w backend prisma migrate deploy
npm run db:seed -w backend
```

Em dois terminais:

```bash
npm run dev:backend   # API em http://127.0.0.1:3000
npm run dev:api       # frontend em http://127.0.0.1:5173, ligado à API (VITE_DATA_SOURCE=api)
```

> `npm run db:dev:up -w backend` só funciona na primeira vez (cria o container `dotstudy-pg-dev`). Se ele já existir (parado), suba de novo com `docker start dotstudy-pg-dev`.

Para rodar só o frontend com dados mockados (sem backend, sem banco):

```bash
npm run dev        # http://127.0.0.1:5173, modo mock (igual ao CP5)
npm run dev:demo   # mesma coisa, com a dificuldade "Demo" de 1 minuto ligada
```

## 8. Rodar os testes

```bash
npm run db:test:up -w backend   # sobe o Postgres de teste na porta 5433 (container dotstudy-pg-test)
npm test                        # roda os testes de shared, backend e frontend
```

## 9. Deploy público (para o grupo)

- **Vercel:** Root Directory `frontend`; variáveis `VITE_DATA_SOURCE=api` e `VITE_API_URL=<URL do Render>` (origem pura, sem `/api/v1` e sem barra no final); opcionalmente `VITE_SPOTIFY_CLIENT_ID`.
- **Render:** `render.yaml` na raiz do repositório (Blueprint) ou criação manual de um Web Service Node apontando para o mesmo build/start commands do arquivo; variáveis sensíveis (`DATABASE_URL`, `WEB_ORIGIN`, `CLOUDINARY_URL`) são marcadas como `sync: false` e precisam ser preenchidas no painel do Render.
- **Neon:** criar um banco Postgres gratuito e usar a connection string como `DATABASE_URL` do serviço do Render.
- **Cloudinary:** criar uma conta gratuita e usar a `CLOUDINARY_URL` (com `STORAGE_DRIVER=cloudinary`, já definido no `render.yaml`) — necessário porque o disco do Render é apagado a cada deploy/reinício.
- **`WEB_ORIGIN`** (no Render) deve ser exatamente a origem publicada na Vercel, sem barra no final (ex.: `https://dot-study.vercel.app`).
- **Spotify:** cadastre as redirect URIs usadas pelo projeto no [Spotify Developer Dashboard](https://developer.spotify.com/dashboard): `http://127.0.0.1:5173/spotify/callback` (dev), `http://127.0.0.1:8080/spotify/callback` (Docker) e a URL de produção da Vercel + `/spotify/callback`. Lembre-se do limite de 5 contas em allowlist no modo desenvolvedor.

> **Alterar o `JWT_SECRET` do Docker Compose:** o valor padrão do `docker-compose.yml` serve só para instalação local. Para usar um segredo próprio, gere um com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` e rode `JWT_SECRET=<valor gerado> docker compose up --build`.
