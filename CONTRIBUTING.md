# Contribuir para o App Financeiro

![Expo](https://img.shields.io/badge/Expo-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-20232A?logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?logo=jest&logoColor=white)
![PRs](https://img.shields.io/badge/PRs-bem--vindos-2F5FE0)

Obrigado pelo interesse em ajudar. Este guia explica como montar o projeto, como o código está organizado e como enviar a tua contribuição.

## Índice

- [Antes de começar](#antes-de-começar)
- [Preparar o ambiente](#preparar-o-ambiente)
- [Como o código está organizado](#como-o-código-está-organizado)
- [Regras do projeto](#regras-do-projeto)
- [Fluxo de contribuição](#fluxo-de-contribuição)
- [Testes e verificações](#testes-e-verificações)
- [Convenções de código](#convenções-de-código)
- [Como reportar um erro](#como-reportar-um-erro)
- [Ideias para começar](#ideias-para-começar)

## Antes de começar

O App Financeiro é uma aplicação de finanças pessoais para Android e iOS, em **Kwanzas (AOA)**, com dados guardados localmente em SQLite. A visão completa do produto, o modelo de dados e as regras de negócio estão em [`plano_financas.md`](./plano_financas.md). Lê pelo menos as secções 2 (Princípios), 4 (Arquitetura) e 7 (Regras de domínio) antes de alterares código.

## Preparar o ambiente

### Pré-requisitos

- Node.js (versão LTS)
- Git
- Android Studio (Android) e/ou Xcode (iOS, só em macOS)

### Instalação

```bash
# 1. Faz fork do repositório no GitHub e clona o teu fork
git clone https://github.com/O_TEU_UTILIZADOR/app-financeiro.git
cd app-financeiro

# 2. Instala as dependências
npm install

# 3. Corre a app
npm start          # servidor Expo
npm run android    # build de desenvolvimento no Android
npm run ios        # build de desenvolvimento no iOS
```

O projeto usa `expo-dev-client`, por isso corre numa *development build* e não no Expo Go.

## Como o código está organizado

```
app/          Ecrãs e rotas (Expo Router)
assets/       Imagens, ícones e fontes
ecras-html/   Protótipos HTML dos ecrãs
scripts/      Scripts auxiliares (verify-schema)
src/
  db/         Cliente SQLite e migrações
  domain/     Regras de negócio (funções puras)
  repos/      Acesso a dados (SQL e transações)
  features/   Hooks e lógica por funcionalidade
  ui/         Tema e componentes reutilizáveis
types/        Tipos TypeScript
```

Fluxo de dependências:

```
UI  →  Hooks (features)  →  Repositórios  →  SQLite
                ↑
        Domínio (funções puras)
```

## Regras do projeto

Estas regras são inegociáveis e fazem parte da identidade da app:

1. **Local primeiro.** Sem conta, sem servidor, sem sincronização na nuvem. Pull requests que adicionem backend ou cloud não serão aceites.
2. **A interface não executa SQL.** Todo o acesso a dados passa por `src/repos`.
3. **O domínio é puro.** Ficheiros em `src/domain` não importam React, Expo nem SQLite, e têm testes.
4. **Transações.** Qualquer operação que altere mais de uma tabela corre numa transação.
5. **Valores derivados não se guardam.** Saldos, progresso e estados calculam-se a partir dos registos.
6. **Moeda e datas.** Valores em Kwanzas como inteiros, sem casas decimais. Datas como texto `YYYY-MM-DD`.
7. **Sem relatórios HTML** nem impressão de relatórios.
8. **Migrações.** Alterações ao esquema exigem uma nova migração numerada (`PRAGMA user_version`) e atualização do backup, se necessário.

## Fluxo de contribuição

1. Verifica nas [Issues](https://github.com/Keybachira/app-financeiro/issues) se já existe o tema. Para mudanças grandes, abre primeiro uma issue para alinharmos a ideia.
2. Cria um ramo a partir de `main`:
   ```bash
   git checkout -b tipo/descricao-curta
   ```
   Exemplos: `feat/filtro-por-categoria`, `fix/data-salario-fevereiro`, `docs/melhorar-readme`.
3. Faz as alterações em commits pequenos e claros.
4. Corre as verificações (ver abaixo).
5. Envia o ramo para o teu fork e abre um Pull Request para `main`, explicando o que mudou e porquê. Se alterares a interface, junta capturas de ecrã.

### Mensagens de commit

Usa o formato `tipo: descrição curta`, no imperativo:

```
feat: adicionar filtro por categoria nos movimentos
fix: corrigir data do salário em meses com 28 dias
docs: atualizar instruções de backup
test: cobrir meta reaberta após levantamento
refactor: extrair cálculo de ritmo para goalMath
```

## Testes e verificações

Antes de abrir um Pull Request, confirma que tudo passa:

```bash
npm run typecheck       # verificação de tipos
npm test                # testes (Jest)
npm run verify:schema   # coerência do esquema da base de dados
```

- Toda a regra nova em `src/domain` precisa de testes, incluindo casos-limite (por exemplo, salário no dia 31 em fevereiro, meta sem prazo, conta já paga no mês).
- Alterações em repositórios devem preservar a atomicidade das transações.
- Testa manualmente no telemóvel quando mexeres em ecrãs, notificações ou backup.

## Convenções de código

- **TypeScript** em todo o código. Evita `any`.
- **Nomes de código em inglês** (variáveis, funções, ficheiros). **Textos da interface em português de Angola**.
- **Design:** usa os tokens e componentes de `src/ui` em vez de cores e tamanhos soltos. Áreas de toque de pelo menos 44×44.
- **Acessibilidade:** o estado nunca depende só da cor; acompanha-o com texto.
- Mantém funções pequenas e com uma única responsabilidade.

## Como reportar um erro

Abre uma [issue](https://github.com/Keybachira/app-financeiro/issues) com:

- O que esperavas que acontecesse e o que aconteceu.
- Passos para reproduzir.
- Modelo e sistema do telemóvel (por exemplo, Android 14).
- Capturas de ecrã, se ajudarem.

Não incluas dados financeiros pessoais reais nos anexos.

## Ideias para começar

- Melhorar os testes de domínio e casos-limite.
- Revisão de acessibilidade (tamanho de letra grande, contraste).
- Melhorar mensagens de erro e validações nos formulários.
- Traduzir ou rever textos da interface.
- Documentação e capturas de ecrã.

Se tiveres dúvidas, abre uma issue com a etiqueta de pergunta. Toda a ajuda é bem-vinda.
