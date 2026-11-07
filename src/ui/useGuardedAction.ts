import { useCallback } from "react";

import { runGuardedAction } from "./actionGuard";

/**
 * Guarda contra duplo-toque em ações de navegação/modal.
 * Usa um cooldown global partilhado para evitar empilhar ecrãs modais.
 */
export function useGuardedAction(action: () => void): () => void {
  return useCallback(() => {
    runGuardedAction(action);
  }, [action]);
}
