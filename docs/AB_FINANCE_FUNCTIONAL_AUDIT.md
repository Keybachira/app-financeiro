# AB Finance — Auditoria funcional

Data: 2026-11-09  
Estado avaliado: working tree atual; sem alterações realizadas durante a auditoria.

Atualização pós-auditoria: foram corrigidos os invariantes de movimentos automáticos, adicionado teste de regressão, re-agendamento ao regressar à app, validação de identificadores duplicados em backups e persistência da idade do onboarding. As limitações de validação nativa continuam explícitas.

## Verificações executadas

| Verificação | Resultado |
|---|---|
| `npm.cmd run typecheck` | Passou; exit 0 |
| `npm.cmd test -- --runInBand` | Passou; 18 suites, 129 testes |
| `npm.cmd run verify:schema` | Passou; 35 verificações, 0 falhas |
| Expo Web/Metro | Metro iniciou em `http://localhost:8081`; não houve browser controlável para validar telas/fluxos |
| Lint | Não executável: não existe script/configuração de lint no `package.json` |
| Build de produção | Não concluído: `npm.cmd run build:web` iniciou o Metro mas ficou sem conclusão observável e foi interrompido |
| Android/iOS, notificações e backup em aparelho real | Não executados neste ambiente |
| E2E/navegação/persistência UI | Não existem scripts/testes E2E; não considerados concluídos |

## Estado por módulo

| Módulo | Estado real | Evidência |
|---|---|---|
| Dashboard | Parcialmente funcional | `app/(tabs)/index.tsx` lê hooks/repositórios reais; não houve validação interativa de atualização após operação. |
| Movimentos | Parcial, risco P0 corrigido no código | CRUD e pesquisa existem em `src/repos/movements.ts`; movimentos automáticos agora não podem mudar de tipo nem ser apagados pela tela genérica. Falta validação UI/dispositivo. |
| Estatísticas | Parcial | `app/(tabs)/stats.tsx` calcula janela de 7/30 dias e vazio; falta teste UI e validação visual/real. |
| Metas | Parcial | CRUD, operações e progresso em `src/repos/goals.ts`/`useGoals.ts`; testes de domínio existem, mas não há fluxo E2E. |
| Dívidas | Parcial | Pagamentos/histórico em `src/repos/debts.ts`; a integridade quando o movimento ligado é editado/apagado não é protegida na UI. |
| Projetos | Parcial | Recebimentos e sincronização de valor/data existem; mesma limitação de movimento ligado. |
| Salário | Parcial | `useSalary.ts` faz lançamento idempotente por mês; a idade recolhida no onboarding agora é persistida, mas ainda não é usada para personalização. |
| Contas fixas | Parcial | CRUD, pagamento mensal e estado de lembrete em `src/repos/bills.ts`; entrega de notificações reais não foi testada. |
| Notificações | Parcial | Centro derivado local em `useNotificationCenter.ts`; notificações do sistema dependem do runtime nativo e development build. |
| Backup | Funcional na camada testada; UI/dispositivo pendentes | JSON/CSV, parser, referências e transação em `src/domain/backup.ts`/`src/repos/backup.ts`; picker/share/restore real não testados. |
| Segurança/PIN | Parcial | Hash/bloqueio e estado local existem; não foi validado em lifecycle real/background/screenshot protection. |
| Onboarding/configuração | Parcial | Perfil, módulos, tema, PIN e idade persistem; só existem perfis estudante/profissional no onboarding (`app/onboarding.tsx:84-100`). |

## Problemas funcionais

| ID | Módulo | Descrição e evidência | Impacto | Prioridade |
|---|---|---|---|---|
| FUNC-001 | Movimentos/dívidas/projetos/contas | Corrigido em `src/repos/movements.ts`: movimentos não manuais rejeitam mudança de tipo e apagamento; `MovementEditor` esconde apagar e orienta para o módulo de origem. Teste em `src/repos/__tests__/linkedMovementIntegrity.test.ts`. | O risco foi fechado no código; requer validação E2E para confirmar a UX. | Resolvido no código |
| FUNC-002 | Notificações | `useNotificationSetup.ts:20-24` salta agendamento no Expo Go; `notifications.ts:11-18` transforma falhas de carregamento nativo em `unavailable`. Não houve Android/iOS real, permissão, expiração ou entrega verificados. | Não é possível afirmar que lembretes são entregues ou reagendados na versão final. | P1 |
| FUNC-003 | Todos os fluxos principais | Ainda não há E2E/integration tests de navegação, CRUD UI, atualização do dashboard, backup por ficheiro ou notificações. Os 129 testes cobrem sobretudo domínio/repositórios. | Regressões de integração podem passar no CI apesar de typecheck/testes verdes. | P1 |
| FUNC-004 | Onboarding | `idade` é recolhida mas nunca guardada nem usada; a seleção final só chama `setProfile("student"|"worker")` (`app/onboarding.tsx:84-97`). | Fluxo promete personalização que não é persistida; informação recolhida é descartada. | P2 |
| FUNC-005 | Backup | `importBackup` usa `INSERT OR IGNORE` por ID (`src/repos/backup.ts:185-268`). O comportamento está documentado como “registos com o mesmo identificador são ignorados”, mas não há teste de round-trip UI nem relatório detalhado de conflitos. | Merge pode terminar “com sucesso” sem deixar claro ao utilizador quais registos foram ignorados. | P2 |
| FUNC-006 | Navegação | Existem aliases (`app/novo-movimento.tsx`, `novo-item.tsx`, `metas.tsx`, `dividas.tsx`, `projetos.tsx`, `fixas.tsx`) e rotas secundárias em Tabs; a consolidação referida nos documentos ainda está pendente. | Deep links e back stack podem variar conforme a entrada usada. | P1 |

## Classificação de conclusão

“Funcional” neste relatório significa evidência suficiente no código/testes da camada correspondente; não significa validação de release. Nenhum módulo de interface é declarado totalmente funcional sem teste de fluxo real. A camada de domínio, parser/exportação e migrations tem evidência automatizada positiva.

