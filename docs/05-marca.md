# Identidade Visual

## Nome

dot.study — em peças de marca externas (Figma, Trello) também aparece estilizado como ".Study" ou "dotStudy"; o nome canônico usado na documentação é sempre "dot.study".

## Identidade do projeto

Plataforma de estudos com gamificação: combina timer Pomodoro, feed social de posts de estudo, ranking entre usuários, loja de acessórios e histórico com gráficos. O avatar do usuário é um "dot" colorido personalizável com acessórios (óculos, chapéu de festa, chapéu de bruxa).

> **Nota sobre plataforma:** esta identidade visual foi formalizada a partir de explorações feitas em Figma/Figma Make com estética de app mobile. O v1 do projeto (CP4/CP5) continua sendo **web app responsivo** (React + Node/Express), conforme [docs/03-escopo.md](03-escopo.md) — a paleta, tipografia e mascote abaixo valem para essa superfície web, e ficam prontas para reaproveitar caso o projeto evolua para um app mobile nativo no futuro.

## Paleta de Cores

| Nome | Hex | Uso |
|---|---|---|
| Teal (primária) | `#22CFD5` | CTAs, destaques, Matemática |
| Yellow (accent) | `#FFC23D` | Moedas, estrelas, Física |
| Purple | `#A35BBF` | Português, conquistas |
| Red | `#EE1B3F` | Alertas, sequência, História |
| Green | `#2CCD2C` | Sucesso, Programação |
| Dark | `#111827` | Fundo da nav, texto principal |
| Off-white | `#FFFFF6` | Background principal (levemente creme) |

> As matérias na coluna "Uso" (Matemática, Física, Português, História, Programação) vêm da referência visual formalizada no Figma. Os assuntos reais do v1 são os definidos em [docs/03-escopo.md](03-escopo.md) (tecnologia, marketing, economia, entre outros). O mecanismo de "cor por assunto" vale para qualquer assunto cadastrado — a implementação do CP5 deve mapear cada assunto real a uma das cores acima (ou estender a paleta), não travar nos nomes de matéria escolar listados.

- Fundos: `#FFFFF6` (light) / `#111827` (dark)
- Cards: `#FFFEF0` (light) / `#1F2937` (dark)
- Textos secundários: `#6B7280`

## Tipografia

| Família | Uso | Peso |
|---|---|---|
| Outfit | Títulos, logo, headings | 700–900 |
| Inter | Corpo de texto, UI geral | 400–600 |
| JetBrains Mono | Números, timer, stats | 400–700 |
| Cal Sans | Marca / display ocasional | SemiBold |

## Bordas & Formas

- Border radius base: `0.75rem` (12px); cards grandes chegam a `1.25rem` (20px)
- Bordas sutis: `rgba(17,24,39,0.10)` no light, `rgba(255,255,255,0.12)` no dark
- Sombras leves (`shadow-sm`) apenas em hover ou elementos flutuantes

## Estrutura de Telas

> As telas abaixo refletem a referência visual do protótipo de alta fidelidade no Figma Make (ver seção Links). Podem incluir elementos além do escopo v1 formal (ex: tema gerado por IA, posts em áudio/vídeo, histórico com gráficos, leaderboard semanal). O contrato de requisitos para o CP5 continua sendo [docs/02-requisitos.md](02-requisitos.md) — qualquer funcionalidade extra aqui é visão de produto, não requisito aprovado, até ser adicionada lá.

- **Dashboard** — resumo do dia, streak, sessões recentes, atalho rápido
- **Timer** — modo Guiado (assunto + tema sugerido, RF01/RF02) e modo Livre; fases de trabalho, pausa e publicação. *(Não confundir com o "sistema de eventos" fora do escopo v1 — ver [docs/03-escopo.md](03-escopo.md); este é só o fluxo padrão de estudo.)*
- **Feed** — posts de texto/áudio/vídeo da comunidade, filtro por matéria
- **Ranking** — leaderboard semanal por matéria com pódio
- **Histórico** — gráfico de barras coloridas por matéria + lista agrupada por data
- **Loja** — acessórios para o dot, desbloqueados com moedas ganhas nas sessões
- **Configurações** — perfil, tema claro/escuro, cor do dot

## Voz Visual

- **Mood:** produtivo mas descontraído — gamificado sem ser infantil
- **Iconografia:** Lucide (stroke fino, 20–24px)
- **Avatares:** dot colorido simples (círculo) + acessório SVG sobreposto
- **Microinterações:** scale on hover (`hover:scale-[1.04]`), transições suaves de 150ms
- **Matérias com cor própria:** cada disciplina tem ícone + cor consistente em todo o app (ver paleta acima)

## Mascote "dot"

Círculo simples com olhos grandes arredondados e bochechas rosadas (estilo "kawaii" discreto). Customizável por cor e por acessórios (óculos, chapéu de festa, chapéu de bruxa, entre outros), desbloqueados com moedas ganhas por engajamento — sempre cosmético, nunca afeta a jogabilidade.

## Links

- [Identidade Visual no Figma](https://www.figma.com/design/dghZwyB9XNVTtDeIl3oFIo/Espa%C3%A7o-.Study?node-id=66-2&t=u720N9stHCUWybdX-1)
- [Protótipo de Alta Fidelidade no Figma Make](https://www.figma.com/make/yYRigvDsBLT0La7L5dXqwb/Interface-prototipa%C3%A7%C3%A3o-.study?t=i7rLvIxYVgJh6atv-1)
- [Vídeo — Apresentação do Projeto e Protótipo (Figma Make)](https://youtu.be/0dKmLjSZ75s)

> Testem os três links (Trello, Figma, Figma Make) em uma janela anônima antes da entrega — o link do Trello é um convite (pode expirar) e os do Figma dependem do compartilhamento estar como "qualquer pessoa com o link".
