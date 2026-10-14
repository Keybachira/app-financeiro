const WEEKDAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MONTH_NAMES_PT = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 86400000;

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function monthDaysOf(iso: string): number {
  const date = parseISO(iso);
  return daysInMonth(date.getFullYear(), date.getMonth() + 1);
}

export function daysLeftInMonth(iso: string): number {
  const date = parseISO(iso);
  return daysInMonth(date.getFullYear(), date.getMonth() + 1) - date.getDate() + 1;
}

export function isValidDate(iso: string): boolean {
  if (!DATE_PATTERN.test(iso)) {
    return false;
  }

  const [year, month, day] = iso.split('-').map(Number);
  if (month < 1 || month > 12) {
    return false;
  }

  return day >= 1 && day <= daysInMonth(year, month);
}

export function parseISO(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function toISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayISO(now: Date = new Date()): string {
  return toISO(now);
}

export function addDays(iso: string, days: number): string {
  const date = parseISO(iso);
  date.setDate(date.getDate() + days);
  return toISO(date);
}

export function addMonths(iso: string, months: number): string {
  const date = parseISO(iso);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const lastDay = daysInMonth(date.getFullYear(), date.getMonth() + 1);
  date.setDate(Math.min(day, lastDay));
  return toISO(date);
}

export function dateWithClampedDay(year: number, month: number, day: number): string {
  const clamped = Math.min(Math.max(day, 1), daysInMonth(year, month));
  return `${year}-${String(month).padStart(2, '0')}-${String(clamped).padStart(2, '0')}`;
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function monthWithOffset(iso: string, offset: number): { year: number; month: number } {
  const date = parseISO(iso);
  const total = date.getFullYear() * 12 + date.getMonth() + offset;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((utcTime(toIso) - utcTime(fromIso)) / MS_PER_DAY);
}

export function monthsBetween(fromIso: string, toIso: string): number {
  const from = parseISO(fromIso);
  const to = parseISO(toIso);
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());

  if (to.getDate() < from.getDate()) {
    months -= 1;
  }

  return months;
}

export function isBefore(iso: string, other: string): boolean {
  return iso < other;
}

export function isSameOrAfter(iso: string, other: string): boolean {
  return iso >= other;
}

export function isWeekend(iso: string): boolean {
  const weekday = parseISO(iso).getDay();
  return weekday === 0 || weekday === 6;
}

export function weekdayShort(iso: string): string {
  return WEEKDAYS_PT[parseISO(iso).getDay()];
}

export function monthShort(iso: string): string {
  return MONTHS_PT[Number(iso.slice(5, 7)) - 1];
}

export function monthNamePt(iso: string): string {
  const name = MONTH_NAMES_PT[Number(iso.slice(5, 7)) - 1];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function formatDayMonthPt(iso: string): string {
  return `${Number(iso.slice(8, 10))} ${monthShort(iso)}`;
}

export function formatShortPt(iso: string): string {
  return `${weekdayShort(iso)} ${formatDayMonthPt(iso)}`;
}

function utcTime(iso: string): number {
  const [year, month, day] = iso.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}
