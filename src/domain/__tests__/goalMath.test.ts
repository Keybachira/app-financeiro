import { describe, expect, it } from '@jest/globals';

import {
  goalPace,
  goalProgress,
  goalSaved,
  isGoalCompleted,
  monthlySavingsNeeded,
  monthsUntilDeadline,
} from '../goalMath';

describe('metas', () => {
  it('calcula o valor guardado e o progresso', () => {
    expect(goalSaved(80000, 20000)).toBe(60000);
    expect(goalProgress(50000, 400000)).toBe(0.125);
    expect(goalProgress(500000, 400000)).toBe(1);
    expect(goalProgress(1000, 0)).toBe(0);
  });

  it('conclui a meta quando o guardado atinge o alvo', () => {
    expect(isGoalCompleted(400000, 400000)).toBe(true);
    expect(isGoalCompleted(399999, 400000)).toBe(false);
  });

  it('reabre a meta quando um levantamento desce abaixo do alvo', () => {
    expect(isGoalCompleted(100000, 110000)).toBe(false);
    expect(goalPace({ saved: 100000, target: 110000, createdAt: '2026-01-01', deadline: '2026-12-31', today: '2026-07-01' })).not.toBe('completed');
  });

  it('calcula a poupanca mensal com arredondamento para cima', () => {
    expect(monthlySavingsNeeded(400000, 80000, '2027-03-31', '2026-10-14')).toBe(64000);
    expect(monthlySavingsNeeded(76000, 0, '2027-01-14', '2026-10-14')).toBe(25334);
    expect(monthlySavingsNeeded(500000, 0, null, '2026-10-14')).toBe(500000);
    expect(monthlySavingsNeeded(400000, 400000, '2027-03-31', '2026-10-14')).toBe(0);
  });

  it('conta meses ate ao prazo, sem negativos', () => {
    expect(monthsUntilDeadline('2027-03-31', '2026-10-14')).toBe(5);
    expect(monthsUntilDeadline('2026-06-30', '2026-10-14')).toBe(0);
    expect(monthsUntilDeadline(null, '2026-10-14')).toBe(0);
  });

  it('classifica o ritmo como adiantada, atrasada ou no ritmo', () => {
    const base = { target: 110000, createdAt: '2026-01-01', deadline: '2026-12-31', today: '2026-07-01' };
    expect(goalPace({ ...base, saved: 70000 })).toBe('ahead');
    expect(goalPace({ ...base, saved: 60000 })).toBe('onTrack');
    expect(goalPace({ ...base, saved: 50000 })).toBe('behind');
    expect(goalPace({ ...base, saved: 110000 })).toBe('completed');
  });

  it('metas sem prazo nao tem ritmo', () => {
    expect(goalPace({ saved: 1000, target: 110000, createdAt: '2026-01-01', deadline: null, today: '2026-07-01' })).toBe('onTrack');
  });

  it('metas com prazo no passado ficam atrasadas', () => {
    expect(goalPace({ saved: 50000, target: 110000, createdAt: '2026-01-01', deadline: '2026-06-30', today: '2026-10-14' })).toBe('behind');
  });
});
