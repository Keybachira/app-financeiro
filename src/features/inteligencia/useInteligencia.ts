import { useCallback, useEffect, useRef, useState } from "react";

import type { IntelligenceResult } from "../../inteligence";
import { subscribeDataVersion } from "../../repos/dataVersion";
import {
  motorInteligencia,
  sincronizarInteligenciaAposMovimento,
} from "./motor";

export type FeedbackInteligencia = "confirm" | "reject";

function mensagemDe(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Não foi possível analisar os movimentos.";
}

/**
 * Estado do ecrã de inteligência: resultado da análise, carregamento, erro e
 * feedback ("confirmar"/"rejeitar") por sugestão.
 *
 * 'mounted' evita actualizar estado depois de o ecrã fechar; 'busyKey' marca
 * qual sugestão está a ser processada.
 */
export function useInteligencia(): {
  result: IntelligenceResult | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  feedback: (key: string, kind: FeedbackInteligencia) => Promise<void>;
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
      const next = await motorInteligencia.onAppOpen();
      if (mounted.current) setResult(next);
    } catch (cause) {
      if (mounted.current) setError(mensagemDe(cause));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  const feedback = useCallback(
    async (key: string, kind: FeedbackInteligencia) => {
      setBusyKey(`${key}:${kind}`);
      setError(null);
      try {
        const next = await motorInteligencia.recordFeedback(key, kind);
        if (mounted.current) setResult(next);
      } catch (cause) {
        if (mounted.current) setError(mensagemDe(cause));
      } finally {
        if (mounted.current) setBusyKey(null);
      }
    },
    [],
  );

  return { result, loading, error, refresh, feedback, busyKey };
}

/** Recalcula e reagenda uma vez por abertura da app, sem bloquear o arranque. */
export function useArranqueInteligencia(ready: boolean): void {
  useEffect(() => {
    if (!ready) return;
    void motorInteligencia.onAppOpen().catch(() => undefined);
  }, [ready]);

  // Importações de backup e lançamentos automáticos também alteram o histórico.
  useEffect(() => {
    if (!ready) return;
    return subscribeDataVersion(sincronizarInteligenciaAposMovimento);
  }, [ready]);
}
