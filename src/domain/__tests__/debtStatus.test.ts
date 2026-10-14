import { describe, expect, it } from '@jest/globals';

import { debtRemaining, debtStatus, debtSummary } from '../debtStatus';

describe('dividas', () => {
  it('fica liquidada quando nao ha nada em falta', () => {
    expect(debtStatus(45000, 45000, '2026-09-30', '2026-10-14')).toBe('paid');
  });

  it('fica atrasada quando o vencimento ja passou', () => {
    expect(debtStatus(45000, 15000, '2026-09-30', '2026-10-14')).toBe('overdue');
  });

  it('fica em aberto no dia do vencimento', () => {
    expect(debtStatus(45000, 15000, '2026-10-14', '2026-10-14')).toBe('open');
  });

  it('fica em aberto sem data de vencimento', () => {
    expect(debtStatus(45000, 0, null, '2026-10-14')).toBe('open');
  });

  it('nunca deixa o valor em falta negativo', () => {
    expect(debtRemaining(45000, 60000)).toBe(0);
    expect(debtRemaining(45000, 15000)).toBe(30000);
  });

  it('separa os totais de devo e devem-me', () => {
    const summary = debtSummary([
      { kind: 'owe', total: 45000, paid: 15000 },
      { kind: 'owed', total: 120000, paid: 0 },
      { kind: 'owe', total: 10000, paid: 10000 },
    ]);
    expect(summary).toEqual({ owe: 30000, owed: 120000 });
  });
});
