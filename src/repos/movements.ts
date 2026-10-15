import * as Crypto from 'expo-crypto';

import { addDays, monthKey, todayISO } from '../domain/dates';
import { isCategory } from '../domain/categories';
import { normalizeNote } from '../domain/categoryHints';
import { db } from '../db/client';

export type MovementType = 'income' | 'expense';

/**
 * `manual` = escrito pelo utilizador; os restantes são gerados pelo sistema.
 * Só movimentos `manual` alimentam `category_hints`.
 */
export type MovementOrigin = 'manual' | 'bill' | 'debt' | 'project' | 'salary';

export const MOVEMENT_ORIGINS: readonly MovementOrigin[] = ['manual', 'bill', 'debt', 'project', 'salary'];

export function isMovementOrigin(value: unknown): value is MovementOrigin {
  return typeof value === 'string' && (MOVEMENT_ORIGINS as readonly string[]).includes(value);
}

export type MovementRow = {
  id: string;
  type: MovementType;
  amount: number;
  category: string;
  date: string;
  note: string | null;
  bill_id: string | null;
  project_payment_id: string | null;
  origin: MovementOrigin;
};

export type MovementInput = {
  type: MovementType;
  amount: number;
  category: string;
  date: string;
  note?: string | null;
  /** Omisso = `manual`. Só os chamadores internos o definem. */
  origin?: MovementOrigin;
};

type MovementDbRow = {
  id: string;
  type: string;
  amount: number;
  category: string;
  date: string;
  note: string | null;
  bill_id: string | null;
  project_payment_id: string | null;
  origin: string;
};

function mapRow(row: MovementDbRow): MovementRow {
  return {
    id: row.id,
    type: row.type === 'income' ? 'income' : 'expense',
    amount: row.amount,
    category: row.category,
    date: row.date,
    note: row.note,
    bill_id: row.bill_id,
    project_payment_id: row.project_payment_id,
    origin: isMovementOrigin(row.origin) ? row.origin : 'manual',
  };
}

function sanitizeSearch(search: string | undefined): string {
  return (search ?? '').replace(/[%_]/g, '').trim();
}

export function listMovements(): MovementRow[] {
  return db
    .getAllSync<MovementDbRow>('SELECT * FROM movements ORDER BY date DESC, rowid DESC')
    .map(mapRow);
}

export function listMovementsForMonth(month: string, search?: string): MovementRow[] {
  const term = sanitizeSearch(search);

  if (term.length > 0) {
    const like = `%${term}%`;
    return db
      .getAllSync<MovementDbRow>(
        `SELECT * FROM movements
         WHERE substr(date, 1, 7) = ? AND (note LIKE ? OR category LIKE ?)
         ORDER BY date DESC, rowid DESC`,
        [month, like, like]
      )
      .map(mapRow);
  }

  return db
    .getAllSync<MovementDbRow>(
      `SELECT * FROM movements WHERE substr(date, 1, 7) = ? ORDER BY date DESC, rowid DESC`,
      [month]
    )
    .map(mapRow);
}

export function getMovement(id: string): MovementRow | null {
  const row = db.getFirstSync<MovementDbRow>('SELECT * FROM movements WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

export function createMovement(input: MovementInput): MovementRow {
  const origin = input.origin ?? 'manual';
  const row: MovementRow = {
    id: Crypto.randomUUID(),
    type: input.type,
    amount: input.amount,
    category: input.category,
    date: input.date,
    note: input.note ?? null,
    bill_id: null,
    project_payment_id: null,
    origin,
  };

  db.withTransactionSync(() => {
    db.runSync(
      'INSERT INTO movements (id, type, amount, category, date, note, origin) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [row.id, row.type, row.amount, row.category, row.date, row.note, row.origin]
    );

    if (origin === 'manual') {
      recordCategoryHint(row.note, row.category);
    }
  });

  return row;
}

export function updateMovement(id: string, input: MovementInput): void {
  db.withTransactionSync(() => {
    db.runSync('UPDATE movements SET type = ?, amount = ?, category = ?, date = ?, note = ? WHERE id = ?', [
      input.type,
      input.amount,
      input.category,
      input.date,
      input.note ?? null,
      id,
    ]);

    // Sincroniza pagamentos ligados para manter a integridade dos totais
    // (valor em falta de dívidas/projetos e progresso de contas fixas).
    db.runSync('UPDATE debt_payments SET amount = ?, date = ? WHERE movement_id = ?', [input.amount, input.date, id]);
    db.runSync('UPDATE project_payments SET amount = ?, date = ? WHERE movement_id = ?', [input.amount, input.date, id]);
    db.runSync('UPDATE bill_payments SET amount = ?, month = ?, paid_on = ? WHERE movement_id = ?', [
      input.amount,
      monthKey(input.date),
      input.date,
      id,
    ]);

    // Um movimento gerado pelo sistema mantém a nota automática que o originou
    // ("Pagamento · Carlos", "Projeto · Site X"): editar a data ou o valor não
    // pode transformá-lo numa sugestão de categoria para o utilizador.
    const stored = db.getFirstSync<{ origin: string }>('SELECT origin FROM movements WHERE id = ?', [id]);

    if (stored === null || stored.origin === 'manual') {
      recordCategoryHint(input.note ?? null, input.category);
    }
  });
}

export function deleteMovement(id: string): void {
  db.runSync('DELETE FROM movements WHERE id = ?', [id]);
}

export function restoreMovement(row: MovementRow): void {
  try {
    db.runSync(
      `INSERT INTO movements (id, type, amount, category, date, note, bill_id, project_payment_id, origin)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id,
        row.type,
        row.amount,
        row.category,
        row.date,
        row.note,
        row.bill_id,
        row.project_payment_id,
        row.origin,
      ]
    );
  } catch {
    db.runSync(
      'INSERT INTO movements (id, type, amount, category, date, note, origin) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [row.id, row.type, row.amount, row.category, row.date, row.note, row.origin]
    );
  }
}

export function monthTotals(month: string): { income: number; expenses: number } {
  const row = db.getFirstSync<{ income: number | null; expenses: number | null }>(
    `SELECT
       SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
       SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expenses
     FROM movements
     WHERE substr(date, 1, 7) = ?`,
    [month]
  );

  return { income: row?.income ?? 0, expenses: row?.expenses ?? 0 };
}

export function dailyExpenseTotals(month: string): Record<string, number> {
  const rows = db.getAllSync<{ date: string; amount: number }>(
    `SELECT date, SUM(amount) AS amount
     FROM movements
     WHERE substr(date, 1, 7) = ? AND type = 'expense'
     GROUP BY date
     ORDER BY date`,
    [month]
  );

  return Object.fromEntries(rows.map((row) => [row.date, row.amount]));
}

export function categoryExpenseTotals(month: string): { category: string; amount: number }[] {
  return db.getAllSync<{ category: string; amount: number }>(
    `SELECT category, SUM(amount) AS amount
     FROM movements
     WHERE substr(date, 1, 7) = ? AND type = 'expense'
     GROUP BY category
     ORDER BY amount DESC, category ASC`,
    [month]
  );
}

export function expensesOnDate(date: string): number {
  const row = db.getFirstSync<{ total: number | null }>(
    `SELECT SUM(amount) AS total FROM movements WHERE date = ? AND type = 'expense'`,
    [date]
  );

  return row?.total ?? 0;
}

export function recentMovements(days: number, today: string, limit: number): MovementRow[] {
  const since = addDays(today, -days);

  return db
    .getAllSync<MovementDbRow>(
      'SELECT * FROM movements WHERE date >= ? AND date <= ? ORDER BY date DESC, rowid DESC LIMIT ?',
      [since, today, limit]
    )
    .map(mapRow);
}

export function recordCategoryHint(note: string | null, category: string): void {
  if (!note) {
    return;
  }

  const keyword = normalizeNote(note);

  if (keyword.length === 0) {
    return;
  }

  // Segunda barreira: só categorias reais podem virar sugestão, mesmo que um
  // chamador automático se escape ao filtro por `origin`.
  if (!isCategory(category)) {
    return;
  }

  db.runSync(
    `INSERT INTO category_hints (keyword, category, uses, last_used) VALUES (?, ?, 1, ?)
     ON CONFLICT (keyword) DO UPDATE SET category = excluded.category, uses = uses + 1, last_used = excluded.last_used`,
    [keyword, category, todayISO()]
  );
}

/**
 * Remove das sugestões as palavras-chave que vieram exclusivamente de notas
 * geradas pelo sistema ("Salário", "Pagamento · Carlos", "Projeto · Site X").
 *
 * Idempotente e seguro: uma palavra-chave que também apareça num movimento
 * manual é preservada. Corre no arranque para apanhar tanto a base poluída
 * antes desta migração como movimentos automáticos criados entretanto.
 */
export function purgeAutomaticCategoryHints(): void {
  const manualKeywords = new Set(
    db
      .getAllSync<{ note: string | null }>(
        `SELECT DISTINCT note FROM movements WHERE origin = 'manual' AND note IS NOT NULL`
      )
      .map((row) => normalizeNote(row.note ?? ''))
      .filter((keyword) => keyword.length > 0)
  );

  const automatic = db.getAllSync<{ note: string | null }>(
    `SELECT DISTINCT note FROM movements WHERE origin <> 'manual' AND note IS NOT NULL`
  );

  for (const row of automatic) {
    const keyword = normalizeNote(row.note ?? '');

    if (keyword.length === 0 || manualKeywords.has(keyword)) {
      continue;
    }

    db.runSync('DELETE FROM category_hints WHERE keyword = ?', [keyword]);
  }
}

export function listCategoryHints(): { keyword: string; category: string }[] {
  return db.getAllSync<{ keyword: string; category: string }>(
    'SELECT keyword, category FROM category_hints ORDER BY uses DESC, last_used DESC'
  );
}
