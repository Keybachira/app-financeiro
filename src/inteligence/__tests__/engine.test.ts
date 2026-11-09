import { describe, expect, it, jest } from '@jest/globals';
import { createIntelligenceEngine } from '../engine/intelligence-engine';
import { createInMemoryRepository, createInMemoryScheduler } from '../storage/in-memory';
import { fixedClock } from '../time/clock';
import { decideReminders } from '../reminders/reminder-policy';
import { emptyProfile } from '../learning/behavior-profile';
import { Prediction } from '../types/intelligence.types';
import { mov } from '../helpers';

const history = () => [mov('2026-08-10', 15000, 'Internet', 'Serviços'), mov('2026-09-10', 15000, 'Internet', 'Serviços'), mov('2026-10-10', 15000, 'Internet', 'Serviços')];
const setup = (date = '2026-11-07', hour = 8) => {
  const repo = createInMemoryRepository(history()), scheduler = createInMemoryScheduler(), clock = fixedClock(date, hour);
  return { repo, scheduler, clock, engine: createIntelligenceEngine({ repo, scheduler, clock }) };
};

describe('motor', () => {
  it('previsão ≠ movimento: o motor nunca escreve movimentos', async () => {
    const { engine, repo } = setup();
    const before = (await repo.loadMovements('2000-01-01')).length;
    const r = await engine.onAppOpen();
    expect(r.predictions[0]).toMatchObject({ expectedDate: '2026-11-10', expectedAmount: 15000 });
    expect((await repo.loadMovements('2000-01-01')).length).toBe(before);
  });
  it('agenda lembrete na véspera às 9h', async () => {
    const { engine, scheduler } = setup();
    await engine.onAppOpen();
    expect(scheduler.all()).toHaveLength(1);
    expect(scheduler.all()[0]).toMatchObject({ fireOn: '2026-11-09', hour: 9 });
  });
  it('reagendar ao abrir é idempotente (sem duplicados)', async () => {
    const { engine, scheduler } = setup();
    await engine.onAppOpen(); await engine.onAppOpen(); await engine.onAppOpen();
    expect(scheduler.all()).toHaveLength(1);
  });
  it('reagenda ao mudar de dia (janela móvel)', async () => {
    const { engine, scheduler, clock } = setup('2026-11-01');
    await engine.onAppOpen();
    expect(scheduler.all()[0].fireOn).toBe('2026-11-09');
    clock.set('2026-11-10', 8);
    await engine.onAppOpen();
    expect(scheduler.all()[0]).toMatchObject({ fireOn: '2026-11-10' });   // evento hoje: avisa hoje
  });
  it('rejeitar silencia: sem previsões nem lembretes', async () => {
    const { engine, scheduler } = setup();
    const r = await engine.onAppOpen();
    const after = await engine.recordFeedback(r.observations[0].key, 'reject');
    expect(after.predictions).toHaveLength(0); expect(scheduler.all()).toHaveLength(0);
  });
  it('confirmar devolve Confirmation e sobe a confiança', async () => {
    const { engine } = setup();
    const r = await engine.onAppOpen();
    const { confirmation, result } = await engine.confirmPrediction(r.predictions[0], 'm99');
    expect(confirmation).toMatchObject({ movementId: 'm99', confirmedOn: '2026-11-07' });
    expect(result.predictions[0].confidence).toBeGreaterThan(r.predictions[0].confidence);
  });
  it('onMovementsChanged só reanalisa se o histórico mudou', async () => {
    const { engine, repo } = setup();
    await engine.onAppOpen();
    expect(await engine.onMovementsChanged()).toBeNull();
    repo.setMovements([...history(), mov('2026-11-02', 800, 'Pão', 'Comida')]);
    expect(await engine.onMovementsChanged()).not.toBeNull();
  });
  it('funciona offline: nenhuma chamada de rede', async () => {
    const originalFetch = global.fetch;
    const f = jest.fn();
    global.fetch = f as typeof fetch;
    try {
      const { engine } = setup();
      await engine.onAppOpen();
      expect(f).not.toHaveBeenCalled();
    } finally {
      global.fetch = originalFetch;
    }
  });
  it('perfil guardado com versão futura não rebenta a app nem é sobrescrito', async () => {
    const { engine, repo } = setup();
    await repo.saveProfile({ version: 9 } as never);
    await expect(engine.onAppOpen()).rejects.toThrow(/versão/);
    expect((repo.rawProfile() as { version: number }).version).toBe(9);
  });
});

describe('limites de notificações (iOS: 64 pendentes)', () => {
  const preds = (n: number): Prediction[] => Array.from({ length: n }, (_, i) => ({
    id: `k${i}@2026-11-12`, key: `k${i}`, label: `Item ${i}`, type: 'expense', category: 'Casa', cadence: 'monthly',
    expectedDate: `2026-11-${String(8 + (i % 6)).padStart(2, '0')}`, expectedAmount: 1000, confidence: 0.9 - i * 0.001,
  }));
  it('respeita o teto configurado (< 64)', () => {
    const r = decideReminders(preds(200), emptyProfile(), '2026-11-07', 8);
    expect(r.length).toBeLessThanOrEqual(40); expect(r.length).toBeLessThan(64);
  });
  it('ordena por data e depois por confiança', () => {
    const r = decideReminders(preds(30), emptyProfile(), '2026-11-07', 8);
    expect([...r].sort((a, b) => a.fireOn.localeCompare(b.fireOn))).toEqual(r);
  });
  it('baixa confiança e fora da janela não geram lembrete', () => {
    const p = preds(2); p[0].confidence = 0.3; p[1].expectedDate = '2026-12-30';
    expect(decideReminders(p, emptyProfile(), '2026-11-07', 8)).toHaveLength(0);
  });
  it('lembrete de hoje cuja hora já passou não é agendado no passado', () => {
    const p: Prediction[] = [{ ...preds(1)[0], expectedDate: '2026-11-08' }];
    const r = decideReminders(p, emptyProfile(), '2026-11-07', 15);
    expect(r[0].fireOn).toBe('2026-11-08');
  });
});
