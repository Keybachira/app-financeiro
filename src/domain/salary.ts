import { addDays, dateWithClampedDay, daysBetween, isWeekend, monthKey, monthWithOffset, parseISO } from './dates';

export type SalarySettings = {
  amount: number | null;
  day: number | null;
  adjustBusinessDay: boolean;
  autoIncome: boolean;
  lastMonth: string | null;
};

export function pendingSalaryLaunch(
  settings: SalarySettings,
  today: string
): { month: string; date: string } | null {
  const { amount, day, adjustBusinessDay, autoIncome, lastMonth } = settings;

  if (!autoIncome || amount === null || amount <= 0 || day === null) {
    return null;
  }

  const date = parseISO(today);
  const raw = salaryDateForMonth(date.getFullYear(), date.getMonth() + 1, day);
  const adjusted = adjustBusinessDay ? adjustToBusinessDay(raw) : raw;

  if (adjusted > today) {
    return null;
  }

  const month = monthKey(adjusted);

  if (lastMonth === month) {
    return null;
  }

  return { month, date: adjusted };
}

export function salaryDateForMonth(year: number, month: number, day: number): string {
  return dateWithClampedDay(year, month, day);
}

export function adjustToBusinessDay(iso: string): string {
  if (!isWeekend(iso)) {
    return iso;
  }

  const weekday = parseISO(iso).getDay();
  const offset = weekday === 6 ? -1 : -2;
  return addDays(iso, offset);
}

export function nextSalaryDate(options: {
  salaryDay: number;
  adjustBusinessDay: boolean;
  today: string;
}): string {
  const { salaryDay, adjustBusinessDay, today } = options;

  let lastCandidate = today;

  for (let offset = 0; offset < 3; offset += 1) {
    const { year, month } = monthWithOffset(today, offset);
    const candidate = salaryDateForMonth(year, month, salaryDay);
    const adjusted = adjustBusinessDay ? adjustToBusinessDay(candidate) : candidate;
    lastCandidate = adjusted;

    if (adjusted >= today) {
      return adjusted;
    }
  }

  return lastCandidate;
}

export function daysUntilSalary(today: string, nextSalary: string): number {
  return Math.max(0, daysBetween(today, nextSalary));
}
