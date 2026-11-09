import { describe, expect, it } from '@jest/globals';
import { detectRecurrences } from '../detectors/recurrence-detector';
import { detectAnomalies } from '../detectors/anomaly-detector';
import { emptyProfile, migrateProfile, UnsupportedProfileVersion } from '../learning/behavior-profile';
import { scoreConfidence } from '../learning/confidence-scorer';
import { applyFeedback, isSilenced } from '../learning/feedback-learner';
import { mov } from '../helpers';

const obs = () => detectRecurrences([mov('2026-08-10', 15000, 'Internet'), mov('2026-09-10', 15000, 'Internet'), mov('2026-10-10', 15000, 'Internet')])[0];

describe('confiança e feedback', () => {
  it('fica entre 0 e 1 e confirmações aumentam', () => {
    const o = obs(), base = scoreConfidence(o, undefined, '2026-10-15');
    const p = applyFeedback(emptyProfile(), o.key, 'confirm', '2026-10-15');
    const up = scoreConfidence(o, p.patterns[o.key], '2026-10-15');
    expect(base).toBeGreaterThan(0.5); expect(up).toBeGreaterThan(base); expect(up).toBeLessThanOrEqual(1);
  });
  it('padrão velho perde confiança', () => {
    const o = obs();
    expect(scoreConfidence(o, undefined, '2027-03-01')).toBeLessThan(scoreConfidence(o, undefined, '2026-10-15'));
  });
  it('rejeição silencia temporariamente e prolonga com a repetição', () => {
    const o = obs();
    let p = applyFeedback(emptyProfile(), o.key, 'reject', '2026-10-15');
    expect(p.patterns[o.key].silencedUntil).toBe('2026-11-14');
    expect(isSilenced(p, o.key, '2026-11-01')).toBe(true);
    expect(isSilenced(p, o.key, '2026-11-14')).toBe(false);
    p = applyFeedback(p, o.key, 'reject', '2026-11-20');
    expect(p.patterns[o.key].silencedUntil).toBe('2027-01-19');
  });
  it('confirmar levanta o silêncio', () => {
    const o = obs();
    let p = applyFeedback(emptyProfile(), o.key, 'reject', '2026-10-15');
    p = applyFeedback(p, o.key, 'confirm', '2026-10-16');
    expect(isSilenced(p, o.key, '2026-10-17')).toBe(false);
  });
});

describe('migração do perfil', () => {
  it('lixo/null → vazio', () => { expect(migrateProfile(null)).toEqual(emptyProfile()); expect(migrateProfile('{x')).toEqual(emptyProfile()); expect(migrateProfile(42)).toEqual(emptyProfile()); });
  it('v0 legado → v1', () => {
    const p = migrateProfile({ feedback: { 'expense:internet': { ok: 2, no: 1 } } });
    expect(p.version).toBe(1); expect(p.patterns['expense:internet']).toMatchObject({ confirmations: 2, rejections: 1, silencedUntil: null });
  });
  it('v1 é idempotente e sanitiza campos', () => {
    const raw = { version: 1, patterns: { a: { confirmations: -3, rejections: 'x', silencedUntil: 'ontem' } }, lastAnalysis: null };
    const p = migrateProfile(raw);
    expect(p.patterns.a).toEqual({ confirmations: 0, rejections: 0, silencedUntil: null, lastFeedbackOn: null });
    expect(migrateProfile(JSON.stringify(p))).toEqual(p);
  });
  it('versão futura não é destruída: lança erro', () => { expect(() => migrateProfile({ version: 9 })).toThrow(UnsupportedProfileVersion); });
});

describe('anomalias', () => {
  const hist = [4000, 4200, 3900, 4100, 4000, 4300].map((v, i) => mov(`2026-09-0${i + 1}`, v, 'Almoço', 'Comida'));
  it('despesa muito acima da mediana da categoria', () => {
    const big = mov('2026-10-05', 40000, 'Jantar', 'Comida');
    expect(detectAnomalies([...hist, big], [big])).toHaveLength(1);
  });
  it('valor normal não é anomalia', () => {
    const ok = mov('2026-10-05', 4400, 'Almoço', 'Comida');
    expect(detectAnomalies([...hist, ok], [ok])).toHaveLength(0);
  });
  it('poucas amostras → sem anomalia', () => {
    const big = mov('2026-10-05', 40000, 'Jantar', 'Comida');
    expect(detectAnomalies([...hist.slice(0, 3), big], [big])).toHaveLength(0);
  });
});
