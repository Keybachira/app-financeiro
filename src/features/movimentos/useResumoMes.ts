import { useCallback, useEffect, useMemo, useState } from "react";

import {
  monthNet,
  spendablePerDay,
  type SpendablePerDay,
} from "../../domain/balance";
import { daysLeftInMonth, monthDaysOf, monthKey } from "../../domain/dates";
import { daysUntilSalary, nextSalaryDate } from "../../domain/salary";
import {
  categoryExpenseTotals,
  dailyExpenseTotals,
  expensesOnDate,
  monthTotals,
  movementNetBefore,
} from "../../repos/movements";
import { goalNetBefore, monthGoalOps, reservedTotal } from "../../repos/goals";
import { billsUnpaidTotal } from "../../repos/bills";
import { subscribeDataVersion } from "../../repos/dataVersion";
import { useLimiteMensal, useDefinicoesSalario } from "../definicoes/useDefinicoes";

export type ResumoMes = {
  month: string;
  income: number;
  expenses: number;
  /** Saldo em carteira: o que transitou dos meses anteriores + o mês atual. */
  balance: number;
  /** Saldo trazido dos meses anteriores. */
  openingBalance: number;
  /** Líquido só do mês atual (receitas - despesas - metas). */
  monthBalance: number;
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

/**
 * Resumo financeiro do mês, fonte única das abas Início e Estatísticas.
 *
 * Junta totais do mês, gastos por dia e por categoria, limite mensal e diário,
 * contas por pagar e o saldo que transita dos meses anteriores. O saldo em
 * carteira = (líquido de todos os meses anteriores) + (líquido do mês), sem
 * descontar duas vezes o dinheiro reservado em metas.
 */
export function useResumoMes(today: string): {
  summary: ResumoMes;
  refresh: () => void;
} {
  const { limit, refresh: refreshLimit } = useLimiteMensal();
  const {
    salaryDay,
    adjustBusinessDay,
    refresh: refreshSalary,
  } = useDefinicoesSalario();
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => {
    refreshSalary();
    refreshLimit();
    setTick((value) => value + 1);
  }, [refreshSalary, refreshLimit]);

  // Escritas fora destes ecrãs (salário automático, importação de backup)
  // avisam por aqui para o resumo não ficar com valores antigos.
  useEffect(() => subscribeDataVersion(refresh), [refresh]);

  const summary = useMemo<ResumoMes>(() => {
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
      salaryDay === null
        ? null
        : nextSalaryDate({ salaryDay, adjustBusinessDay, today });
    const daysToSalary =
      nextSalary === null
        ? daysLeftInMonth(today)
        : daysUntilSalary(today, nextSalary);
    const monthDays = monthDaysOf(today);
    const goalOps = monthGoalOps(month);
    const unpaidBills = billsUnpaidTotal(month);
    const monthBalance = monthNet(
      income,
      expenses,
      goalOps.deposits,
      goalOps.withdraws,
    );
    // O dinheiro que sobrou nos meses anteriores continua a ser do utilizador:
    // o saldo do mês passado não pode desaparecer no dia 1. O valor reservado em
    // metas já sai do líquido de cada mês, por isso não é descontado outra vez.
    const openingBalance = movementNetBefore(month) - goalNetBefore(month);

    return {
      month,
      income,
      expenses,
      balance: openingBalance + monthBalance,
      openingBalance,
      monthBalance,
      reserved: reservedTotal(),
      limit,
      // Sem clamp: gastar 130% do limite tem de mostrar 130%, não 100%. O clamp
      // fica só na passagem para a `BarraProgresso`, que não consegue representar
      // mais do que a barra cheia.
      limitPercent: limit !== null && limit > 0 ? expenses / limit : 0,
      daily,
      dailyLimit: limit !== null && limit > 0 ? limit / monthDays : null,
      categories,
      todaySpent: expensesOnDate(today),
      spendable: spendablePerDay(limit, expenses, unpaidBills, daysToSalary),
      daysToSalary,
      nextSalary,
    };
  }, [today, limit, salaryDay, adjustBusinessDay, tick]);
  return { summary, refresh };
}
