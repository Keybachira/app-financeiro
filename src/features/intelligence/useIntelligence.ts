import { useCallback, useEffect, useRef, useState } from "react";

import type { IntelligenceResult } from "../../inteligence";
import { subscribeDataVersion } from "../../repos/dataVersion";
import {
  intelligenceEngine,
  syncIntelligenceAfterMovementChange,
} from "./engine";

export type IntelligenceFeedback = "confirm" | "reject";

function messageOf(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Não foi possível analisar os movimentos.";
}

export function useIntelligence(): {
  result: IntelligenceResult | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  feedback: (key: string, kind: IntelligenceFeedback) => Promise<void>;
  busyKey: string | null;
} {
  const [result, setResult] = useState<IntelligenceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await intelligenceEngine.onAppOpen();
      if (mounted.current) setResult(next);
    } catch (cause) {
      if (mounted.current) setError(messageOf(cause));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  const feedback = useCallback(
    async (key: string, kind: IntelligenceFeedback) => {
      setBusyKey(`${key}:${kind}`);
      setError(null);
      try {
        const next = await intelligenceEngine.recordFeedback(key, kind);
        if (mounted.current) setResult(next);
      } catch (cause) {
        if (mounted.current) setError(messageOf(cause));
      } finally {
        if (mounted.current) setBusyKey(null);
      }
    },
    [],
  );

  return { result, loading, error, refresh, feedback, busyKey };
}

/** Recalcula e reagenda uma vez por abertura da app, sem bloquear o arranque. */
export function useIntelligenceBoot(ready: boolean): void {
  useEffect(() => {
    if (!ready) return;
    void intelligenceEngine.onAppOpen().catch(() => undefined);
  }, [ready]);

  // Importações de backup e lançamentos automáticos também alteram o histórico.
  useEffect(() => {
    if (!ready) return;
    return subscribeDataVersion(syncIntelligenceAfterMovementChange);
  }, [ready]);
}
