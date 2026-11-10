# Meu Kumbo — Auditoria visual e UX

Data: 2026-11-09  
Escopo: estado atual do working tree em `main`; análise estática, screenshots existentes e tentativa de execução Expo Web.

## Limitações

Não foi possível obter um browser/tab controlável nesta sessão. O Expo Web iniciou o Metro em `http://localhost:8081`, mas a inspeção visual interativa não ficou disponível. As observações visuais abaixo combinam os screenshots versionados em `assets/screenshots/` com os tokens, estilos e telas atuais; não são apresentados como validação de dispositivo.

## Diagnóstico geral

O produto tem uma identidade visual definida, mas a implementação está em migração. O dashboard e alguns componentes recentes usam `src/ui/theme.ts`, `src/ui/design/tokens.ts` e componentes Lucide; várias telas secundárias ainda usam `data.ts`, Feather e estilos legados. Os screenshots versionados mostram outra identidade (azul/glass, navegação com quatro módulos de negócio) e não correspondem à implementação atual, que declara fundo claro/cinza, acento roxo e abas Início/Movimentos/Estatísticas/Ajustes.

## Problemas encontrados

| ID | Tela/módulo | Evidência | Impacto | Prioridade |
|---|---|---|---|---|
| VIS-001 | Todas as telas | `data.ts:1-16` mantém tema/helpers/store legado; `src/ui/theme.ts` define outro sistema; `app/(tabs)/_layout.tsx:19-24` define nova barra. A matriz de redesign ainda marca quase todos os ecrãs como parciais (`docs/REDESIGN_FUNCTIONAL_INVENTORY.md:115-127`). | Aparência, espaçamento, tipografia, ícones e estados variam entre ecrãs. | P1 |
| VIS-002 | Dashboard e ecrãs secundários | `assets/screenshots/inicio.jpeg`, `metas.jpeg`, `dividas.jpeg`, `projetos.jpeg` mostram azul/glass e tabs antigas; tokens atuais usam `#EDEDED`/roxo em `src/ui/theme.ts`. | Material de apresentação e documentação induzem a expectativa errada; regressões visuais ficam difíceis de detetar. | P2 |
| VIS-003 | Tema escuro/claro | `src/ui/theme.ts` tem paletas clara/escura, mas `app/ajustes.tsx:339-418`, `app/onboarding.tsx:373-408` e outras telas usam cores hardcoded (`#fff`, `#9C32D7`, `#F0DDF8`). | Mudança de tema pode deixar contraste, botões e estados com cores inadequadas. | P2 |
| VIS-004 | Navegação inferior | `app/(tabs)/_layout.tsx:36-41` expõe `goals`, `debts` e `projects` no Tabs, mas a barra personalizada só desenha quatro itens em `:157-164`. | Rotas existem no navigator mas não são descobertas pela navegação principal; aumenta inconsistência de retorno e deep links. | P2 |
| VIS-005 | Estados de dados | Há estados vazios em várias telas, mas não há evidência de uma matriz visual validada para loading/erro/sucesso em todas as telas. `app/_layout.tsx:55-71` cobre apenas erro/loading global. | Ecrãs podem parecer inacabados ou não explicar falhas de SQLite, importação e notificações. | P2 |
| VIS-006 | Responsividade | Não foi possível executar snapshots em dimensões diferentes. Há textos grandes e layouts com dimensões fixas, por exemplo `app/ajustes.tsx:373-382` e `src/ui/components/ScreenHeader.tsx:54`. | Risco não medido de truncamento, overflow e colisão com teclado/safe area em ecrãs pequenos. | P2 |
| VIS-007 | Conteúdo e codificação | Vários ficheiros/output exibem sequências como `Ã§`, `Ã¡`, `â€”` e `â€¦` no conteúdo lido (`app/onboarding.tsx:70-79`, entre outros). | Se estes bytes chegarem ao bundle, a experiência em português fica visualmente defeituosa e pouco profissional. | P1 |

## Pontos positivos observados

- Existe uma tentativa clara de centralização em `src/ui/theme.ts` e `src/ui/design/tokens.ts`.
- A barra de abas tem targets acessíveis e animação de seleção (`app/(tabs)/_layout.tsx:97-144`).
- Existem componentes reutilizáveis para painéis, botões, chips, toasts, sheets, progresso e moeda.
- O layout global tem estados explícitos de erro de base de dados e loading (`app/_layout.tsx:55-71`).

## Recomendações

1. Definir uma única fonte de tema e migrar as telas restantes antes de polir detalhes.
2. Atualizar/remover screenshots e referências que já não representam o produto.
3. Substituir cores hardcoded por tokens sem alterar o comportamento financeiro.
4. Criar uma matriz visual por rota, estado e dimensão (pequena/grande; claro/escuro).
5. Validar no Android/iOS real os modais, teclado, safe area, scroll e barra inferior.

