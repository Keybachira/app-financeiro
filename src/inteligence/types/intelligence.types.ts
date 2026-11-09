// Modelo alinhado com o esquema SQLite do plano: type 'income'|'expense', amount inteiro (Kz), date 'YYYY-MM-DD'.
export type MovementType = 'income' | 'expense';

export interface MovementInput {
  id: string;
  type: MovementType;
  amount: number;
  category: string;
  date: string;
  note: string | null;
  billId?: string | null;
}

export type Cadence = 'weekly' | 'monthly';

/** OBSERVAÇÃO: o algoritmo encontrou um padrão. Não é um facto financeiro. */
export interface Observation {
  key: string;
  label: string;
  type: MovementType;
  category: string;
  cadence: Cadence;
  occurrences: number;
  medianAmount: number;
  /** maior desvio relativo do valor face à mediana (0..1) */
  amountSpread: number;
  /** desvio médio absoluto da data, em dias */
  dateJitter: number;
  dayOfMonth: number | null;
  weekday: number | null;
  lastDate: string;
  movementIds: string[];
}

/** PREVISÃO: algo provável no futuro. Nunca vira movimento sem confirmação do utilizador. */
export interface Prediction {
  id: string;
  key: string;
  label: string;
  type: MovementType;
  category: string;
  cadence: Cadence;
  expectedDate: string;
  expectedAmount: number;
  confidence: number; // 0..1
}

/** CONFIRMAÇÃO: o utilizador validou que aquilo aconteceu (ou não). */
export interface Confirmation {
  predictionId: string;
  key: string;
  confirmedOn: string;
  movementId: string | null;
}

export interface MissingMovement {
  key: string;
  label: string;
  expectedDate: string;
  expectedAmount: number;
  missedCount: number;
  confidence: number;
}

export interface Anomaly {
  movementId: string;
  category: string;
  amount: number;
  median: number;
  score: number;
}

export interface Reminder {
  /** determinístico (= predictionId): permite reagendar sem duplicar */
  id: string;
  predictionId: string;
  fireOn: string; // 'YYYY-MM-DD' (hora local)
  hour: number;
  title: string;
  body: string;
}

export interface IntelligenceConfig {
  minOccurrences: number;
  dateToleranceDays: number;
  amountTolerancePct: number;
  historyDays: number;
  ignoreBillMovements: boolean;
  minConfidence: number;
  reminderWindowDays: number;
  remindDaysBefore: number;
  reminderHour: number;
  /** teto de notificações locais agendadas (o iOS aceita no máximo 64 pendentes) */
  maxScheduled: number;
  silenceDays: number;
  anomalyMinSamples: number;
  anomalyMadThreshold: number;
  anomalyLookbackDays: number;
}

export const DEFAULT_CONFIG: IntelligenceConfig = {
  minOccurrences: 3,
  dateToleranceDays: 3,
  amountTolerancePct: 0.15,
  historyDays: 400,
  ignoreBillMovements: true,
  minConfidence: 0.5,
  reminderWindowDays: 10,
  remindDaysBefore: 1,
  reminderHour: 9,
  maxScheduled: 40,
  silenceDays: 30,
  anomalyMinSamples: 5,
  anomalyMadThreshold: 3.5,
  anomalyLookbackDays: 7,
};

export interface PatternFeedback {
  confirmations: number;
  rejections: number;
  silencedUntil: string | null;
  lastFeedbackOn: string | null;
}

export interface BehaviorProfile {
  version: 1;
  patterns: Record<string, PatternFeedback>;
  lastAnalysis: { date: string; fingerprint: string } | null;
}

/* ───────── Portas (a única ligação ao mundo exterior) ───────── */
export interface IntelligenceRepository {
  loadMovements(sinceDate: string): Promise<MovementInput[]>;
  loadProfile(): Promise<unknown | null>;
  saveProfile(profile: BehaviorProfile): Promise<void>;
}

export interface NotificationScheduler {
  /** Cancela SÓ as notificações da inteligência (não as das contas fixas). */
  cancelAll(): Promise<void>;
  schedule(reminders: Reminder[]): Promise<void>;
}
