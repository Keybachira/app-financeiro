# Plano técnico --- App de finanças pessoais

## 1. Visão do produto

Aplicação pessoal de finanças para Android e iOS, construída com Expo e
React Native, com armazenamento local em SQLite e valores em Kwanzas
(AOA). A aplicação funciona sem conta nem servidor.

O produto reúne registo de receitas e despesas, metas de poupança,
dívidas, projetos com pagamentos, salário, contas fixas, resumo mensal e
ferramentas locais de cópia e recuperação de dados.

## 2. Princípios

-   **Local primeiro:** os dados ficam no dispositivo. Não existe conta
    nem servidor.
-   **Uma fonte de verdade:** SQLite guarda os registos; saldos,
    progresso, estados e previsões são calculados.
-   **Registo rápido:** o registo de um movimento deve exigir poucos
    passos.
-   **Uso com uma mão:** ações principais ficam acessíveis na metade
    inferior do ecrã.
-   **Integridade:** operações que alterem mais de uma tabela são
    executadas numa transação.
-   **Sem cópia na nuvem:** exportação e importação são feitas por
    ficheiros locais partilhados pelo sistema.
-   **Sem relatório HTML:** a aplicação não gera relatórios HTML nem usa
    impressão para relatórios.

## 3. Decisões técnicas

  -----------------------------------------------------------------------
  Tema                                Decisão
  ----------------------------------- -----------------------------------
  Plataforma                          Expo + React Native

  Linguagem                           TypeScript

  Moeda                               Kwanzas (AOA), valores inteiros sem
                                      casas decimais

  Datas                               Texto `YYYY-MM-DD`, sem hora nem
                                      fuso

  IDs                                 UUID em texto

  Base de dados                       `expo-sqlite`, com
                                      `PRAGMA foreign_keys = ON`

  Navegação                           `expo-router`, com 4 separadores:
                                      Início, Metas, Dívidas e Projetos

  Estado                              Hooks e queries; Zustand apenas
                                      para estado de UI quando necessário

  Idioma e formato                    Português de Angola; exemplo
                                      `400 000 Kz`

  Recorrência                         Apenas mensal na primeira versão

  Backup                              Exportação/importação local em JSON
                                      e CSV de movimentos

  Relatórios                          Resumos e gráficos dentro da
                                      aplicação; sem exportação HTML
  -----------------------------------------------------------------------

## 4. Arquitetura

``` text
UI (ecrãs e componentes)
        ↓
Hooks de funcionalidades
(useMovements, useGoals, useDebts, useProjects, useBills, useMonthSummary)
        ↓
Repositórios (SQL e transações)
        ↓
SQLite

Domínio (funções puras, sem React nem SQL)
        ↑
Usado pelos hooks
```

Regras de arquitetura:

-   A interface não executa SQL diretamente.
-   O domínio não importa React, Expo nem SQLite e é testado
    isoladamente.
-   Operações que afetam mais de uma tabela usam transações.
-   Regras de cálculo ficam em funções de domínio; os resultados
    derivados não são guardados como factos independentes na base de
    dados.

## 5. Estrutura de pastas

``` text
app/
  _layout.tsx
  (tabs)/
    _layout.tsx
    index.tsx                 # Início
    goals.tsx                 # Metas
    debts.tsx                 # Dívidas
    projects.tsx              # Projetos
  movement/
    new.tsx
    [id].tsx
  goal/
    new.tsx
    [id].tsx
  debt/
    new.tsx
    [id].tsx
  project/
    new.tsx
    [id].tsx
  bills/
    index.tsx
    new.tsx
  salary.tsx
  backup.tsx
  settings.tsx

src/
  db/
    client.ts
    migrations.ts
  domain/
    money.ts
    dates.ts
    balance.ts
    goalMath.ts
    debtStatus.ts
    projectMath.ts
    salary.ts
    bills.ts
    categoryHints.ts
    quickPicks.ts
  repos/
    movements.ts
    goals.ts
    debts.ts
    projects.ts
    bills.ts
    settings.ts
    backup.ts
  features/
    movements/
    goals/
    debts/
    projects/
    bills/
    salary/
    backup/
  ui/
    theme.ts
    components/
```

A estrutura não inclui serviços de sincronização ou armazenamento na
nuvem, nem gerador de relatório HTML.

## 6. Modelo de dados

### Movimentos

``` sql
CREATE TABLE movements (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('income','expense')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  note TEXT,
  bill_id TEXT REFERENCES bills(id) ON DELETE SET NULL,
  project_payment_id TEXT
);

CREATE INDEX idx_mov_date ON movements(date);
```

### Metas e operações de metas

``` sql
CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  target INTEGER NOT NULL CHECK (target > 0),
  deadline TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  archived_at TEXT
);

CREATE TABLE goal_ops (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('deposit','withdraw')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  date TEXT NOT NULL
);

CREATE INDEX idx_goal_ops_goal ON goal_ops(goal_id);
```

### Dívidas e pagamentos

``` sql
CREATE TABLE debts (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('owe','owed')),
  party TEXT NOT NULL,
  total INTEGER NOT NULL CHECK (total > 0),
  loan_date TEXT NOT NULL,
  due_date TEXT,
  note TEXT
);

CREATE TABLE debt_payments (
  id TEXT PRIMARY KEY,
  debt_id TEXT NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  date TEXT NOT NULL,
  movement_id TEXT REFERENCES movements(id) ON DELETE SET NULL
);

CREATE INDEX idx_debt_pay_debt ON debt_payments(debt_id);
```

### Projetos e pagamentos

``` sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  client TEXT,
  total INTEGER NOT NULL CHECK (total > 0),
  due_date TEXT,
  created_at TEXT NOT NULL,
  delivered_at TEXT,
  note TEXT
);

CREATE TABLE project_payments (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  date TEXT NOT NULL,
  movement_id TEXT REFERENCES movements(id) ON DELETE SET NULL
);

CREATE INDEX idx_proj_pay_proj ON project_payments(project_id);
```

### Contas fixas e pagamentos

``` sql
CREATE TABLE bills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  amount INTEGER NOT NULL CHECK (amount > 0),
  day_of_month INTEGER NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
  remind_days_before INTEGER NOT NULL DEFAULT 1,
  category TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE bill_payments (
  id TEXT PRIMARY KEY,
  bill_id TEXT NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  paid_on TEXT NOT NULL,
  amount INTEGER NOT NULL,
  movement_id TEXT REFERENCES movements(id) ON DELETE SET NULL,
  UNIQUE (bill_id, month)
);
```

### Sugestões de categoria e definições

``` sql
CREATE TABLE category_hints (
  keyword TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  uses INTEGER NOT NULL DEFAULT 1,
  last_used TEXT NOT NULL
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

As definições podem incluir `monthly_limit`, `salary_amount`,
`salary_day`, `salary_adjust_business_day`, `salary_auto_income` e
`last_salary_month`.

### Migrações

As migrações usam `PRAGMA user_version`. Cada migração é numerada,
executada numa transação e só atualiza a versão se terminar com sucesso.

## 7. Regras de domínio

### Metas

-   `guardado = soma dos depósitos − soma dos levantamentos`.
-   `progresso = min(guardado / alvo, 1)`.
-   `poupar por mês = ceil((alvo − guardado) / max(1, meses até ao prazo))`.
-   O ritmo compara o valor guardado com o progresso linear esperado
    entre a criação e o prazo.
-   A meta fica concluída quando `guardado >= alvo`.
-   Se um levantamento fizer o valor guardado cair abaixo do alvo, a
    meta reabre.
-   O dinheiro de metas concluídas continua em "Reservado" até ser
    levantado ou a meta ser arquivada.

### Dívidas

-   `pago = soma dos pagamentos`; `falta = total − pago`.
-   Estado: falta igual a zero → Liquidado; caso contrário, vencimento
    anterior a hoje → Atrasado; senão → Em aberto.
-   O resumo mostra separadamente o total que devo e o total que me
    devem.

### Projetos

-   `recebido = soma dos pagamentos`; `falta = total − recebido`.
-   `percentagem = round(recebido / total × 100)`.
-   A etiqueta mostra "Por receber" a 0%, "N% pago" entre 1% e 99% e
    "Pago" a 100%.
-   "A receber" soma o valor em falta dos projetos ativos.
-   O pagamento de um projeto cria uma receita na categoria "Projetos"
    quando a opção correspondente estiver ativa.

### Salário

-   A data usa `salary_day`; em meses mais curtos, usa o último dia do
    mês.
-   Se `salary_adjust_business_day` estiver ativo, sábado ou domingo
    recua para a sexta-feira anterior.
-   O próximo salário é a primeira data igual ou posterior a hoje; se a
    data deste mês já passou, usa o mês seguinte.
-   Se `salary_auto_income` estiver ativo, a aplicação lança a receita
    uma vez por mês quando a data do salário chega, controlada por
    `last_salary_month`.

### Contas fixas

-   O próximo vencimento usa o dia configurado do mês; se a conta já
    tiver pagamento registado nesse mês, passa para o mês seguinte.
-   "Pagar" cria um movimento de despesa e um registo em
    `bill_payments`, na mesma transação.
-   `UNIQUE (bill_id, month)` impede pagamentos duplicados no mesmo mês.
-   A notificação local é agendada com `expo-notifications`, conforme
    `remind_days_before`.
-   "Por pagar este mês" soma as contas ativas sem pagamento registado
    no mês.

### Saldo e orçamento

``` text
Saldo do mês = receitas − despesas − (depósitos − levantamentos em metas)
Reservado em metas = soma do valor guardado nas metas não arquivadas
Podes gastar por dia = (limite − gasto do mês − contas fixas por pagar)
                      / dias até ao próximo salário
```

Se o valor disponível por dia for negativo, a aplicação mostra zero e o
aviso "Já passaste o limite".

## 8. Registo rápido

-   **Categoria lembrada:** ao guardar um movimento, a nota é
    normalizada (minúsculas e sem acentos) e usada para atualizar
    `category_hints`. A sugestão é sempre editável.
-   **Movimentos rápidos:** atalhos para o último movimento e os dois
    pares nota/valor mais frequentes nos últimos 60 dias. Um toque
    regista com a data de hoje.
-   **Teclado de valores:** teclado numérico próprio com tecla `000`, se
    mantido na implementação.
-   **Desfazer:** depois de guardar ou apagar, apresentar "Desfazer"
    durante cerca de cinco segundos. A operação inversa deve preservar a
    integridade dos registos relacionados.
-   **Data:** hoje por defeito, com opções para ontem e outra data.

## 9. Navegação e ecrãs

A barra inferior contém quatro separadores. Ecrãs de criação e detalhe
abrem como modais ou páginas empilhadas.

  -----------------------------------------------------------------------
  Ecrã                                Conteúdo
  ----------------------------------- -----------------------------------
  Início                              Saldo do mês, reservado, limite,
                                      próximo salário, valor diário
                                      disponível, atalhos para contas
                                      fixas, salário, relatório e
                                      categorias, gráfico diário, últimos
                                      movimentos, novo movimento e acesso
                                      a backup

  Metas                               Total reservado, cartões com
                                      progresso, ritmo e metas concluídas

  Dívidas                             Totais "Devo" e "Devem-me",
                                      filtros, estado e pagamentos

  Projetos                            Total a receber, valor recebido,
                                      percentagem paga e projetos
                                      concluídos

  Salário                             Valor, dia, ajuste ao dia útil,
                                      lançamento como receita e
                                      pré-visualização da data

  Contas fixas                        Valor por pagar no mês, listas por
                                      vencimento/estado e ação "Pagar"

  Novo movimento                      Despesa/receita, valor, nota,
                                      categoria sugerida, atalhos, data,
                                      teclado e guardar

  Backup                              Exportar e importar ficheiros
                                      locais

  Definições                          Limite mensal e outras
                                      configurações existentes
  -----------------------------------------------------------------------

Os detalhes de metas, dívidas e projetos mostram os registos e a ação
principal correspondente.

## 10. Design system

Estilo: azul-marinho escuro com vidro, inspirado em aplicações bancárias
modernas.

  -------------------------------------------------------------------------
  Token                   Uso                     Valor
  ----------------------- ----------------------- -------------------------
  `bg`                    Fundo                   Degradé `#3F78F2` →
                                                  `#1B3A9C` → `#0B1538` →
                                                  `#070C24`

  `panel`                 Cartões                 Degradé `#1A2654` →
                                                  `#101839`, contorno
                                                  `rgba(255,255,255,.07)`

  `glass`                 Cartões de destaque     Degradé `#4F83F5` →
                                                  `#3B6EF0` → `#2A4FC4`

  `primary`               Botões e separador      Degradé `#6B9BFF` →
                          ativo                   `#2F5FE0`

  `accent`                Receitas, progresso e   `#5B8DFF` e `#8DB4FF`
                          ícones                  

  `warn`                  Atrasos e limite        `#FFB547`
                          excedido                

  `text`                  Texto principal         `#FFFFFF`

  `textMuted`             Texto secundário        `#9AA6C9`

  `hairline`              Divisórias              `rgba(255,255,255,.12)`
  -------------------------------------------------------------------------

-   **Tipografia:** DM Sans. Saldo 40 px bold; títulos 28; corpo 16;
    texto secundário 13. Números com `fontVariant: ['tabular-nums']`.
    Nos números grandes, "Kz" tem tamanho menor e opacidade reduzida.
-   **Espaçamento:** escala de 4; margem lateral 16; cartões com raio 20
    e cartões de destaque com raio 24.
-   **Toque:** áreas mínimas de 44×44; botão principal com 56 de altura.
-   **Ícones:** ícones de linha, espessura 2 px, cantos arredondados,
    com `lucide-react-native`.
-   **Acessibilidade visual:** estados são apresentados por texto além
    da cor.
-   **Gradientes e vidro:** `expo-linear-gradient` para gradientes e
    `expo-blur` para a barra inferior. A trama de linhas pode ser uma
    imagem PNG sobreposta.

## 11. Componentes

`GlassCard`, `Panel`, `MoneyText`, `ProgressBar`, `ProgressRing`,
`StatusChip`, `IconTile`, `QuickAction`, `SegmentedControl`,
`AmountKeypad`, `CategorySuggestChip`, `QuickChips`, `DayChips`,
`Switch`, `TabBar`, `FAB`, `Toast` com "Desfazer" e `ConfirmSheet`.

## 12. Fluxos críticos

-   **Depositar numa meta:** validar valor maior que zero, inserir em
    `goal_ops` e marcar conclusão se o valor guardado atingir o alvo.
-   **Levantar de uma meta:** validar que o valor não excede o montante
    guardado; reabrir a meta se o total ficar abaixo do alvo.
-   **Pagamento de dívida ou projeto:** validar que o valor não excede o
    montante em falta; inserir o movimento correspondente e o pagamento
    na mesma transação.
-   **Editar pagamento ligado:** atualizar o movimento na mesma
    transação.
-   **Apagar pagamento ligado:** avisar e apagar os dois registos
    relacionados.
-   **Apagar movimento ligado:** avisar; o pagamento permanece registado
    e fica sem ligação ao movimento (`ON DELETE SET NULL`).
-   **Pagar conta fixa:** inserir movimento e pagamento na mesma
    transação; recusar se já estiver paga no mês.
-   **Salário automático:** ao abrir a aplicação, verificar a data e
    lançar uma única receita por mês quando a regra estiver ativa.
-   **Apagar meta com saldo:** apresentar aviso de que o dinheiro
    reservado volta ao saldo do mês.

## 13. Exportação e importação local

O sistema de backup funciona apenas com ficheiros locais, sem cópia na
nuvem.

Formato JSON:

``` json
{
  "schemaVersion": 3,
  "exportedAt": "2026-10-14",
  "settings": {},
  "movements": [],
  "goals": [],
  "goalOps": [],
  "debts": [],
  "debtPayments": [],
  "projects": [],
  "projectPayments": [],
  "bills": [],
  "billPayments": [],
  "categoryHints": []
}
```

-   Exportar JSON com `expo-file-system` e `expo-sharing`.
-   Exportar CSV apenas de movimentos, com as colunas
    `data,tipo,valor,categoria,nota`.
-   Validar tipos, valores positivos e referências antes de importar.
-   Executar a importação numa transação; em caso de falha, não deixar
    dados parcialmente importados.
-   Chaves ausentes em backups antigos assumem listas vazias.
-   **Juntar:** ignorar IDs repetidos.
-   **Substituir:** apagar os dados existentes e importar o ficheiro na
    mesma transação.
-   Se `schemaVersion` for superior à versão suportada pela aplicação,
    recusar a importação e pedir atualização.
-   Não implementar sincronização, armazenamento ou cópia na nuvem.
-   Não gerar relatórios HTML nem usar `expo-print` para relatórios.

## 14. Testes

### Domínio

Testes obrigatórios para:

-   Formatação de Kwanzas.
-   Cálculo de poupança mensal.
-   Estado de progresso de metas: adiantada, atrasada e no ritmo.
-   Estado das dívidas.
-   Percentagem paga de projetos.
-   Cálculo de data do salário, incluindo fim de semana e meses com
    diferentes durações.
-   Próximo vencimento de conta fixa.
-   Valor disponível para gastar por dia.
-   Sugestão de categoria e movimentos rápidos.

### Casos-limite

-   Meta sem prazo ou com prazo no passado.
-   Meta concluída e depois reduzida por levantamento.
-   Dívida paga no dia do vencimento.
-   Salário configurado para dia 31 em fevereiro.
-   Conta fixa já paga no mês.
-   Projeto com 100% recebido.

### Repositórios e transações

-   Testar SQLite em memória quando possível.
-   Verificar a atomicidade de pagamento + movimento.
-   Confirmar que uma conta fixa não pode ser paga duas vezes no mesmo
    mês.
-   Simular uma importação que falha a meio e confirmar que não deixa
    dados parciais.

### Verificação manual

-   Importar um backup real.
-   Fechar a aplicação durante uma operação.
-   Rodar o ecrã.
-   Verificar a interface com tamanho de letra grande.

## 15. Fases de construção

  -----------------------------------------------------------------------
  Fase                    Entrega                 Critério de conclusão
  ----------------------- ----------------------- -----------------------
  1                       Projeto Expo, Expo      Navegação funcional com
                          Router, quatro          o tema aplicado
                          separadores vazios,     
                          tema e componentes base 

  2                       SQLite, migrações e     A aplicação cria as
                          `settings`              tabelas e mantém
                                                  `user_version`

  3                       Funções de domínio e    Testes de domínio
                          testes                  passam

  4                       Início, movimentos,     É possível registar e
                          limite, gráfico,        corrigir movimentos com
                          pesquisa, edição,       rapidez
                          registo rápido,         
                          categoria lembrada e    
                          desfazer                

  5                       Backup JSON/CSV e       Exportar, apagar e
                          importação local        importar recupera os
                                                  dados corretamente

  6                       Metas e valor reservado Depósito, levantamento,
                          no Início               conclusão e reabertura
                                                  funcionam

  7                       Dívidas sem ligação aos Pagamentos parciais e
                          movimentos              estados automáticos
                                                  funcionam

  8                       Ligação entre           Editar/apagar pagamento
                          pagamentos de dívidas e ou movimento respeita
                          movimentos              as regras

  9                       Projetos e ligação      Percentagem paga e
                          opcional a receitas     total a receber estão
                                                  corretos

  10                      Salário, próximo        Data correta em fins de
                          salário e lançamento    semana e apenas um
                          automático              lançamento por mês

  11                      Contas fixas, valor     Pagamento cria despesa,
                          diário disponível e     lembrete funciona e não
                          notificações            há duplicação

  12                      Segurança local, ícone, Build instalável e
                          splash screen e build   testada no telemóvel
                          EAS                     
  -----------------------------------------------------------------------

## 16. Decisões ainda por fechar

-   **Categorias:** lista inicial fixa --- Alimentação, Transporte,
    Casa, Saúde, Lazer, Dívidas, Projetos e Outros --- com edição
    posterior.
-   **Metas após o prazo:** continuam ativas e mostram um aviso.
-   **Contas/carteiras:** decidir se serão necessárias antes da fase 2,
    porque alteram o modelo de dados.
-   **Cobranças por WhatsApp:** não incluídas no âmbito atual.
-   **Nuvem:** excluída definitivamente; manter apenas backup manual
    local.
-   **Relatórios HTML:** excluídos definitivamente.
