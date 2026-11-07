# AB Finance — Auditoria Técnica e Funcional Completa

**Data da auditoria:** 06/11/2026  
**Repositório:** `C:\Projects\app-financeiro`  
**Branch:** `main` (commit `2f58a90f682afb4e334ce4f669f5785baf86055d`)  
**Tipo de missão:** Investigação e documentação apenas (sem alterações de código)

---

## 1. Resumo Executivo

O **AB Finance** (apresentado ao usuário como "App Financeiro") é uma aplicação móvel de finanças pessoais desenvolvida em **Expo + React Native + TypeScript**, direcionada ao mercado angolano. Armazena todos os dados localmente em **SQLite** no próprio dispositivo, funciona totalmente **offline**, não exige conta nem servidor, e usa **Kwanzas (AOA)** como moeda base com valores inteiros sem casas decimais.

O projeto está em **estado avançado de implementação**: todas as funcionalidades principais descritas no plano técnico (`plano_financas.md`) estão codificadas, com persistência real, validações de domínio, testes unitários para a camada de negócio, e um esquema de banco de dados com migrações versionadas. Não há backend, não há nuvem, não há IA.

**Pontos críticos para a Benguela TIC:** a aplicação tem ecrãs funcionais, identidade visual consistente, segurança local (PIN + bloqueio de captura de ecrã), e exportação/importação de dados. Não foi possível executar o build nem os testes neste ambiente (não foram instaladas dependências), portanto o estado de compilação não pôde ser verificado por execução direta.

---

## 2. Identidade e Propósito do AB Finance

### O que é o AB Finance
Uma aplicação móvel de finanças pessoais (mobile-first, Android e iOS) que permite ao utilizador registar receitas e despesas, gerir metas de poupança, controlar dívidas, acompanhar projetos de trabalho, configurar salário recorrente e pagar contas fixas — tudo armazenado apenas no telemóvel.

### Problema que procura resolver
Conforme documentado no `README.md` e `plano_financas.md`:
- A maioria das apps de finanças exige conta, envia dados para a nuvem e não foi pensada para a realidade angolana.
- Falta de suporte nativo a Kwanzas (AOA) e português de Angola.
- Preocupação com privacidade: dados financeiros sensíveis não devem sair do dispositivo.
- Necessidade de funcionar offline, em qualquer lugar, a qualquer hora.

### Público-alvo
Pessoas físicas em Angola (ou falantes de português de Angola) que querem controlar as finanças pessoais sem criar contas online, sem depender de internet, e com valores em Kwanzas. Inclui trabalhadores informais, freelancers (projetos), e quem precisa gerir dívidas pessoais.

### Proposta de valor
- **Privado por defeito:** sem registo, sem servidor, dados só no telemóvel.
- **Funciona sem internet:** registo e consulta em qualquer lugar.
- **Registo rápido:** teclado de valores próprio, categorias sugeridas, atalhos para movimentos frequentes.
- **Pensado para uma mão:** ações principais ao alcance do polegar.
- **Cópia de segurança local:** exportação JSON/CSV e restauração por ficheiro.

### Diferencial
| Diferencial | Evidência no código |
|---|---|
| Moeda em Kwanzas (AOA) | `src/domain/money.ts`, `plano_financas.md` secção 3 |
| Offline-first, sem conta nem servidor | `src/db/client.ts`, `expo-sqlite` apenas |
| Português de Angola | Textos da UI em PT-AO, `src/domain/dates.ts` |
| Lançamento automático de salário | `src/features/salary/useSalary.ts` |
| Contas fixas com notificações | `src/repos/bills.ts`, `expo-notifications` |
| PIN de 4 dígitos + bloqueio de captura de ecrã | `src/features/security/useLockState.ts` |
| Backup/importação JSON e CSV local | `src/repos/backup.ts`, `src/repos/exportFile.ts` |
| Nenhum dado na nuvem | `plano_financas.md`, `CONTRIBUTING.md` |