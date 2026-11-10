// Datas 'YYYY-MM-DD' sem fuso (igual ao formato do app). Aritmética em UTC para evitar problemas de DST.
const MS = 86400000;
const p2 = (n: number) => (n < 10 ? "0" : "") + n;
export const parseDate = (s: string): number => {
  const [y, m, d] = s.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
export const fmtDate = (t: number): string => {
  const d = new Date(t);
  return `${d.getUTCFullYear()}-${p2(d.getUTCMonth() + 1)}-${p2(d.getUTCDate())}`;
};
export const addDays = (s: string, n: number): string =>
  fmtDate(parseDate(s) + n * MS);
export const diffDays = (a: string, b: string): number =>
  Math.round((parseDate(a) - parseDate(b)) / MS);
export const daysInMonth = (y: number, m1to12: number): number =>
  new Date(Date.UTC(y, m1to12, 0)).getUTCDate();
export const dayOf = (s: string): number => Number(s.slice(8, 10));
export const monthIndex = (s: string): number =>
  Number(s.slice(0, 4)) * 12 + Number(s.slice(5, 7)) - 1;
export const dimOf = (s: string): number =>
  daysInMonth(Number(s.slice(0, 4)), Number(s.slice(5, 7)));
export const weekdayOf = (s: string): number =>
  new Date(parseDate(s)).getUTCDay();
/** Data no mês indicado por índice (ano*12+mês0), com o dia limitado ao último dia do mês. */
export const dateFromMonthIndex = (idx: number, day: number): string => {
  const y = Math.floor(idx / 12),
    m = (idx % 12) + 1;
  return `${y}-${p2(m)}-${p2(Math.min(day, daysInMonth(y, m)))}`;
};
export const isValidDate = (s: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) && fmtDate(parseDate(s)) === s;
