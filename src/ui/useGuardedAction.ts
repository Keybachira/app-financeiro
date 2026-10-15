import { useCallback, useRef } from 'react';

/**
 * Guarda contra duplo-toque em ações de navegação.
 *
 * Todos os `router.push` do projeto abrem um ecrã modal. Dois toques rápidos
 * empilhavam dois ecrãs: o utilizador tinha de fechar duas vezes, e o `back`
 * do primeiro não funcionava porque não havia ecrã abaixo dele. Isto era o
 * defeito de navegação mais irritante da app e não se manifestava em testes.
 *
 * `COOLDOWN_MS` tem de ser maior que o tempo da animação de transição do
 * `Stack` (180ms), senão o segundo toque passa enquanto o primeiro ecrã ainda
 * está a entrar.
 */
const COOLDOWN_MS = 400;

export function useGuardedAction(action: () => void): () => void {
  const lastRun = useRef(0);

return useCallback(() => {
  const now = Date.now();
  if (now - lastRun.current < COOLDOWN_MS) return;
  lastRun.current = now;
  console.log('GUARD: a executar action');
  action();
}, [action]);
}