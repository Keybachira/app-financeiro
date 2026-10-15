import * as Crypto from 'expo-crypto';

import { todayISO } from '../domain/dates';
import { db } from '../db/client';

export type GoalRow = {
  id: string;
  name: string;
  target: number;
  deadline: string | null;
  created_at: string;
  completed_at: string | null;
  archived_at: string | null;
};

export type GoalOpRow = {
  id: string;
  goal_id: string;
  kind: 'deposit' | 'withdraw';
  amount: number;
  date: string;
};

export function listGoals(): GoalRow[] {
  return db.getAllSync<GoalRow>(
    'SELECT id, name, target, deadline, created_at, completed_at, archived_at FROM goals ORDER BY archived_at IS NOT NULL, created_at DESC'
  );
}

export function getGoal(id: string): GoalRow | null {
  return db.getFirstSync<GoalRow>(
    'SELECT id, name, target, deadline, created_at, completed_at, archived_at FROM goals WHERE id = ?',
    [id]
  );
}

export function listGoalOps(goalId?: string): GoalOpRow[] {
  if (goalId) {
    return db.getAllSync<GoalOpRow>(
      'SELECT id, goal_id, kind, amount, date FROM goal_ops WHERE goal_id = ? ORDER BY date DESC, rowid DESC',
      [goalId]
    );
  }

  return db.getAllSync<GoalOpRow>(
    'SELECT id, goal_id, kind, amount, date FROM goal_ops ORDER BY date DESC, rowid DESC'
  );
}

export function goalAmounts(goalId: string): { deposits: number; withdraws: number; saved: number } {
  const row = db.getFirstSync<{ deposits: number | null; withdraws: number | null }>(
    `SELECT
       SUM(CASE WHEN kind = 'deposit' THEN amount ELSE 0 END) AS deposits,
       SUM(CASE WHEN kind = 'withdraw' THEN amount ELSE 0 END) AS withdraws
     FROM goal_ops WHERE goal_id = ?`,
    [goalId]
  );

  const deposits = row?.deposits ?? 0;
  const withdraws = row?.withdraws ?? 0;

  return { deposits, withdraws, saved: deposits - withdraws };
}

export function reservedTotal(): number {
  const row = db.getFirstSync<{ total: number | null }>(
    `SELECT COALESCE(SUM(saved), 0) AS total FROM (
       SELECT MAX(0,
         (SELECT COALESCE(SUM(amount), 0) FROM goal_ops o WHERE o.goal_id = g.id AND o.kind = 'deposit') -
         (SELECT COALESCE(SUM(amount), 0) FROM goal_ops o WHERE o.goal_id = g.id AND o.kind = 'withdraw')
       ) AS saved
       FROM goals g WHERE g.archived_at IS NULL
     )`
  );

  return row?.total ?? 0;
}

export function monthGoalOps(month: string): { deposits: number; withdraws: number } {
  // O JOIN é obrigatório: `reservedTotal` filtra `archived_at IS NULL` e o saldo
  // do mês tem de partir da mesma base, senão arquivar uma meta punha
  // "Reservado 0 Kz" com o saldo do mês ainda a debitar o valor.
  const row = db.getFirstSync<{ deposits: number | null; withdraws: number | null }>(
    `SELECT
       SUM(CASE WHEN o.kind = 'deposit' THEN o.amount ELSE 0 END) AS deposits,
       SUM(CASE WHEN o.kind = 'withdraw' THEN o.amount ELSE 0 END) AS withdraws
     FROM goal_ops o
     JOIN goals g ON g.id = o.goal_id
     WHERE substr(o.date, 1, 7) = ? AND g.archived_at IS NULL`,
    [month]
  );

  return { deposits: row?.deposits ?? 0, withdraws: row?.withdraws ?? 0 };
}

export type GoalInput = {
  name: string;
  target: number;
  deadline: string | null;
};

export function createGoal(input: GoalInput): GoalRow {
  const row: GoalRow = {
    id: Crypto.randomUUID(),
    name: input.name,
    target: input.target,
    deadline: input.deadline,
    created_at: todayISO(),
    completed_at: null,
    archived_at: null,
  };

  db.runSync(
    'INSERT INTO goals (id, name, target, deadline, created_at, completed_at, archived_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [row.id, row.name, row.target, row.deadline, row.created_at, row.completed_at, row.archived_at]
  );

  return row;
}

export function updateGoal(id: string, input: GoalInput): void {
  db.withTransactionSync(() => {
    db.runSync('UPDATE goals SET name = ?, target = ?, deadline = ? WHERE id = ?', [
      input.name,
      input.target,
      input.deadline,
      id,
    ]);
    refreshCompletion(id);
  });
}

export function setGoalArchived(id: string, archived: boolean): void {
  db.runSync('UPDATE goals SET archived_at = ? WHERE id = ?', [archived ? todayISO() : null, id]);
}

export function deleteGoal(id: string): void {
  db.runSync('DELETE FROM goals WHERE id = ?', [id]);
}

export function depositToGoal(id: string, amount: number, date = todayISO()): void {
  db.withTransactionSync(() => {
    db.runSync('INSERT INTO goal_ops (id, goal_id, kind, amount, date) VALUES (?, ?, ?, ?, ?)', [
      Crypto.randomUUID(),
      id,
      'deposit',
      amount,
      date,
    ]);
    refreshCompletion(id);
  });
}

export function withdrawFromGoal(id: string, amount: number, date = todayISO()): void {
  db.withTransactionSync(() => {
    db.runSync('INSERT INTO goal_ops (id, goal_id, kind, amount, date) VALUES (?, ?, ?, ?, ?)', [
      Crypto.randomUUID(),
      id,
      'withdraw',
      amount,
      date,
    ]);
    refreshCompletion(id);
  });
}

export function deleteGoalOp(opId: string): void {
  db.withTransactionSync(() => {
    const op = db.getFirstSync<GoalOpRow>('SELECT id, goal_id, kind, amount, date FROM goal_ops WHERE id = ?', [opId]);
    db.runSync('DELETE FROM goal_ops WHERE id = ?', [opId]);

    if (op) {
      refreshCompletion(op.goal_id);
    }
  });
}

function refreshCompletion(id: string): void {
  const goal = getGoal(id);

  if (!goal) {
    return;
  }

  const { saved } = goalAmounts(id);
  const completedAt = saved >= goal.target ? (goal.completed_at ?? todayISO()) : null;

  db.runSync('UPDATE goals SET completed_at = ? WHERE id = ?', [completedAt, id]);
}
