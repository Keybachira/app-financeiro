import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import type {
  BackupPayload,
  BillPaymentRow,
  BillRow,
  CategoryHintRow,
  DebtRow,
  GoalOpRow,
  GoalRow,
  MovementBackupRow,
  PaymentRow,
  ProjectRow,
  SettingRow,
} from '../domain/backup';
import { BACKUP_SCHEMA_VERSION } from '../domain/backup';
import { todayISO } from '../domain/dates';
import { db } from '../db/client';

export type { BackupPayload };

export function buildBackup(): BackupPayload {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: todayISO(),
    settings: db.getAllSync<SettingRow>('SELECT key, value FROM settings ORDER BY key'),
    movements: db.getAllSync<MovementBackupRow>(
      `SELECT id, type, amount, category, date, note, bill_id, project_payment_id FROM movements ORDER BY date, rowid`
    ),
    goals: db.getAllSync<GoalRow>(
      'SELECT id, name, target, deadline, created_at, completed_at, archived_at FROM goals ORDER BY created_at'
    ),
    goalOps: db.getAllSync<GoalOpRow>(
      'SELECT id, goal_id, kind, amount, date FROM goal_ops ORDER BY date, rowid'
    ),
    debts: db.getAllSync<DebtRow>(
      'SELECT id, kind, party, total, loan_date, due_date, note FROM debts ORDER BY loan_date'
    ),
    debtPayments: db.getAllSync<PaymentRow>(
      'SELECT id, debt_id AS parent_id, amount, date, movement_id FROM debt_payments ORDER BY date, rowid'
    ),
    projects: db.getAllSync<ProjectRow>(
      'SELECT id, name, client, total, due_date, created_at, delivered_at, note FROM projects ORDER BY created_at'
    ),
    projectPayments: db.getAllSync<PaymentRow>(
      'SELECT id, project_id AS parent_id, amount, date, movement_id FROM project_payments ORDER BY date, rowid'
    ),
    bills: db.getAllSync<BillRow>(
      'SELECT id, name, icon, amount, day_of_month, remind_days_before, category, active FROM bills ORDER BY name'
    ),
    billPayments: db.getAllSync<BillPaymentRow>(
      'SELECT id, bill_id, month, paid_on, amount, movement_id FROM bill_payments ORDER BY paid_on, rowid'
    ),
    categoryHints: db.getAllSync<CategoryHintRow>(
      'SELECT keyword, category, uses, last_used FROM category_hints ORDER BY keyword'
    ),
  };
}

export function backupCounts(payload: BackupPayload) {
  return {
    movements: payload.movements.length,
    goals: payload.goals.length,
    debts: payload.debts.length,
    projects: payload.projects.length,
    bills: payload.bills.length,
  };
}

function deleteAllData(): void {
  db.execSync('DELETE FROM bill_payments');
  db.execSync('DELETE FROM debt_payments');
  db.execSync('DELETE FROM project_payments');
  db.execSync('DELETE FROM goal_ops');
  db.execSync('DELETE FROM movements');
  db.execSync('DELETE FROM bills');
  db.execSync('DELETE FROM debts');
  db.execSync('DELETE FROM goals');
  db.execSync('DELETE FROM projects');
  db.execSync('DELETE FROM category_hints');
  db.execSync('DELETE FROM settings');
}

function idList(rows: { id: string }[]): Set<string> {
  return new Set(rows.map((row) => row.id));
}

function existingTableIds(sql: string): Set<string> {
  return idList(db.getAllSync<{ id: string }>(sql));
}

export function validateReferences(
  payload: BackupPayload,
  mode: 'merge' | 'replace'
): string | null {
  const goalIds = idList(payload.goals);
  const debtIds = idList(payload.debts);
  const projectIds = idList(payload.projects);
  const billIds = idList(payload.bills);
  const movementIds = idList(payload.movements);

  if (mode === 'merge') {
    for (const id of existingTableIds('SELECT id FROM goals')) goalIds.add(id);
    for (const id of existingTableIds('SELECT id FROM debts')) debtIds.add(id);
    for (const id of existingTableIds('SELECT id FROM projects')) projectIds.add(id);
    for (const id of existingTableIds('SELECT id FROM bills')) billIds.add(id);
    for (const id of existingTableIds('SELECT id FROM movements')) movementIds.add(id);
  }

  for (const op of payload.goalOps) {
    if (!goalIds.has(op.goal_id)) {
      return 'operações de metas: referência a meta inexistente.';
    }
  }

  for (const payment of payload.debtPayments) {
    if (!debtIds.has(payment.parent_id)) {
      return 'pagamentos de dívidas: referência a dívida inexistente.';
    }
    if (payment.movement_id !== null && !movementIds.has(payment.movement_id)) {
      return 'pagamentos de dívidas: referência a movimento inexistente.';
    }
  }

  for (const payment of payload.projectPayments) {
    if (!projectIds.has(payment.parent_id)) {
      return 'pagamentos de projetos: referência a projeto inexistente.';
    }
    if (payment.movement_id !== null && !movementIds.has(payment.movement_id)) {
      return 'pagamentos de projetos: referência a movimento inexistente.';
    }
  }

  for (const movement of payload.movements) {
    if (movement.bill_id !== null && !billIds.has(movement.bill_id)) {
      return 'movimentos: referência a conta fixa inexistente.';
    }
  }

  for (const payment of payload.billPayments) {
    if (!billIds.has(payment.bill_id)) {
      return 'pagamentos de contas: referência a conta fixa inexistente.';
    }
    if (payment.movement_id !== null && !movementIds.has(payment.movement_id)) {
      return 'pagamentos de contas: referência a movimento inexistente.';
    }
  }

  return null;
}

export type ImportMode = 'merge' | 'replace';

export function importBackup(payload: BackupPayload, mode: ImportMode): void {
  const referenceError = validateReferences(payload, mode);

  if (referenceError !== null) {
    throw new Error(referenceError);
  }

  db.withTransactionSync(() => {
    if (mode === 'replace') {
      deleteAllData();
    }

    for (const row of payload.settings) {
      db.runSync(
        'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
        [row.key, row.value]
      );
    }

    for (const row of payload.movements) {
      db.runSync(
        `INSERT OR IGNORE INTO movements (id, type, amount, category, date, note, bill_id, project_payment_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [row.id, row.type, row.amount, row.category, row.date, row.note, row.bill_id, row.project_payment_id]
      );
    }

    for (const row of payload.goals) {
      db.runSync(
        `INSERT OR IGNORE INTO goals (id, name, target, deadline, created_at, completed_at, archived_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [row.id, row.name, row.target, row.deadline, row.created_at, row.completed_at, row.archived_at]
      );
    }

    for (const row of payload.goalOps) {
      db.runSync(
        'INSERT OR IGNORE INTO goal_ops (id, goal_id, kind, amount, date) VALUES (?, ?, ?, ?, ?)',
        [row.id, row.goal_id, row.kind, row.amount, row.date]
      );
    }

    for (const row of payload.debts) {
      db.runSync(
        'INSERT OR IGNORE INTO debts (id, kind, party, total, loan_date, due_date, note) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [row.id, row.kind, row.party, row.total, row.loan_date, row.due_date, row.note]
      );
    }

    for (const row of payload.debtPayments) {
      db.runSync(
        'INSERT OR IGNORE INTO debt_payments (id, debt_id, amount, date, movement_id) VALUES (?, ?, ?, ?, ?)',
        [row.id, row.parent_id, row.amount, row.date, row.movement_id]
      );
    }

    for (const row of payload.projects) {
      db.runSync(
        `INSERT OR IGNORE INTO projects (id, name, client, total, due_date, created_at, delivered_at, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [row.id, row.name, row.client, row.total, row.due_date, row.created_at, row.delivered_at, row.note]
      );
    }

    for (const row of payload.projectPayments) {
      db.runSync(
        'INSERT OR IGNORE INTO project_payments (id, project_id, amount, date, movement_id) VALUES (?, ?, ?, ?, ?)',
        [row.id, row.parent_id, row.amount, row.date, row.movement_id]
      );
    }

    for (const row of payload.bills) {
      db.runSync(
        `INSERT OR IGNORE INTO bills (id, name, icon, amount, day_of_month, remind_days_before, category, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [row.id, row.name, row.icon, row.amount, row.day_of_month, row.remind_days_before, row.category, row.active]
      );
    }

    for (const row of payload.billPayments) {
      db.runSync(
        `INSERT OR IGNORE INTO bill_payments (id, bill_id, month, paid_on, amount, movement_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [row.id, row.bill_id, row.month, row.paid_on, row.amount, row.movement_id]
      );
    }

    for (const row of payload.categoryHints) {
      db.runSync(
        `INSERT OR IGNORE INTO category_hints (keyword, category, uses, last_used)
         VALUES (?, ?, ?, ?)`,
        [row.keyword, row.category, row.uses, row.last_used]
      );
    }
  });
}

export async function shareExportFile(filename: string, content: string, mimeType: string): Promise<void> {
  const file = new File(Paths.cache, filename);
  file.delete();
  file.create({ overwrite: true });
  file.write(content);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('A partilha de ficheiros não está disponível neste dispositivo.');
  }

  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: 'Guardar backup' });
}

export async function pickBackupFile(): Promise<File | null> {
  const result = await File.pickFileAsync({ mimeTypes: ['application/json'] });

  if (result.canceled) {
    return null;
  }

  return result.result;
}
