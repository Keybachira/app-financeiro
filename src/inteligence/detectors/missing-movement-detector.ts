import { DEFAULT_CONFIG, IntelligenceConfig, MissingMovement, Observation } from '../types/intelligence.types';
import { diffDays } from '../time/dates';
import { expectedDates } from './recurrence-detector';

/**
 * Movimento esperado que não apareceu. Reporta apenas 1–2 falhas seguidas;
 * mais do que isso indica que o padrão acabou (não incomoda o utilizador).
 */
export function detectMissing(
  obs: Array<{ o: Observation; confidence: number }>,
  today: string,
  cfg: IntelligenceConfig = DEFAULT_CONFIG,
): MissingMovement[] {
  const out: MissingMovement[] = [];
  for (const { o, confidence } of obs) {
    const missed = expectedDates(o, today).filter((d) => diffDays(today, d) > cfg.dateToleranceDays);
    if (missed.length < 1 || missed.length > 2) continue;
    out.push({ key: o.key, label: o.label, expectedDate: missed[missed.length - 1], expectedAmount: o.medianAmount, missedCount: missed.length, confidence });
  }
  return out;
}
