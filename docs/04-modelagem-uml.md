# Modelagem UML

Diagramas em Mermaid, renderizados diretamente no GitHub (sem depender de ferramenta externa).

## Diagrama de Classes

```mermaid
classDiagram
    class Usuario {
        +id
        +nome
        +email
        +moedas
    }
    class PerfilDot {
        +corAtual
        +acessoriosAtivos
    }
    class Assunto {
        +id
        +nome
    }
    class Tema {
        +id
        +titulo
        +assuntoId
    }
    class SessaoEstudo {
        +id
        +usuarioId
        +temaId
        +duracaoPomodoro
        +anotacoes
        +status
    }
    class Artigo {
        +id
        +usuarioId
        +sessaoEstudoId
        +titulo
        +conteudo
        +dataPublicacao
    }
    class Acessorio {
        +id
        +nome
        +tipo
        +custoMoedas
    }
    class RankingEntry {
        +usuarioId
        +assuntoId
        +pontuacao
    }

    Usuario "1" --> "1" PerfilDot
    Usuario "1" --> "*" SessaoEstudo
    SessaoEstudo "1" --> "0..1" Artigo
    SessaoEstudo "*" --> "1" Tema
    Tema "*" --> "1" Assunto
    Usuario "*" --> "*" Acessorio : desbloqueou
    Usuario "1" --> "*" RankingEntry
    RankingEntry "*" --> "1" Assunto
```

## Diagrama de Caso de Uso

Mermaid não tem um tipo nativo para diagrama de caso de uso; representado como `flowchart` seguindo a convenção ator → elipses de caso de uso.

```mermaid
flowchart LR
    Usuario(("👤 Usuário"))
    UC1([Selecionar assunto de estudo])
    UC2([Iniciar sessão de pomodoro])
    UC3([Registrar anotações])
    UC4([Publicar artigo])
    UC5([Visualizar feed])
    UC6([Visualizar ranking])
    UC7([Customizar personagem dot])

    Usuario --> UC1
    Usuario --> UC2
    Usuario --> UC3
    Usuario --> UC4
    Usuario --> UC5
    Usuario --> UC6
    Usuario --> UC7
    UC2 -. include .-> UC3
```
