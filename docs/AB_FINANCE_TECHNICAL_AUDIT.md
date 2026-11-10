# Meu Kumbo — Auditoria técnica, SQLite e navegação

Data: 2026-11-09

Atualização pós-auditoria: proteção de movimentos ligados, re-agendamento ao voltar à app, validação de IDs duplicados em importação e unificação das cores legadas com os tokens ativos foram implementados.

## Arquitetura observada

- Expo 57, React Native 0.86, TypeScript 6, Expo Router e `expo-sqlite`.
- SQLite local `financas.db`, migrations v1/v2 em `src/db/migrations.ts`.
- Repositórios síncronos (`getAllSync`, `runSync`, `withTransactionSync`) consumidos por hooks React e invalidados por `dataVersion`.
- Sem backend, autenticação, cloud ou sincronização.
- `migrar-design/` e `data.ts` permanecem como referência/compatibilidade; `data.ts` declara store demo mas `USE_SAMPLE_DATA = false` (`data.ts:1-16`).

## Pontos fortes confirmados

1. Migrations versionadas, transacionais e idempotentes.
2. Foreign keys ativadas em `src/db/client.ts:5`.
3. Cascades/SET NULL explicitamente testados pelo script de schema.
4. Constraints para valores positivos, tipos de movimento, datas de conta e pagamento mensal duplicado.
5. Backup com validação de tipos, datas, referências e importação transacional.
6. TypeScript estrito e suite automatizada verde no estado auditado.

## Problemas técnicos

| ID | Área | Evidência | Impacto | Prioridade |
|---|---|---|---|---|
| TECH-001 | Integridade financeira | A relação SQLite continua a usar `SET NULL`, mas `deleteMovement` agora bloqueia origens automáticas e os módulos de origem continuam a apagar pagamento + movimento na mesma transação. | O caminho de uso normal deixa de criar divergência; imports antigos/corrupção ainda exigem auditoria. | Resolvido no código |
| TECH-002 | Integridade de tipo | `updateMovement` agora rejeita mudança de `type` quando `origin !== manual`; teste de regressão cobre o caso. | Sem alteração de semântica entre dívida/projeto/conta e saldo global pela UI. | Resolvido no código |
| TECH-003 | Observabilidade de falhas | `useAutoSalary` captura qualquer erro e continua (`src/features/salary/useSalary.ts:96-98`); `useNotificationSetup` também ignora falhas no reagendamento (`:22-24`). | Falhas podem ficar silenciosas, sobretudo em primeira execução ou runtime nativo incompatível. | P1 |
| TECH-004 | Release/CI | `package.json` não contém lint, build, E2E ou integração; `expo export --platform web` não terminou durante a auditoria. | Não há gate de release que prove bundle, navegação e compatibilidade. | P1 |
| TECH-005 | Notificações/configuração | `app.json` combina plugin com `enableBackgroundRemoteNotifications: false` e `extra.enableBackgroundRemoteNotifications: true`; permissões Android e exact alarm estão declaradas sem validação em versões OS. | Configuração pode divergir entre builds e comportamento esperado. | P2 |
| TECH-006 | Estado/documentação | `REDESIGN_IMPLEMENTATION_REPORT.md` regista 14 suites/94 testes (`:26-29`), mas o estado atual tem 17/127; `REDESIGN_FUNCTIONAL_INVENTORY.md` ainda classifica a maioria das telas como parcial. | Documentação de release não é uma fotografia confiável sem atualização. | P2 |
| TECH-007 | Compatibilidade de tema | `data.ts` ainda expõe a forma legada, mas agora deriva as cores de `src/ui/theme.ts` em vez de manter uma paleta independente. | A fonte de cor está unificada; a migração estrutural dos estilos permanece pendente. | P2 |

## Modelo SQLite

O schema é coerente para a maior parte dos CRUDs: `movements`, `goals/goal_ops`, `debts/debt_payments`, `projects/project_payments`, `bills/bill_payments`, `category_hints` e `settings`. O principal risco não é a ausência de tabela, mas a semântica de ligação entre movimento e pagamento: o desenho permite que o pagamento sobreviva quando o movimento é apagado.

## Navegação mapeada

Rotas principais: `/(tabs)/index`, `/(tabs)/movimentos`, `/(tabs)/stats`, `/(tabs)/settings`. Operações: `/movement/new`, `/movement/[id]`, `/goal/*`, `/debt/*`, `/project/*`, `/bill/*`, `/salary`, `/backup`, `/lock`, `/onboarding`, `/notificacoes`, `/mais`, `/inteligencia`.

`app/(tabs)/_layout.tsx:36-41` mantém `goals`, `debts`, `projects` registados no Tabs, embora a barra personalizada só desenhe quatro itens. Há aliases para compatibilidade em `app/novo-movimento.tsx`, `app/novo-item.tsx`, `app/metas.tsx`, `app/dividas.tsx`, `app/projetos.tsx` e `app/fixas.tsx`. A existência de rotas foi confirmada por inspeção de ficheiros; acessibilidade e back stack não foram comprovadas por E2E.

## Segurança e dados

PIN, bloqueio e proteção de captura são locais; não há proteção de base SQLite por chave/keystore demonstrada no código auditado. O backup é exportável por definição, logo o risco de exposição do ficheiro continua a ser responsabilidade do utilizador. Não foi feita auditoria de dispositivo, permissões, armazenamento externo ou restauração após corrupção.

## Recomendações técnicas

1. Definir invariantes para movimentos ligados e testar edit/delete/undo em transação.
2. Separar ou proteger movimentos automáticos contra alteração de tipo e apagamento livre.
3. Adicionar CI com typecheck, lint, unit/integration, build e E2E mínimo.
4. Centralizar tema e remover dependência de store/estilos legados.
5. Validar development builds Android/iOS, incluindo permissões, background, restore e lifecycle.

