import { useCallback, useMemo, useState } from 'react';

import { monthNet, spendablePerDay, type SpendablePerDay } from '../../domain/balance';
import { daysLeftInMonth, monthDaysOf, monthKey } from '../../domain/dates';
import { daysUntilSalary, nextSalaryDate } from '../../domain/salary';
import { categoryExpenseTotals, dailyExpenseTotals, expensesOnDate, monthTotals } from '../../repos/movements';
import { useMonthlyLimit, useSalarySettings } from '../settings/useSettings';

export type MonthSummary = {
  month: string;
  income: number;
  expenses: number;
  balance: number;
  reserved: number;
  limit: number | null;
  limitPercent: number;
  daily: Record<string, number>;
  dailyLimit: number | null;
  categories: { category: string; amount: number; share: number }[];
  todaySpent: number;
  spendable: SpendablePerDay;
  daysToSalary: number;
  nextSalary: string | null;
};

export function useMonthSummary(today: string): { summary: MonthSummary; refresh: () => void } {
  const { limit } = useMonthlyLimit();
  const { salaryDay, adjustBusinessDay } = useSalarySettings();
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((value) => value + 1), []);

  const summary = useMemo<MonthSummary>(() => {
    const month = monthKey(today);
    const totals = monthTotals(month);
    const expenses = totals.expenses;
    const income = totals.income;
    const daily = dailyExpenseTotals(month);
    const categories = categoryExpenseTotals(month).map((row) => ({
      category: row.category,
      amount: row.amount,
      share: expenses > 0 ? row.amount / expenses : 0,
    }));
    const nextSalary =
      salaryDay === null ? null : nextSalaryDate({ salaryDay, adjustBusinessDay, today });
    const daysToSalary = nextSalary === null ? daysLeftInMonth(today) : daysUntilSalary(today, nextSalary);
    const monthDays = monthDaysOf(today);
    return {
      month,
      income,
      expenses,
      balance: monthNet(income, expenses, 0, 0),
      reserved: 0,
      limit,
      limitPercent: limit !== null && limit > 0 ? Math.min(1, expenses / limit) : 0,
      daily,
      dailyLimit: limit !== null && limit > 0 ? limit / monthDays : null,
      categories,
      todaySpent: expensesOnDate(today),
      spendable: spendablePerDay(limit, expenses, 0, daysToSalary),
      daysToSalary,
      nextSalary,
    };
  }, [today, limit, salaryDay, adjustBusinessDay, tick]);

  return { summary, refresh };
}
