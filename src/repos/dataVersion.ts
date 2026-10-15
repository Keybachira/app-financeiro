/**
 * Versão dos dados em memória.
 *
 * Vários hooks leem definições no `useState` inicial (PIN, limite mensal,
 * sugestões de categoria) e mantêm esse valor enquanto o ecrã estiver montado.
 * Uma importação de backup muda essas tabelas sem remontar nada, pelo que o
 * estado ficava desatualizado até reiniciar a app — no caso do PIN, o
 * utilizador via "PIN incorreto" para um PIN que já não era o seu.
 *
 * `bumpDataVersion()` é chamado depois de qualquer escrita que invalide
 * Definições; os hooks subscritos relêem do SQLite.
 */
let version = 0;
const listeners = new Set<() => void>();

export function getDataVersion(): number {
  return version;
}

export function bumpDataVersion(): void {
  version += 1;
  for (const listener of [...listeners]) {
    listener();
  }
}

export function subscribeDataVersion(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}