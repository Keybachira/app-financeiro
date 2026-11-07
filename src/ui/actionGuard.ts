/**
 * Proteção contra abertura duplicada de modais/ações por duplo-toque ou eventos
 * concorrentes. Usa cooldown por chave para não bloquear ações legítimas
 * diferentes em sequência (ex.: abrir conta e depois pagar noutra interação).
 */
const ACTION_COOLDOWN_MS = 450;
const lastActionAtByKey = new Map<string, number>();

export function runGuardedAction(
  action: () => void,
  key = "__global__",
): boolean {
  const now = Date.now();
  const last = lastActionAtByKey.get(key) ?? 0;
  if (now - last < ACTION_COOLDOWN_MS) {
    return false;
  }
  lastActionAtByKey.set(key, now);
  action();
  return true;
}

export function guardedCallback(action: () => void, key?: string): () => void {
  return () => {
    runGuardedAction(action, key);
  };
}

export function resetActionGuardForTests(): void {
  lastActionAtByKey.clear();
}
