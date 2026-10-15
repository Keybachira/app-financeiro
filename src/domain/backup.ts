import { isValidDate } from './dates';

export const BACKUP_SCHEMA_VERSION = 3;

/**
 * `origin` é opcional: backups criados antes da coluna continuam a ser
 * importados sem alteração de versão, porque um movimento sem origem é
 * tratado como `manual`.
 */
export type MovementBackupRow = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  note: string | null;
  bill_id: string | null;
  project_payment_id: string | null;
  origin?: string;
};

export type SettingRow = { key: string; value: string };
export type GoalRow = {
  id: string;
  name: string;
  target: number;
  deadline: string | null;
  created_at: string;
  completed_at: string | null;
  archived_at: string | null;
};
export type GoalOpRow = { id: string; goal_id: string; kind: 'deposit' | 'withdraw'; amount: number; date: string };
export type DebtRow = {
  id: string;
  kind: 'owe' | 'owed';
  party: string;
  total: number;
  loan_date: string;
  due_date: string | null;
  note: string | null;
};
export type PaymentRow = { id: string; parent_id: string; amount: number; date: string; movement_id: string | null };
export type ProjectRow = {
  id: string;
  name: string;
  client: string | null;
  total: number;
  due_date: string | null;
  created_at: string;
  delivered_at: string | null;
  note: string | null;
};
export type BillRow = {
  id: string;
  name: string;
  icon: string | null;
  amount: number;
  day_of_month: number;
  remind_days_before: number;
  category: string;
  active: number;
};
export type BillPaymentRow = {
  id: string;
  bill_id: string;
  month: string;
  paid_on: string;
  amount: number;
  movement_id: string | null;
};
export type CategoryHintRow = { keyword: string; category: string; uses: number; last_used: string };

export type BackupPayload = {
  schemaVersion: number;
  exportedAt: string;
  settings: SettingRow[];
  movements: MovementBackupRow[];
  goals: GoalRow[];
  goalOps: GoalOpRow[];
  debts: DebtRow[];
  debtPayments: PaymentRow[];
  projects: ProjectRow[];
  projectPayments: PaymentRow[];
  bills: BillRow[];
  billPayments: BillPaymentRow[];
  categoryHints: CategoryHintRow[];
};

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function backupToJson(payload: BackupPayload): string {
  return JSON.stringify(payload, null, 2);
}

export function movementsToCsv(movements: MovementBackupRow[]): string {
  const header = 'data,tipo,valor,categoria,nota';
  const lines = movements.map((movement) =>
    [
      movement.date,
      // Um ficheiro de uso português não deve escrever "expense"/"income".
      movement.type === 'income' ? 'receita' : 'despesa',
      String(movement.amount),
      movement.category,
      movement.note ?? '',
    ]
      .map(csvCell)
      .join(',')
  );
  return [header, ...lines].join('\n');
}

function csvCell(value: string): string {
  // Excel e Google Sheets tratam uma célula iniciada por = + - @ como fórmula.
  // Uma nota como "=1+1" era executada ao abrir o CSV, não mostrada. O prefixo
  // `'` força o texto.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;

  if (/["\n,]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }

  return safe;
}

export type ParsedBackup =
  | { ok: true; payload: BackupPayload }
  | { ok: false; error: string };

export function parseBackup(text: string): ParsedBackup {
  let raw: unknown;

  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Ficheiro inválido: não está em formato JSON.' };
  }

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, error: 'Ficheiro inválido: conteúdo inesperado.' };
  }

  const record = raw as Record<string, unknown>;
  const version = record.schemaVersion;

  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    return { ok: false, error: 'Ficheiro inválido: versão do backup em falta.' };
  }

  if (version > BACKUP_SCHEMA_VERSION) {
    return { ok: false, error: 'Este backup foi feito por uma versão mais recente. Atualiza a aplicação.' };
  }

  const payload: BackupPayload = {
    schemaVersion: version,
    exportedAt: typeof record.exportedAt === 'string' ? record.exportedAt : '',
    settings: [],
    movements: [],
    goals: [],
    goalOps: [],
    debts: [],
    debtPayments: [],
    projects: [],
    projectPayments: [],
    bills: [],
    billPayments: [],
    categoryHints: [],
  };

  const settings = validateRows(record.settings, 'definições', validateSetting);
  if (!settings.ok) {
    return { ok: false, error: settings.error };
  }
  payload.settings = settings.rows;

  const movements = validateRows(record.movements, 'movimentos', validateMovement);
  if (!movements.ok) {
    return { ok: false, error: movements.error };
  }
  payload.movements = movements.rows;

  const goals = validateRows(record.goals, 'metas', validateGoal);
  if (!goals.ok) {
    return { ok: false, error: goals.error };
  }
  payload.goals = goals.rows;

  const goalOps = validateRows(record.goalOps, 'operações de metas', validateGoalOp);
  if (!goalOps.ok) {
    return { ok: false, error: goalOps.error };
  }
  payload.goalOps = goalOps.rows;

  const debts = validateRows(record.debts, 'dívidas', validateDebt);
  if (!debts.ok) {
    return { ok: false, error: debts.error };
  }
  payload.debts = debts.rows;

  const debtPayments = validateRows(record.debtPayments, 'pagamentos de dívidas', validatePayment('dívida'));
  if (!debtPayments.ok) {
    return { ok: false, error: debtPayments.error };
  }
  payload.debtPayments = debtPayments.rows;

  const projects = validateRows(record.projects, 'projetos', validateProject);
  if (!projects.ok) {
    return { ok: false, error: projects.error };
  }
  payload.projects = projects.rows;

  const projectPayments = validateRows(record.projectPayments, 'pagamentos de projetos', validatePayment('projeto'));
  if (!projectPayments.ok) {
    return { ok: false, error: projectPayments.error };
  }
  payload.projectPayments = projectPayments.rows;

  const bills = validateRows(record.bills, 'contas fixas', validateBill);
  if (!bills.ok) {
    return { ok: false, error: bills.error };
  }
  payload.bills = bills.rows;

  const billPayments = validateRows(record.billPayments, 'pagamentos de contas', validateBillPayment);
  if (!billPayments.ok) {
    return { ok: false, error: billPayments.error };
  }
  payload.billPayments = billPayments.rows;

  const categoryHints = validateRows(record.categoryHints, 'sugestões', validateCategoryHint);
  if (!categoryHints.ok) {
    return { ok: false, error: categoryHints.error };
  }
  payload.categoryHints = categoryHints.rows;

  return { ok: true, payload };
}

type ListResult<T> = { ok: true; rows: T[] } | { ok: false; error: string };

type Validator<T> = (row: unknown) => { ok: true; row: T } | { ok: false; error: string };

function validateRows<T>(rows: unknown, label: string, validate: Validator<T>): ListResult<T> {
  if (rows === undefined || rows === null) {
    return { ok: true, rows: [] };
  }

  if (!Array.isArray(rows)) {
    return { ok: false, error: `Ficheiro inválido: ${label} devia ser uma lista.` };
  }

  const result: T[] = [];

  for (const row of rows) {
    const validated = validate(row);
    if (!validated.ok) {
      return { ok: false, error: `${label}: ${validated.error}` };
    }
    result.push(validated.row);
  }

  return { ok: true, rows: result };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function positiveInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

function optionalText(value: unknown): string | null | undefined {
  if (value === undefined || value === null) {
    return null;
  }

  return typeof value === 'string' ? value : undefined;
}

function optionalValidDate(value: unknown): string | null | undefined {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  return isValidDate(value) ? value : undefined;
}

function requiredValidDate(value: unknown): string | null {
  const asText = typeof value === 'string' ? value : null;
  return asText !== null && isValidDate(asText) ? asText : null;
}

function invalid(label: string): { ok: false; error: string } {
  return { ok: false, error: `registo inválido (${label}).` };
}

function validateSetting(row: unknown): { ok: true; row: SettingRow } | { ok: false; error: string } {
  if (!isObject(row)) {
    return invalid('definição');
  }
  const key = text(row.key);
  const value = text(row.value);
  if (key === null || key.length === 0 || value === null) {
    return invalid('definição');
  }
  return { ok: true, row: { key, value } };
}

function validateMovement(row: unknown): { ok: true; row: MovementBackupRow } | { ok: false; error: string } {
  if (!isObject(row)) {
    return invalid('movimento');
  }
  const id = text(row.id);
  const type = row.type;
  const amount = positiveInteger(row.amount);
  const category = text(row.category);
  const date = requiredValidDate(row.date);
  const note = optionalText(row.note);
  const billId = optionalText(row.bill_id);
  const projectPaymentId = optionalText(row.project_payment_id);

  if (id === null || id.length === 0 || (type !== 'income' && type !== 'expense')) {
    return invalid('movimento');
  }
  if (amount === null || category === null || date === null) {
    return invalid('movimento');
  }
  if (note === undefined || billId === undefined || projectPaymentId === undefined) {
    return invalid('movimento');
  }

  // Ausente num backup antigo => 'manual'. Valor desconhecido também não pode
  // fazer o import falhar, por isso é normalizado em vez de rejeitado.
  const origin = row.origin === undefined ? 'manual' : text(row.origin) ?? 'manual';

  return {
    ok: true,
    row: { id, type, amount, category, date, note, bill_id: billId, project_payment_id: projectPaymentId, origin },
  };
}

function validateGoal(row: unknown): { ok: true; row: GoalRow } | { ok: false; error: string } {
  if (!isObject(row)) {
    return invalid('meta');
  }
  const id = text(row.id);
  const name = text(row.name);
  const target = positiveInteger(row.target);
  const deadline = optionalValidDate(row.deadline);
  const createdAt = requiredValidDate(row.created_at);
  const completedAt = optionalValidDate(row.completed_at);
  const archivedAt = optionalValidDate(row.archived_at);

  if (id === null || id.length === 0 || name === null) {
    return invalid('meta');
  }
  if (target === null || createdAt === null) {
    return invalid('meta');
  }
  if (deadline === undefined || completedAt === undefined || archivedAt === undefined) {
    return invalid('meta');
  }

  return {
    ok: true,
    row: { id, name, target, deadline, created_at: createdAt, completed_at: completedAt, archived_at: archivedAt },
  };
}

function validateGoalOp(row: unknown): { ok: true; row: GoalOpRow } | { ok: false; error: string } {
  if (!isObject(row)) {
    return invalid('operação de meta');
  }
  const id = text(row.id);
  const goalId = text(row.goal_id);
  const kind = row.kind;
  const amount = positiveInteger(row.amount);
  const date = requiredValidDate(row.date);

  if (id === null || id.length === 0 || goalId === null || goalId.length === 0) {
    return invalid('operação de meta');
  }
  if (kind !== 'deposit' && kind !== 'withdraw') {
    return invalid('operação de meta');
  }
  if (amount === null || date === null) {
    return invalid('operação de meta');
  }

  return { ok: true, row: { id, goal_id: goalId, kind, amount, date } };
}

function validateDebt(row: unknown): { ok: true; row: DebtRow } | { ok: false; error: string } {
  if (!isObject(row)) {
    return invalid('dívida');
  }
  const id = text(row.id);
  const kind = row.kind;
  const party = text(row.party);
  const total = positiveInteger(row.total);
  const loanDate = requiredValidDate(row.loan_date);
  const dueDate = optionalValidDate(row.due_date);
  const note = optionalText(row.note);

  if (id === null || id.length === 0 || party === null || (kind !== 'owe' && kind !== 'owed')) {
    return invalid('dívida');
  }
  if (total === null || loanDate === null) {
    return invalid('dívida');
  }
  if (dueDate === undefined || note === undefined) {
    return invalid('dívida');
  }

  return { ok: true, row: { id, kind, party, total, loan_date: loanDate, due_date: dueDate, note } };
}

function validatePayment(label: string) {
  return (row: unknown): { ok: true; row: PaymentRow } | { ok: false; error: string } => {
    if (!isObject(row)) {
      return invalid(`pagamento de ${label}`);
    }
    const id = text(row.id);
    const parentId = text(row.parent_id);
    const amount = positiveInteger(row.amount);
    const date = requiredValidDate(row.date);
    const movementId = optionalText(row.movement_id);

    if (id === null || id.length === 0 || parentId === null || parentId.length === 0) {
      return invalid(`pagamento de ${label}`);
    }
    if (amount === null || date === null) {
      return invalid(`pagamento de ${label}`);
    }
    if (movementId === undefined) {
      return invalid(`pagamento de ${label}`);
    }

    return { ok: true, row: { id, parent_id: parentId, amount, date, movement_id: movementId } };
  };
}

function validateProject(row: unknown): { ok: true; row: ProjectRow } | { ok: false; error: string } {
  if (!isObject(row)) {
    return invalid('projeto');
  }
  const id = text(row.id);
  const name = text(row.name);
  const client = optionalText(row.client);
  const total = positiveInteger(row.total);
  const dueDate = optionalValidDate(row.due_date);
  const createdAt = requiredValidDate(row.created_at);
  const deliveredAt = optionalValidDate(row.delivered_at);
  const note = optionalText(row.note);

  if (id === null || id.length === 0 || name === null) {
    return invalid('projeto');
  }
  if (total === null || createdAt === null) {
    return invalid('projeto');
  }
  if (client === undefined || dueDate === undefined || deliveredAt === undefined || note === undefined) {
    return invalid('projeto');
  }

  return {
    ok: true,
    row: { id, name, client, total, due_date: dueDate, created_at: createdAt, delivered_at: deliveredAt, note },
  };
}

function validateBill(row: unknown): { ok: true; row: BillRow } | { ok: false; error: string } {
  if (!isObject(row)) {
    return invalid('conta fixa');
  }
  const id = text(row.id);
  const name = text(row.name);
  const icon = optionalText(row.icon);
  const amount = positiveInteger(row.amount);
  const dayOfMonth = row.day_of_month;
  const remindDays = row.remind_days_before;
  const category = text(row.category);
  const active = row.active;

  if (id === null || id.length === 0 || name === null || category === null) {
    return invalid('conta fixa');
  }
  if (amount === null) {
    return invalid('conta fixa');
  }
  if (typeof dayOfMonth !== 'number' || !Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
    return invalid('conta fixa');
  }
  if (typeof remindDays !== 'number' || !Number.isInteger(remindDays) || remindDays < 0) {
    return invalid('conta fixa');
  }
  if (active !== 0 && active !== 1) {
    return invalid('conta fixa');
  }
  if (icon === undefined) {
    return invalid('conta fixa');
  }

  return { ok: true, row: { id, name, icon, amount, day_of_month: dayOfMonth, remind_days_before: remindDays, category, active } };
}

function validateBillPayment(row: unknown): { ok: true; row: BillPaymentRow } | { ok: false; error: string } {
  if (!isObject(row)) {
    return invalid('pagamento de conta');
  }
  const id = text(row.id);
  const billId = text(row.bill_id);
  const month = text(row.month);
  const paidOn = requiredValidDate(row.paid_on);
  const amount = positiveInteger(row.amount);
  const movementId = optionalText(row.movement_id);

  if (id === null || id.length === 0 || billId === null || billId.length === 0) {
    return invalid('pagamento de conta');
  }
  if (month === null || !MONTH_PATTERN.test(month)) {
    return invalid('pagamento de conta');
  }
  if (paidOn === null || amount === null) {
    return invalid('pagamento de conta');
  }
  if (movementId === undefined) {
    return invalid('pagamento de conta');
  }

  return { ok: true, row: { id, bill_id: billId, month, paid_on: paidOn, amount, movement_id: movementId } };
}

function validateCategoryHint(row: unknown): { ok: true; row: CategoryHintRow } | { ok: false; error: string } {
  if (!isObject(row)) {
    return invalid('sugestão');
  }
  const keyword = text(row.keyword);
  const category = text(row.category);
  const uses = row.uses;
  const lastUsed = requiredValidDate(row.last_used);

  if (keyword === null || keyword.length === 0 || category === null) {
    return invalid('sugestão');
  }
  if (typeof uses !== 'number' || !Number.isInteger(uses) || uses < 0) {
    return invalid('sugestão');
  }
  if (lastUsed === null) {
    return invalid('sugestão');
  }

  return { ok: true, row: { keyword, category, uses, last_used: lastUsed } };
}
