import { useCallback } from "react";

import { executarAcaoProtegida } from "./protecaoAcoes";

/**
 * Guarda contra duplo-toque em ações de navegação/modal.
 * Usa um cooldown global partilhado para evitar empilhar ecrãs modais.
 */
export function useAcaoProtegida(action: () => void): () => void {
  return useCallback(() => {
    executarAcaoProtegida(action);
  }, [action]);
}
