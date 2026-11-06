import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { DatabaseSync, SQLInputValue } from 'node:sqlite';

import { monthNet } from '../../domain/balance';
import { goalNetBefore, monthGoalOps, reservedTotal } from '../goals';
import { monthTotals, movementNetBefore } from '../movements';

// `expo-sqlite` exige runtime nativo, mas as queries do saldo são SQL simples:
// um SQLite em memória do próprio Node executa exatamente o mesmo código do repo.
jest.mock('expo-sqlite', () => {
  const { DatabaseSync } = require('node:sqlite') as typeof import('node:sqlite');
  const database = new DatabaseSync(':memory:');

  return {
    openDatabaseSync: () => ({
      execSync: (sql: string) => database.exec(sql),
      runSync: (sql: string, params: SQLInputValue[] = []) => database.prepare(sql).run(...params),
      getAllSync: (sql: string, params: SQLInputValue[] = []) => database.prepare(sql).all(...params),
      getFirstSync: (sql: string, params: SQLInputValue[] = []) =>
        database.prepare(sql).get(...params) ?? null,
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

jest.mock('expo-crypto', () => ({ randomUUID: () => '00000000-0000-4000-8000-000000000000' }));

const database = jest.requireMock<{ __database: DatabaseSync }>('expo-sqlite').__database;

beforeAll(() => {
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
    );
    CREATE TABLE goals (
      id TEXT PRIMARY KEY,
      name TEXT,
      target INTEGER,
      deadline TEXT,
      created_at TEXT,
      completed_at TEXT,
      archived_at TEXT
    );
    CREATE TABLE goal_ops (
      id TEXT PRIMARY KEY,
      goal_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      amount INTEGER NOT NULL,
      date TEXT NOT NULL
    );
  `);
});

beforeEach(() => {
  database.exec(`
    DELETE FROM movements;
    DELETE FROM goal_ops;
    DELETE FROM goals;

    INSERT INTO goals (id, archived_at) VALUES
      ('goal-ativa', NULL),
      ('goal-arquivada', '2026-10-01');

    INSERT INTO movements (id, type, amount, category, date, origin) VALUES
      ('out-receita', 'income', 10000, 'Salário', '2026-10-05', 'salary'),
      ('out-despesa', 'expense', 5000, 'Casa', '2026-10-20', 'manual'),
      ('nov-despesa', 'expense', 1500, 'Transporte', '2026-11-02', 'manual');

    INSERT INTO goal_ops (id, goal_id, kind, amount, date) VALUES
      ('op-deposito', 'goal-ativa', 'deposit', 2000, '2026-10-10'),
      ('op-levantamento', 'goal-ativa', 'withdraw', 500, '2026-11-03'),
      ('op-arquivada', 'goal-arquivada', 'deposit', 999, '2026-10-15');
  `);
});

describe('saldo transitado entre meses', () => {
  it('soma o líquido dos meses anteriores', () => {
    expect(movementNetBefore('2026-11')).toBe(5000);
  });

  it('não conta os movimentos do próprio mês', () => {
    expect(movementNetBefore('2026-10')).toBe(0);
    expect(movementNetBefore('2026-12')).toBe(3500);
  });

  it('trata metas anteriores como dinheiro reservado, ignorando arquivadas', () => {
    expect(goalNetBefore('2026-11')).toBe(2000);
    expect(goalNetBefore('2026-10')).toBe(0);
  });

  it('mantém o saldo do mês anterior ao entrar num mês novo', () => {
    // Regressão: `balance` era só `monthNet` do mês corrente, por isso os 5 000
    // que sobraram em outubro desapareciam no dia 1 de novembro.
    const opening = movementNetBefore('2026-11') - goalNetBefore('2026-11');
    const totals = monthTotals('2026-11');
    const ops = monthGoalOps('2026-11');
    const balance = opening + monthNet(totals.income, totals.expenses, ops.deposits, ops.withdraws);

    expect(opening).toBe(3000);
    expect(balance).toBe(2000);
  });

  it('saldo em carteira + reservado iguala o líquido de todos os movimentos', () => {
    const opening = movementNetBefore('2026-11') - goalNetBefore('2026-11');
    const totals = monthTotals('2026-11');
    const ops = monthGoalOps('2026-11');
    const balance = opening + monthNet(totals.income, totals.expenses, ops.deposits, ops.withdraws);

    expect(balance + reservedTotal()).toBe(movementNetBefore('2026-12'));
    expect(reservedTotal()).toBe(1500);
  });
});
