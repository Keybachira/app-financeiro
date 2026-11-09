import {
  Anomaly, BehaviorProfile, Confirmation, DEFAULT_CONFIG, IntelligenceConfig, IntelligenceRepository,
  MissingMovement, NotificationScheduler, Observation, Prediction, Reminder,
} from '../types/intelligence.types';
import { Clock } from '../time/clock';
import { addDays } from '../time/dates';
import { detectRecurrences, expectedDates } from '../detectors/recurrence-detector';
import { detectMissing } from '../detectors/missing-movement-detector';
import { detectAnomalies } from '../detectors/anomaly-detector';
import { migrateProfile } from '../learning/behavior-profile';
import { scoreConfidence } from '../learning/confidence-scorer';
import { FeedbackKind, applyFeedback, isSilenced } from '../learning/feedback-learner';
import { syncReminders } from '../reminders/reminder-engine';
import { fingerprint, shouldAnalyze } from '../analysis-scheduler';

export interface IntelligenceResult {
  observations: Observation[];
  predictions: Prediction[];
  missing: MissingMovement[];
  anomalies: Anomaly[];
  reminders: Reminder[];
  profile: BehaviorProfile;
}

export interface EngineDeps {
  repo: IntelligenceRepository;
  scheduler: NotificationScheduler;
  clock: Clock;
  config?: Partial<IntelligenceConfig>;
}

/**
 * Ciclo: recolher histórico → analisar → calcular confiança → decidir → agendar → aprender.
 * TypeScript puro: só as portas (repo, scheduler) tocam em SQLite/Expo.
 */
export function createIntelligenceEngine(deps: EngineDeps) {
  const cfg: IntelligenceConfig = { ...DEFAULT_CONFIG, ...deps.config };
  const { repo, scheduler, clock } = deps;

  async function loadProfile(): Promise<BehaviorProfile> {
    return migrateProfile(await repo.loadProfile());
  }

  async function run(opts: { reschedule: boolean }): Promise<IntelligenceResult> {
    const today = clock.today();
    const movs = await repo.loadMovements(addDays(today, -cfg.historyDays));
    const profile = await loadProfile();

    const scored = detectRecurrences(movs, cfg)
      .map((o) => ({ o, confidence: scoreConfidence(o, profile.patterns[o.key], today, cfg) }))
      .filter(({ o }) => !isSilenced(profile, o.key, today));

    const predictions: Prediction[] = [];
    const horizon = addDays(today, cfg.reminderWindowDays);
    for (const { o, confidence } of scored) {
      for (const d of expectedDates(o, horizon)) {
        if (d < today) continue;
        predictions.push({
          id: `${o.key}@${d}`, key: o.key, label: o.label, type: o.type, category: o.category, cadence: o.cadence,
          expectedDate: d, expectedAmount: o.medianAmount, confidence,
        });
      }
    }

    const missing = detectMissing(scored, today, cfg);
    const recent = movs.filter((m) => m.date >= addDays(today, -cfg.anomalyLookbackDays));
    const anomalies = detectAnomalies(movs, recent, cfg);

    const next: BehaviorProfile = { ...profile, lastAnalysis: { date: today, fingerprint: fingerprint(movs) } };
    await repo.saveProfile(next);

    const reminders = opts.reschedule ? await syncReminders({ scheduler, clock, config: cfg }, predictions, next) : [];
    return { observations: scored.map((s) => s.o), predictions, missing, anomalies, reminders, profile: next };
  }

  return {
    /** Só calcula (sem agendar). */
    analyze: () => run({ reschedule: false }),
    /** Ao abrir a app: recalcula e reagenda a janela (idempotente). */
    onAppOpen: () => run({ reschedule: true }),
    /** Depois de criar/editar/apagar um movimento: só reanalisa se o histórico mudou. */
    async onMovementsChanged(): Promise<IntelligenceResult | null> {
      const movs = await repo.loadMovements(addDays(clock.today(), -cfg.historyDays));
      const profile = await loadProfile();
      if (!shouldAnalyze(profile.lastAnalysis, clock.today(), fingerprint(movs))) return null;
      return run({ reschedule: true });
    },
    /** O utilizador diz que a previsão é válida (ou não). Atualiza o perfil e reagenda. */
    async recordFeedback(key: string, kind: FeedbackKind): Promise<IntelligenceResult> {
      const profile = await loadProfile();
      await repo.saveProfile(applyFeedback(profile, key, kind, clock.today(), cfg));
      return run({ reschedule: true });
    },
    /** CONFIRMAÇÃO: validar que a previsão aconteceu. Não cria movimento — isso é decisão do UI/repositórios. */
    async confirmPrediction(p: Prediction, movementId: string | null = null): Promise<{ confirmation: Confirmation; result: IntelligenceResult }> {
      const confirmation: Confirmation = { predictionId: p.id, key: p.key, confirmedOn: clock.today(), movementId };
      return { confirmation, result: await this.recordFeedback(p.key, 'confirm') };
    },
  };
}
