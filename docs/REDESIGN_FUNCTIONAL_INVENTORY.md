# Meu Kumbo — Inventário funcional para reconstrução

Data: 2026-11-07  
Referência visual: `migrar-design/ab-finance.html` e `migrar-design/files/*.tsx`

## Baseline

- Stack: Expo 57, React Native 0.86, TypeScript, Expo Router, SQLite local.
- `npm.cmd test -- --runInBand`: 14 suites, 94 testes aprovados.
- `npm.cmd run typecheck`: aprovado antes da reconstrução visual.
- `npm.cmd run verify:schema`: 35 verificações aprovadas, 0 falhas no baseline documentado.
- Dados: offline-first, sem autenticação obrigatória, sem backend e sem sincronização cloud.

## Rotas atuais

### Navegação principal

- `/(tabs)/index`: dashboard atual.
- `/(tabs)/movimentos`: lista mensal e pesquisa.
- `/(tabs)/stats`: estatísticas.
- `/(tabs)/settings`: ajustes.

### Operações e detalhes

- `/movement/new` e `/movement/[id]`: criação/edição de movimentos.
- `/goal/new` e `/goal/[id]`: metas e operações de depósito/levantamento.
- `/debt/new` e `/debt/[id]`: dívidas e pagamentos.
- `/project/new` e `/project/[id]`: projetos e recebimentos.
- `/bill`, `/bill/new`: contas fixas e pagamentos.
- `/salary`: salário recorrente.
- `/backup`: exportação/importação/restauração.
- `/settings`: limite mensal e segurança/PIN.
- `/lock`: bloqueio local.
- Rotas de acesso secundário: `/mais`, `/notificacoes`, `/onboarding`, `/fixas`, `/metas`, `/dividas`, `/projetos`.

## Funcionalidades preservadas

| Área | Operações existentes | Fonte |
| --- | --- | --- |
| Movimentos | Criar, editar, apagar, pesquisar, categorias, notas, datas, receitas/despesas | `src/repos/movements.ts`, `src/features/movements/*` |
| Metas | Criar, editar, arquivar, concluir, depositar, levantar, histórico | `src/repos/goals.ts`, `src/features/goals/*` |
| Dívidas | Devo/devem-me, pagamentos parciais, estados e histórico | `src/repos/debts.ts`, `src/features/debts/*` |
| Projetos | Cliente, valor acordado, recebimentos, entrega e histórico | `src/repos/projects.ts`, `src/features/projects/*` |
| Salário | Dia, valor, ajuste de dia útil e lançamento automático | `src/features/salary/useSalary.ts`, `src/domain/salary.ts` |
| Contas fixas | Recorrência, pagamento mensal, vencimento e lembrete | `src/repos/bills.ts`, `src/features/bills/useBills.ts` |
| Limites | Limite mensal, gasto, valor diário disponível e projeção | `src/features/settings/useSettings.ts`, `src/features/movements/useMonthSummary.ts` |
| Estatísticas | Totais, evolução diária, categorias e períodos | `src/features/movements/useMonthSummary.ts`, `src/repos/movements.ts` |
| Backup | JSON, CSV, importação, merge e substituição transacional | `src/repos/backup.ts`, `src/repos/exportFile.ts` |
| Segurança | PIN, bloqueio de abertura e proteção local | `src/features/security/useLockState.ts`, `app/lock.tsx` |
| Personalização | Perfis estudante/trabalhador/freelancer/personalizado e módulos | `src/domain/modules.ts`, `src/repos/modules.ts` |

## Persistência e schema

SQLite usa `financas.db` com migrations versionadas em `src/db/migrations.ts`. As tabelas atuais são:

- `movements`, `category_hints`, `settings`;
- `goals`, `goal_ops`;
- `debts`, `debt_payments`;
- `projects`, `project_payments`;
- `bills`, `bill_payments`.

As migrations não devem ser apagadas. O redesign deve consumir os repositórios existentes e não duplicar regras financeiras na UI.

## Serviços transversais

- `expo-notifications`: lembretes locais de contas fixas; o Expo Go não oferece push remoto desde SDK 53, portanto precisa de development build para validação Android.
- `expo-file-system` e `expo-sharing`: backup e partilha local.
- `expo-screen-capture`: proteção de captura quando configurada.
- `expo-haptics`: feedback tátil.
- `expo-font`: fontes locais DMSans existentes; a referência usa Poppins, cuja integração visual deve ser tratada no design system.

## Fluxo de referência a reconstruir

- Dashboard: header menu/notificações/perfil, saudação, cartões financeiros sobrepostos, quick actions, limite diário e movimentos recentes.
- Navegação inferior: Início, Movimentos, Estatísticas e Ajustes.
- Operações rápidas: bottom sheet de movimento e formulário de itens.
- Vistas secundárias: Mais, Notificações, Metas, Dívidas, Projetos, Contas fixas e onboarding.
- Interações: entrada de listas, feedback de toque, sino com badge, bottom sheets, toasts e respeito a reduced motion.

## Problemas identificados antes da reconstrução

1. A UI de produção ainda era baseada num dashboard azul/glass anterior e não na referência HTML.
2. A pasta `migrar-design` contém páginas visuais completas, mas usa store de demonstração em memória e não os repositórios SQLite.
3. A referência possui mais microinterações que a UI nativa atual.
4. O centro de notificações nativo ainda não representa todas as notificações visuais da referência; lembretes reais estão concentrados em contas fixas.
5. O `app.json` conservava metadados de tema e splash da identidade anterior.
6. O Expo Go gera erro ao carregar `expo-notifications` para push remoto; o runtime já ganhou uma guarda, mas push real exige development build.
7. Existem aliases e rotas secundárias adicionadas durante a migração que precisam ser consolidados no fluxo final, sem perder deep links.

## Correspondência de apresentação

| Interface nova | Lógica a reutilizar |
| --- | --- |
| `BalanceCard` | `useMonthSummary`, `formatKz`, ocultação local |
| `TransactionItem/List` | `useMonthMovements`, `MovementRow`, `movement/[id]` |
| `ProgressCard` | `useGoals`, `goalMath`, `useProjects` |
| `BottomSheet` e `AmountInput` | `MovementEditor`, `AmountSheet`, `AmountKeypad` |
| `NotificationIndicator` | `useBills`, `getBillNotificationsStatus`, `notifications.ts` |
| `FloatingTabBar` | Expo Router Tabs, preservando as rotas atuais |
| `Settings/Modules` | `useModuleConfig`, `useLockState`, `useMonthlyLimit`, `useBackup` |

## Riscos e critérios de validação

- Não substituir repositórios por estado de demonstração.
- Não apagar dados quando um módulo for desativado.
- Testar criação e edição após cada substituição visual.
- Testar importação/exportação depois da troca de navegação.
- Testar notificações em development build, não somente no Expo Go.
- Validar Android e iOS em dimensões pequenas e grandes.

## Matriz de execução

| Ecrã | Estado atual | Referência | Integrações | Critério de aceitação |
| --- | --- | --- | --- | --- |
| Início | Migrado | `files/index.tsx` | `useMonthSummary`, movimentos, contas, salário | Saldo e ações reais, cartões sobrepostos, sem dados fictícios |
| Movimentos | Parcial | `files/movimentos.tsx` | `useMonthMovements`, `MovementEditor` | Filtros, grupos, pesquisa, detalhe e criação |
| Metas | Parcial | `files/metas.tsx`, `files/novo-item.tsx` | `useGoals`, `goalMath` | CRUD, depósitos, levantamentos e histórico reais |
| Dívidas | Parcial | `files/dividas.tsx`, `files/novo-item.tsx` | `useDebts` | Devo/devem-me, pagamentos parciais e estados |
| Projetos | Parcial | `files/projetos.tsx`, `files/novo-item.tsx` | `useProjects` | Cliente, recebimentos, entrega e pendências |
| Salário | Parcial | `files/ajustes.tsx` | `useSalary`, `salary.ts` | Configuração e lançamento idempotente |
| Contas fixas | Parcial | `files/fixas.tsx` | `useBills`, notificações | Pagamentos, histórico e status de lembretes |
| Estatísticas | Parcial | `files/stats.tsx` | `movements.ts` | Períodos, gráficos e categorias reais |
| Ajustes | Parcial | `files/ajustes.tsx` | módulos, PIN, limite e backup | Preferências não destroem dados |
| Notificações | Parcial | `files/notificacoes.tsx` | bills/status | Apenas fontes reais, estados vazio/erro |
| Onboarding | Parcial | `files/onboarding.tsx` | módulos/settings/PIN | Perfil inicial e personalização persistente |
| Backup | Funcional, visual pendente | HTML/fluxo existente | backup/export | Sucesso/erro confirmados e operações protegidas |
| Segurança | Funcional, visual pendente | `files/ajustes.tsx` | `useLockState` | PIN, bloqueio e captura preservados |
