# Meu Kumbo — Relatório de reconstrução

Data: 2026-11-07

## Estado atual

Reconstrução em execução. A camada financeira SQLite foi preservada; a apresentação começou a ser substituída pela referência `migrar-design/ab-finance.html`.

## Implementado nesta fase

- Inventário funcional em `docs/REDESIGN_FUNCTIONAL_INVENTORY.md`.
- Tokens centralizados em `src/ui/design/tokens.ts`.
- Componentes base `AppHeader`, `SectionHeader` e `NotificationIndicator`.
- Dashboard refeito com saudação, header, cartões sobrepostos, saldo real, receitas/despesas reais, ocultação de valores, quick actions, limite e movimentos reais.
- Navegação inferior alinhada à referência: Início, Movimentos, Estatísticas e Ajustes.
- Painéis, FABs, ações rápidas e cores principais alinhados ao sistema visual da referência.
- `@expo/vector-icons` adicionado para permitir a reutilização direta das páginas visuais do protótipo na próxima fase.
- Metadados de splash/tema do `app.json` alinhados à nova identidade.
- Auditoria/matriz de execução atualizada no inventário.
- Entrada suave global dos conteúdos de `Screen`, com respeito a `reduceMotion`.

## Funcionalidades preservadas

Movimentos, metas, dívidas, projetos, salário, contas fixas, limites, estatísticas, backup, PIN, bloqueio, módulos e SQLite continuam a usar os hooks e repositórios existentes.

## Validação

- `npm.cmd run typecheck`: aprovado.
- `npm.cmd test -- --runInBand`: 14 suites e 94 testes aprovados.

## Ainda pendente antes de declarar concluído

- Migrar visualmente todos os ecrãs de metas, dívidas, projetos, salário, contas fixas, backup, segurança, notificações e onboarding para o markup/estados da referência.
- Reproduzir as animações do HTML: entrada escalonada, sino, push visual, progressos e bottom sheets.
- Consolidar aliases de rotas sem alterar deep links existentes.
- Completar tema escuro real e reduced motion.
- Validar em development build Android e iOS.

## Checklist de conclusão

- [x] Inventário funcional e matriz de execução.
- [x] Dashboard com dados reais e navegação principal.
- [x] Tokens e componentes base centralizados.
- [x] Entrada animada global com reduced motion.
- [ ] Todos os ecrãs secundários visualmente equivalentes ao protótipo.
- [ ] Todos os bottom sheets e microinterações do HTML.
- [ ] Validação funcional Android/iOS em development build.
- [ ] Validação visual comparativa em diferentes dimensões.
- [ ] Notificações reais validadas fora do Expo Go.
