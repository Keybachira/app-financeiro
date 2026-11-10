/**
 * Prote��o contra abertura duplicada de modais/a��es por duplo-toque ou eventos
 * concorrentes. Usa cooldown por chave para n�o bloquear a��es leg�timas
 * diferentes em sequ�ncia (ex.: abrir conta e depois pagar noutra intera��o).
 */
const ACTION_COOLDOWN_MS = 450;
const lastActionAtByKey = new Map<string, number>();

/**
 * Executa 'action' no máximo uma vez por 'key' a cada 450 ms.
 *
 * Devolve 'true' se a ação correu e 'false' se foi ignorada por estar dentro do
 * cooldown. A chave separa fluxos diferentes (abrir conta vs. pagar) para o
 * cooldown de um não bloquear o outro.
 */
export function executarAcaoProtegida(
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

/** Versão de 'executarAcaoProtegida' já embrulhada num callback sem argumentos. */
export function callbackProtegido(action: () => void, key?: string): () => void {
  return () => {
    executarAcaoProtegida(action, key);
  };
}

/** Limpa o estado do cooldown (usado entre testes). */
export function reiniciarProtecaoParaTestes(): void {
  lastActionAtByKey.clear();
}
