import {
  Anomaly,
  DEFAULT_CONFIG,
  IntelligenceConfig,
  MovementInput,
} from "../types/intelligence.types";
import { mad, median } from "../stats";

/**
 * Despesa invulgarmente alta face à mediana da categoria (desvio modificado por MAD).
 * Sem amostras suficientes não há anomalia — evita falsos alarmes com pouco histórico.
 */
export function detectAnomalies(
  all: MovementInput[],
  targets: MovementInput[],
  cfg: IntelligenceConfig = DEFAULT_CONFIG,
): Anomaly[] {
  const out: Anomaly[] = [];
  for (const t of targets) {
    if (t.type !== "expense" || t.billId) continue;
    const hist = all
      .filter(
        (m) =>
          m.id !== t.id &&
          m.type === "expense" &&
          m.category === t.category &&
          !m.billId,
      )
      .map((m) => m.amount);
    if (hist.length < cfg.anomalyMinSamples) continue;
    const med = median(hist),
      d = mad(hist);
    if (t.amount <= med) continue;
    const score = d > 0 ? (0.6745 * (t.amount - med)) / d : t.amount / med;
    const flagged =
      d > 0 ? score > cfg.anomalyMadThreshold : t.amount >= med * 2;
    if (flagged)
      out.push({
        movementId: t.id,
        category: t.category,
        amount: t.amount,
        median: med,
        score,
      });
  }
  return out;
}
