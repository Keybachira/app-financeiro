import {
  BehaviorProfile,
  DEFAULT_CONFIG,
  IntelligenceConfig,
  Prediction,
  Reminder,
} from "../types/intelligence.types";
import { addDays } from "../time/dates";
import { isSilenced } from "../learning/feedback-learner";

const kz = (n: number) =>
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " Kz";

/**
 * Decide que previsões merecem lembrete. Puro: não agenda nada.
 * Janela móvel [hoje, hoje+N]; só confiança ≥ mínimo; ignora padrões silenciados; respeita o teto.
 */
export function decideReminders(
  predictions: Prediction[],
  profile: BehaviorProfile,
  today: string,
  nowHour: number,
  cfg: IntelligenceConfig = DEFAULT_CONFIG,
): Reminder[] {
  const limit = addDays(today, cfg.reminderWindowDays);
  const out: Array<Reminder & { _c: number }> = [];
  for (const p of predictions) {
    if (p.confidence < cfg.minConfidence) continue;
    if (isSilenced(profile, p.key, today)) continue;
    if (p.expectedDate < today || p.expectedDate > limit) continue;

    let fireOn = addDays(p.expectedDate, -cfg.remindDaysBefore);
    if (fireOn < today) fireOn = today;
    if (fireOn === today && nowHour >= cfg.reminderHour) {
      // a hora do lembrete de hoje já passou: só vale a pena se o evento ainda é hoje/amanhã
      if (p.expectedDate < addDays(today, 1)) continue;
      fireOn = addDays(today, 1);
      if (fireOn > p.expectedDate) continue;
    }
    const income = p.type === "income";
    out.push({
      id: p.id,
      predictionId: p.id,
      fireOn,
      hour: cfg.reminderHour,
      title: income ? "Possível receita a chegar" : "Possível despesa a chegar",
      body: `${p.label}: previsto para ${p.expectedDate} (~${kz(p.expectedAmount)}). É uma previsão, não um registo.`,
      _c: p.confidence,
    });
  }
  out.sort((a, b) =>
    a.fireOn < b.fireOn ? -1 : a.fireOn > b.fireOn ? 1 : b._c - a._c,
  );
  return out.slice(0, cfg.maxScheduled).map(({ _c, ...r }) => r);
}
