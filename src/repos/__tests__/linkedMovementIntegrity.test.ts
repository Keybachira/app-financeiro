import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { DatabaseSync, SQLInputValue } from 'node:sqlite';

jest.mock('expo-sqlite', () => {
  const { DatabaseSync } = require('node:sqlite') as typeof import('node:sqlite');
  const database = new DatabaseSync(':memory:');

  return {
    openDatabaseSync: () => ({
      execSync: (sql: string) => database.exec(sql),
      runSync: (sql: string, params: SQLInputValue[] = []) => database.prepare(sql).run(...params),
      getAllSync: (sql: string, params: SQLInputValue[] = []) => database.prepare(sql).all(...params),
      getFirstSync: (sql: string, params: SQLInputValue[] = []) => database.prepare(sql).get(...params) ?? null,
      withTransactionSync: (fn: () => void) => {
        database.exec('BEGIN');
        try {
          fn();
          database.exec('COMMIT');
        } catch (error) {
          database.exec('ROLLBACK');
          throw error;
        }
      },
    }),
    __database: database,
  };
});

jest.mock('expo-crypto', () => ({
  randomUUID: () => '00000000-0000-4000-8000-000000000001',
}));

const database = jest.requireMock<{ __database: DatabaseSync }>('expo-sqlite').__database;

// Importado depois dos mocks para exercer o repositório real.
import { deleteMovement, updateMovement } from '../movements';

beforeEach(() => {
  database.exec('DROP TABLE IF EXISTS movements');
  database.exec(`
    CREATE TABLE movements (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      note TEXT,
      bill_id TEXT,
      project_payment_id TEXT,
      origin TEXT NOT NULL DEFAULT 'manual'
    )
  `);
  database.prepare(
    `INSERT INTO movements (id, type, amount, category, date, note, origin)
     VALUES ('automatic', 'expense', 1000, 'Dívidas', '2026-11-09', 'Pagamento', 'debt')`,
  ).run();
});

describe('integridade de movimentos ligados', () => {
  it('recusa alterar o tipo de um pagamento automático', () => {
    expect(() =>
      updateMovement('automatic', {
        type: 'income',
        amount: 1000,
        category: 'Dívidas',
        date: '2026-11-09',
        note: 'Pagamento',
      }),
    ).toThrow('não podem mudar de tipo');

    const row = database.prepare('SELECT type FROM movements WHERE id = ?').get('automatic') as { type: string };
    expect(row.type).toBe('expense');
  });

  it('recusa apagar um movimento automático fora do módulo de origem', () => {
    expect(() => deleteMovement('automatic')).toThrow('módulo que o criou');
    const row = database.prepare('SELECT COUNT(*) AS count FROM movements').get() as { count: number };
    expect(row.count).toBe(1);
  });
});
