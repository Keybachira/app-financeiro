import * as Crypto from 'expo-crypto';

import { debtRemaining, debtStatus } from '../domain/debtStatus';
import { todayISO } from '../domain/dates';
import { db } from '../db/client';

export type DebtRow = {
  id: string;
  kind: 'owe' | 'owed';
  party: string;
  total: number;
  loan_date: string;
  due_date: string | null;
  note: string | null;
};

export type DebtPaymentRow = {
  id: string;
  debt_id: string;
  amount: number;
  date: string;
  movement_id: string | null;
};

export type DebtInput = {
  kind: 'owe' | 'owed';
  party: string;
  total: number;
  loanDate: string;
  dueDate: string | null;
  note: string | null;
};

export function listDebts(): DebtRow[] {
  return db.getAllSync<DebtRow>(
    'SELECT id, kind, party, total, loan_date, due_date, note FROM debts ORDER BY loan_date DESC'
  );
}

export function getDebt(id: string): DebtRow | null {
  return db.getFirstSync<DebtRow>(
    'SELECT id, kind, party, total, loan_date, due_date, note FROM debts WHERE id = ?',
    [id]
  );
}

export function listDebtPayments(debtId?: string): DebtPaymentRow[] {
  if (debtId) {
    return db.getAllSync<DebtPaymentRow>(
      'SELECT id, debt_id, amount, date, movement_id FROM debt_payments WHERE debt_id = ? ORDER BY date DESC, rowid DESC',
      [debtId]
    );
  }

  return db.getAllSync<DebtPaymentRow>(
    'SELECT id, debt_id, amount, date, movement_id FROM debt_payments ORDER BY date DESC, rowid DESC'
  );
}

export function debtPaid(debtId: string): number {
  const row = db.getFirstSync<{ paid: number | null }>(
    'SELECT SUM(amount) AS paid FROM debt_payments WHERE debt_id = ?',
    [debtId]
  );
  return row?.paid ?? 0;
}

export function debtTotals(): { owe: number; owed: number } {
  const debts = listDebts().map((debt) => ({
    kind: debt.kind,
    total: debt.total,
    paid: debtPaid(debt.id),
  }));

  let owe = 0;
  let owed = 0;

  for (const debt of debts) {
    const remaining = debtRemaining(debt.total, debt.paid);
    if (debt.kind === 'owe') {
      owe += remaining;
    } else {
      owed += remaining;
    }
  }

  return { owe, owed };
}

export function createDebt(input: DebtInput): DebtRow {
  const row: DebtRow = {
    id: Crypto.randomUUID(),
    kind: input.kind,
    party: input.party,
    total: input.total,
    loan_date: input.loanDate,
    due_date: input.dueDate,
    note: input.note,
  };

  db.runSync(
    'INSERT INTO debts (id, kind, party, total, loan_date, due_date, note) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [row.id, row.kind, row.party, row.total, row.loan_date, row.due_date, row.note]
  );

  return row;
}

export function updateDebt(id: string, input: DebtInput): void {
  db.runSync('UPDATE debts SET kind = ?, party = ?, total = ?, loan_date = ?, due_date = ?, note = ? WHERE id = ?', [
    input.kind,
    input.party,
    input.total,
    input.loanDate,
    input.dueDate,
    input.note,
    id,
  ]);
}

export function deleteDebt(id: string): void {
  db.runSync('DELETE FROM debts WHERE id = ?', [id]);
}

export function payDebt(id: string, amount: number, date = todayISO()): void {
  db.withTransactionSync(() => {
    insertPayment(id, amount, date);
  });
}

export function updateDebtPayment(paymentId: string, amount: number, date: string): void {
  db.withTransactionSync(() => {
    db.runSync('UPDATE debt_payments SET amount = ?, date = ? WHERE id = ?', [amount, date, paymentId]);

    const payment = db.getFirstSync<DebtPaymentRow>('SELECT id, debt_id, amount, date, movement_id FROM debt_payments WHERE id = ?', [
      paymentId,
    ]);

    if (payment?.movement_id) {
      db.runSync('UPDATE movements SET amount = ?, date = ? WHERE id = ?', [amount, date, payment.movement_id]);
    }
  });
}

export function deleteDebtPayment(paymentId: string): void {
  db.withTransactionSync(() => {
    const payment = db.getFirstSync<DebtPaymentRow>('SELECT id, debt_id, amount, date, movement_id FROM debt_payments WHERE id = ?', [
      paymentId,
    ]);

    db.runSync('DELETE FROM debt_payments WHERE id = ?', [paymentId]);

    if (payment?.movement_id) {
      db.runSync('DELETE FROM movements WHERE id = ?', [payment.movement_id]);
    }
  });
}

export function debtView(debt: DebtRow, today: string) {
  const paid = debtPaid(debt.id);
  const remaining = debtRemaining(debt.total, paid);

  return {
    debt,
    paid,
    remaining,
    progress: debt.total > 0 ? paid / debt.total : 0,
    status: debtStatus(debt.total, paid, debt.due_date, today) as 'paid' | 'overdue' | 'open',
  };
}

export type DebtView = ReturnType<typeof debtView>;

function insertPayment(id: string, amount: number, date: string): void {
  const debt = getDebt(id);

  if (!debt) {
    throw new Error('Dívida não encontrada.');
  }

  const movementId = Crypto.randomUUID();

  db.runSync('INSERT INTO movements (id, type, amount, category, date, note) VALUES (?, ?, ?, ?, ?, ?)', [
    movementId,
    debt.kind === 'owe' ? 'expense' : 'income',
    amount,
    'Dívidas',
    date,
    `Pagamento · ${debt.party}`,
  ]);

  db.runSync('INSERT INTO debt_payments (id, debt_id, amount, date, movement_id) VALUES (?, ?, ?, ?, ?)', [
    Crypto.randomUUID(),
    id,
    amount,
    date,
    movementId,
  ]);
}
