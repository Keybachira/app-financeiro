import { BehaviorProfile, PatternFeedback } from "../types/intelligence.types";

export const PROFILE_VERSION = 1 as const;
export const emptyProfile = (): BehaviorProfile => ({
  version: PROFILE_VERSION,
  patterns: {},
  lastAnalysis: null,
});
export const emptyFeedback = (): PatternFeedback => ({
  confirmations: 0,
  rejections: 0,
  silencedUntil: null,
  lastFeedbackOn: null,
});

export class UnsupportedProfileVersion extends Error {
  constructor(public readonly found: number) {
    super(
      `Perfil de inteligência com versão ${found}, superior à suportada (${PROFILE_VERSION}). Atualiza a app.`,
    );
  }
}

const isObj = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x);
const nn = (x: unknown) =>
  typeof x === "number" && Number.isFinite(x) && x >= 0 ? Math.floor(x) : 0;
const ds = (x: unknown) =>
  typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x) ? x : null;

/**
 * Migra qualquer forma guardada para a versão atual.
 * - null/lixo → perfil vazio (a app nunca falha por causa de dados de inteligência)
 * - v0 (legado): { feedback: { [chave]: { ok, no } } } → v1
 * - versão futura → lança UnsupportedProfileVersion (quem chama decide; nada é apagado)
 */
export function migrateProfile(raw: unknown): BehaviorProfile {
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return emptyProfile();
    }
  }
  if (!isObj(raw)) return emptyProfile();
  const v = raw.version;
  if (typeof v === "number" && v > PROFILE_VERSION)
    throw new UnsupportedProfileVersion(v);

  if (v === undefined || v === 0) {
    const out = emptyProfile();
    const fb = isObj(raw.feedback) ? raw.feedback : {};
    for (const [k, val] of Object.entries(fb)) {
      if (!isObj(val)) continue;
      out.patterns[k] = {
        ...emptyFeedback(),
        confirmations: nn(val.ok),
        rejections: nn(val.no),
      };
    }
    return out;
  }

  const out = emptyProfile();
  if (isObj(raw.patterns)) {
    for (const [k, val] of Object.entries(raw.patterns)) {
      if (!isObj(val)) continue;
      out.patterns[k] = {
        confirmations: nn(val.confirmations),
        rejections: nn(val.rejections),
        silencedUntil: ds(val.silencedUntil),
        lastFeedbackOn: ds(val.lastFeedbackOn),
      };
    }
  }
  if (
    isObj(raw.lastAnalysis) &&
    ds(raw.lastAnalysis.date) &&
    typeof raw.lastAnalysis.fingerprint === "string"
  ) {
    out.lastAnalysis = {
      date: raw.lastAnalysis.date as string,
      fingerprint: raw.lastAnalysis.fingerprint,
    };
  }
  return out;
}
