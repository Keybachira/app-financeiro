import { describe, expect, it } from '@jest/globals';

import {
  BACKUP_SCHEMA_VERSION,
  backupToJson,
  movementsToCsv,
  parseBackup,
  type BackupPayload,
  type MovementBackupRow,
} from '../backup';

const validMovement: MovementBackupRow = {
  id: '11111111-1111-4111-8111-111111111111',
  type: 'expense',
  amount: 1800,
  category: 'Transporte',
  date: '2026-10-14',
  note: 'táxi',
  bill_id: null,
  project_payment_id: null,
};

const validPayload: BackupPayload = {
  schemaVersion: BACKUP_SCHEMA_VERSION,
  exportedAt: '2026-10-14',
  settings: [{ key: 'monthly_limit', value: '300000' }],
  movements: [validMovement],
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

describe('backup JSON', () => {
  it('exporta e volta a importar sem perdas', () => {
    const parsed = parseBackup(backupToJson(validPayload));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.payload).toEqual(validPayload);
    }
  });

  it('recusa texto que não é JSON', () => {
    expect(parseBackup('isto não é json')).toEqual({ ok: false, error: expect.stringContaining('JSON') });
  });

  it('recusa versão superior à suportada', () => {
    const parsed = parseBackup(JSON.stringify({ ...validPayload, schemaVersion: BACKUP_SCHEMA_VERSION + 1 }));
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.error).toContain('recente');
    }
  });

  it('aceita versão inferior e assume listas vazias', () => {
    const parsed = parseBackup(JSON.stringify({ schemaVersion: 1, exportedAt: '2026-01-01' }));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.payload.movements).toEqual([]);
      expect(parsed.payload.goals).toEqual([]);
    }
  });

  it('recusa folhas com formato errado', () => {
    expect(parseBackup(JSON.stringify({ schemaVersion: 3, movements: 'x' })).ok).toBe(false);
  });

  it('valida movimento: tipo, valor e data', () => {
    expect(parseBackup(JSON.stringify({ schemaVersion: 3, movements: [{ ...validMovement, type: 'transfer' }] })).ok).toBe(false);
    expect(parseBackup(JSON.stringify({ schemaVersion: 3, movements: [{ ...validMovement, amount: 0 }] })).ok).toBe(false);
    expect(parseBackup(JSON.stringify({ schemaVersion: 3, movements: [{ ...validMovement, amount: 10.5 }] })).ok).toBe(false);
    expect(parseBackup(JSON.stringify({ schemaVersion: 3, movements: [{ ...validMovement, date: '2026-02-30' }] })).ok).toBe(false);
    expect(parseBackup(JSON.stringify({ schemaVersion: 3, movements: [{ ...validMovement, note: 7 }] })).ok).toBe(false);
  });

  it('valida pagamento de conta fixa: mês e unicidade de formato', () => {
    const bad = parseBackup(JSON.stringify({ schemaVersion: 3, billPayments: [{ id: 'p1', bill_id: 'b1', month: '2026-10-01', paid_on: '2026-10-01', amount: 100, movement_id: null }] }));
    expect(bad.ok).toBe(false);
  });

  it('valida conta fixa: dia do mês limitado a 1..31', () => {
    const bad = parseBackup(JSON.stringify({ schemaVersion: 3, bills: [{ id: 'b1', name: 'Agua', icon: null, amount: 5000, day_of_month: 32, remind_days_before: 1, category: 'Casa', active: 1 }] }));
    expect(bad.ok).toBe(false);
  });
});

describe('CSV de movimentos', () => {
  it('usa as colunas do plano', () => {
    const csv = movementsToCsv([validMovement]);
    expect(csv).toBe('data,tipo,valor,categoria,nota\n2026-10-14,expense,1800,Transporte,táxi');
  });

  it('escapa vírgulas, aspas e quebras de linha', () => {
    const csv = movementsToCsv([{ ...validMovement, note: 'net, "5mb"\ntarde' }]);
    expect(csv).toContain('"net, ""5mb""\ntarde"');
  });
});
