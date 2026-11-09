import { MovementInput } from './types/intelligence.types';

/** Impressão digital barata do histórico: muda quando se cria, edita ou apaga um movimento. */
export function fingerprint(movs: MovementInput[]): string {
  let sum = 0, maxDate = '';
  for (const m of movs) {
    sum = (sum + m.amount * 31 + m.date.length + [...m.id].reduce((a, c) => (a + c.charCodeAt(0)) % 1000003, 0)) % 1000000007;
    if (m.date > maxDate) maxDate = m.date;
  }
  return `${movs.length}:${maxDate}:${sum}`;
}

/** Só volta a analisar se o histórico mudou ou se passou de dia. */
export function shouldAnalyze(last: { date: string; fingerprint: string } | null, today: string, fp: string): boolean {
  return !last || last.date !== today || last.fingerprint !== fp;
}
