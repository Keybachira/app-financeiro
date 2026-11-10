# Meu Kumbo — Roadmap final para entrega

Data: 2026-11-09

## Estimativa de conclusão

Estimativa atual: **72%**.

Metodologia: 40% arquitetura/persistência (34% concluído), 35% funcionalidades de produto (28% concluído), 25% UI/UX/release (10% concluído). A percentagem mede evidência de implementação integrada e validada; código existente sem teste de fluxo não recebe pontuação integral. Não é uma métrica de linhas de código.

## Já concluído com evidência

- SQLite v2, migrations, foreign keys e constraints: `verify:schema` passou 35/35.
- Domínio financeiro, datas, dinheiro, metas, dívidas, projetos, salários, categorias e recorrência: suites automatizadas verdes.
- Backup JSON/CSV, parsing e validação estrutural: testes existentes verdes.
- TypeScript estrito: `npm.cmd run typecheck` exit 0.
- CRUDs e ecrãs principais existem e usam repositórios reais; `USE_SAMPLE_DATA = false`.
- PIN, módulos, preferências, dashboard com dados reais e aliases de compatibilidade estão implementados em código.

## Fase 0 — bloqueadores P0

Critério de saída: nenhum caso de edição/apagamento/undo de movimento ligado deixa saldo, pagamento ou progresso divergente.

- [x] Corrigir a política de movimentos automáticos ligados: alteração de tipo e apagar pela tela genérica estão bloqueados.
- [x] Adicionar regressão para alteração de tipo e apagar movimento automático.
- [ ] Adicionar testes de integração para dívida, projeto e conta fixa: criar pagamento, editar movimento, apagar, desfazer e recalcular dashboard.
- Verificar importação/restauração mantendo todas as ligações e invariantes.

## Fase 1 — release funcional P1

Critério de saída: fluxos principais executados num development build Android e iOS, com evidência gravada.

- Criar testes E2E de onboarding, tabs, criar/editar/apagar movimento, metas, dívidas, projetos, contas, backup e retorno.
- Validar notificações: permissão, denied, unavailable, agendamento, abertura por toque, reagendamento ao voltar à app, Android 13+ e iOS.
- Validar exportar/partilhar/importar/replace/merge em aparelho real, incluindo ficheiro inválido e falha de armazenamento.
- Consolidar rotas/aliases e confirmar deep links/back stack.
- Adicionar lint e build de produção como gates; resolver o build web/native que não teve conclusão observável.

## Fase 2 — convergência visual P1/P2

Critério de saída: todas as rotas têm o mesmo tema, escala tipográfica, espaçamento, estados e navegação, com screenshots comparativos.

- Migrar metas, dívidas, projetos, salário, contas fixas, notificações, backup, segurança e onboarding para o sistema visual escolhido.
- Escolher uma fonte única entre `src/ui/theme.ts` e `data.ts`; remover cores hardcoded.
- Atualizar screenshots/documentação para o estado real.
- Testar dimensões pequenas/grandes e claro/escuro; validar teclado, safe area, sheets, modais e scroll.

## Fase 3 — acabamento P2/P3

Critério de saída: sem texto truncado, estados vazios/erro/sucesso compreensíveis, acessibilidade básica e feedback consistente.

- Corrigir/confirmar codificação UTF-8 em todos os textos.
- Persistir ou remover a recolha de idade no onboarding.
- Melhorar relatório de conflitos no merge de backup.
- Rever labels acessíveis, targets, contraste e reduced motion.

## Matriz de entrega

| Área | Estado | Próxima condição de conclusão |
|---|---|---|
| Dashboard | Implementado, não E2E-validado | Atualiza após cada operação e passa snapshots |
| Movimentos | Parcial; P0 | Invariantes de pagamentos e fluxo E2E |
| Metas/dívidas/projetos | CRUD implementado, integração parcial | E2E + movimentos ligados consistentes |
| Salário | Implementado, sem teste real | Lançamento idempotente comprovado em lifecycle |
| Contas fixas | Parcial | Pagamento, histórico e notificação em device |
| Estatísticas | Implementado na lógica, UI não validada | Períodos/vazio/gráficos verificados |
| Notificações | Parcial por limitação de runtime | Development builds Android/iOS |
| Backup | Camada funcional, UI/device pendentes | Round-trip e falhas testados |
| Segurança/onboarding | Parcial | Lifecycle, persistência e UX final validados |
| Design system | Parcial | Uma fonte de tema e todas as telas migradas |

## Ordem recomendada dos cinco maiores problemas

1. Corrigir a divergência entre movimentos ligados e pagamentos (P0).
2. Bloquear/definir edição e apagamento de movimentos automáticos (P0).
3. Criar E2E e gates de release para substituir confiança baseada apenas em unit tests (P1).
4. Validar notificações, backup e navegação em development builds reais (P1).
5. Concluir a migração visual e eliminar os dois sistemas de tema/screenshots desatualizados (P1/P2).

