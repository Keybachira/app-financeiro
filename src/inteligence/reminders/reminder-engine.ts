import { BehaviorProfile, DEFAULT_CONFIG, IntelligenceConfig, NotificationScheduler, Prediction, Reminder } from '../types/intelligence.types';
import { Clock } from '../time/clock';
import { decideReminders } from './reminder-policy';

/** Reagendamento idempotente: cancela os lembretes da inteligência e agenda a janela atual. */
export async function syncReminders(
  deps: { scheduler: NotificationScheduler; clock: Clock; config?: IntelligenceConfig },
  predictions: Prediction[],
  profile: BehaviorProfile,
): Promise<Reminder[]> {
  const cfg = deps.config ?? DEFAULT_CONFIG;
  const reminders = decideReminders(predictions, profile, deps.clock.today(), deps.clock.hour(), cfg);
  await deps.scheduler.cancelAll();
  if (reminders.length) await deps.scheduler.schedule(reminders);
  return reminders;
}
