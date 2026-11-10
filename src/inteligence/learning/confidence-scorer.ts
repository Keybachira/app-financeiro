import {
  DEFAULT_CONFIG,
  IntelligenceConfig,
  Observation,
  PatternFeedback,
} from "../types/intelligence.types";
import { diffDays } from "../time/dates";

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/**
 * Confiança 0..1 = evidência (nº de ocorrências) + consistência de data + consistência de valor,
 * penalizada por padrão "velho" e ajustada pelo feedback (confirmações sobem, rejeições descem).
 */
export function scoreConfidence(
  o: Observation,
  fb: PatternFeedback | undefined,
  today: string,
  cfg: IntelligenceConfig = DEFAULT_CONFIG,
): number {
  const sEv = Math.min(o.occurrences, 6) / 6;
  const sDate = 1 - Math.min(1, o.dateJitter / (cfg.dateToleranceDays + 1));
  const sAmt = 1 - Math.min(1, o.amountSpread / cfg.amountTolerancePct);
  let c = 0.35 * sEv + 0.3 * sDate + 0.35 * sAmt;

  const interval = o.cadence === "weekly" ? 7 : 30;
  const overdue = diffDays(today, o.lastDate) / interval;
  if (overdue > 2) c *= Math.max(0.3, 1 - (overdue - 2) * 0.25);

  if (fb) c += 0.06 * Math.min(fb.confirmations, 5) - 0.15 * fb.rejections;
  return Math.round(clamp01(c) * 1000) / 1000;
}
