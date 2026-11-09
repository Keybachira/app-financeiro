import { describe, expect, it } from '@jest/globals';
import { detectRecurrences, expectedDates } from '../detectors/recurrence-detector';
import { detectMissing } from '../detectors/missing-movement-detector';
import { mov } from '../helpers';

describe('recorrências', () => {
  it('mensal: 3 ocorrências consistentes (±3 dias, ±15%)', () => {
    const o = detectRecurrences([mov('2026-08-10', 15000, 'Internet'), mov('2026-09-11', 15000, 'internet'), mov('2026-10-09', 15200, 'Internet')]);
    expect(o).toHaveLength(1);
    expect(o[0]).toMatchObject({ cadence: 'monthly', occurrences: 3, dayOfMonth: 10, medianAmount: 15000 });
  });
  it('2 ocorrências não chegam', () => {
    expect(detectRecurrences([mov('2026-09-10', 15000, 'Internet'), mov('2026-10-10', 15000, 'Internet')])).toHaveLength(0);
  });
  it('semanal: intervalos de 7 dias', () => {
    const o = detectRecurrences([mov('2026-10-05', 4000, 'Zungueira'), mov('2026-10-12', 4000, 'Zungueira'), mov('2026-10-19', 4100, 'Zungueira'), mov('2026-10-26', 4000, 'Zungueira')]);
    expect(o[0]).toMatchObject({ cadence: 'weekly', occurrences: 4 });
  });
  it('irregular: não gera padrão', () => {
    expect(detectRecurrences([mov('2026-08-03', 5000, 'Táxi'), mov('2026-09-19', 5000, 'Táxi'), mov('2026-10-07', 5000, 'Táxi')])).toHaveLength(0);
  });
  it('valores muito diferentes quebram o padrão', () => {
    expect(detectRecurrences([mov('2026-08-10', 15000, 'Internet'), mov('2026-09-10', 15000, 'Internet'), mov('2026-10-10', 40000, 'Internet')])).toHaveLength(0);
  });
  it('dois movimentos no mesmo mês não são mensais', () => {
    expect(detectRecurrences([mov('2026-08-10', 5000, 'Almoço'), mov('2026-09-10', 5000, 'Almoço'), mov('2026-10-03', 5000, 'Almoço'), mov('2026-10-10', 5000, 'Almoço')])).toHaveLength(0);
  });
  it('dia 31 em meses curtos (fim de mês)', () => {
    const o = detectRecurrences([mov('2026-08-31', 90000, 'Renda'), mov('2026-09-30', 90000, 'Renda'), mov('2026-10-31', 90000, 'Renda')]);
    expect(o).toHaveLength(1);
    expect(expectedDates(o[0], '2027-02-28').pop()).toBe('2027-02-28');
  });
  it('ignora movimentos ligados a contas fixas (já têm lembrete)', () => {
    expect(detectRecurrences([mov('2026-08-10', 15000, 'Net', 'Serviços', 'expense', 'b1'), mov('2026-09-10', 15000, 'Net', 'Serviços', 'expense', 'b1'), mov('2026-10-10', 15000, 'Net', 'Serviços', 'expense', 'b1')])).toHaveLength(0);
  });
  it('mês sem movimento: reporta em falta uma vez; dois meses seguidos também; depois cala', () => {
    const o = detectRecurrences([mov('2026-07-05', 20000, 'Mesada', 'Extra', 'income'), mov('2026-08-05', 20000, 'Mesada', 'Extra', 'income'), mov('2026-09-05', 20000, 'Mesada', 'Extra', 'income')]);
    const w = (today: string) => detectMissing(o.map((x) => ({ o: x, confidence: 0.8 })), today);
    expect(w('2026-10-07')).toHaveLength(0);          // ainda dentro da tolerância
    expect(w('2026-10-20')[0]).toMatchObject({ expectedDate: '2026-10-05', missedCount: 1 });
    expect(w('2026-11-20')[0]).toMatchObject({ expectedDate: '2026-11-05', missedCount: 2 });
    expect(w('2027-01-20')).toHaveLength(0);          // padrão acabou
  });
});
