import { BehaviorProfile, DEFAULT_CONFIG, IntelligenceConfig, PatternFeedback } from '../types/intelligence.types';
import { addDays } from '../time/dates';
import { emptyFeedback } from './behavior-profile';

export type FeedbackKind = 'confirm' | 'reject';

/** Imutável: devolve um novo perfil. Rejeitar silencia o padrão (cada rejeição prolonga, até 3×). */
export function applyFeedback(profile: BehaviorProfile, key: string, kind: FeedbackKind, today: string, cfg: IntelligenceConfig = DEFAULT_CONFIG): BehaviorProfile {
  const cur = profile.patterns[key] ?? emptyFeedback();
  let next: PatternFeedback;
  if (kind === 'confirm') {
    next = { confirmations: cur.confirmations + 1, rejections: Math.max(0, cur.rejections - 1), silencedUntil: null, lastFeedbackOn: today };
  } else {
    const rejections = cur.rejections + 1;
    next = { ...cur, rejections, silencedUntil: addDays(today, cfg.silenceDays * Math.min(rejections, 3)), lastFeedbackOn: today };
  }
  return { ...profile, patterns: { ...profile.patterns, [key]: next } };
}

export const isSilenced = (profile: BehaviorProfile, key: string, today: string): boolean => {
  const s = profile.patterns[key]?.silencedUntil;
  return !!s && s > today;
};
