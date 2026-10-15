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
  const candidate = adjustBusinessDay ? adjustToBusinessDay(raw) : raw;

  // Rede de segurança: o salário nunca pode ser lançado no mês a que não pertence.
  const adjusted = monthKey(candidate) === monthKey(raw) ? candidate : raw;

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

  // Regra do projeto: recuar para a sexta anterior.
  // Só é válido enquanto não sair do mês de origem — com dia 1 ou 2 isso
  // devolveria o salário no mês anterior (01-11-2026 é domingo -> 30-10).
  const weekday = parseISO(iso).getDay();
  const backwards = addDays(iso, weekday === 6 ? -1 : -2);

  if (monthKey(backwards) === monthKey(iso)) {
    return backwards;
  }

  // Recuar não cabe: avançar para o próximo dia útil dentro do mesmo mês.
  for (const step of [1, 2]) {
    const forward = addDays(iso, step);
    if (!isWeekend(forward) && monthKey(forward) === monthKey(iso)) {
      return forward;
    }
  }

  // Último dia do mês em fim de semana: recuar 1-2 dias nunca sai do mês.
  return isWeekend(addDays(iso, -1)) ? addDays(iso, -2) : addDays(iso, -1);
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
