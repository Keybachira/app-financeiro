import { describe, expect, it } from '@jest/globals';

import { lastMovement, quickPicks } from '../quickPicks';

const movement = (date: string, amount: number, note: string | null, type: 'income' | 'expense' = 'expense') => ({
  date,
  amount,
  note,
  type,
});

describe('movimentos rapidos', () => {
  it('devolve o ultimo movimento registado', () => {
    const list = [
      movement('2026-10-01', 100, 'cafe'),
      movement('2026-10-10', 200, 'net'),
      movement('2026-10-05', 300, 'agua'),
    ];
    expect(lastMovement(list)?.date).toBe('2026-10-10');
  });

  it('devolve os pares nota/valor mais frequentes', () => {
    const today = '2026-10-14';
    const list = [
      movement('2026-10-01', 500, 'cafe'),
      movement('2026-10-03', 500, 'cafe'),
      movement('2026-10-05', 500, 'cafe'),
      movement('2026-10-06', 300, 'tuami'),
      movement('2026-10-07', 300, 'tuami'),
      movement('2026-10-08', 5000, 'netflix'),
      movement('2026-06-01', 100, 'antigo'),
      movement('2026-10-09', 100, null),
    ];
    expect(quickPicks(list, today)).toEqual([
      { note: 'cafe', amount: 500, count: 3 },
      { note: 'tuami', amount: 300, count: 2 },
    ]);
  });

  it('ignora movimentos fora da janela e no futuro', () => {
    const today = '2026-10-14';
    const list = [movement('2026-05-01', 500, 'cafe'), movement('2026-10-20', 300, 'tuami')];
    expect(quickPicks(list, today)).toEqual([]);
  });
});
