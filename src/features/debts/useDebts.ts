import { useCallback, useMemo, useState } from 'react';

import { formatDayMonthPt, todayISO } from '../../domain/dates';
import { formatKz } from '../../domain/money';
import {
  createDebt,
  deleteDebt,
  deleteDebtPayment,
  listDebtPayments,
  listDebts,
  payDebt,
  updateDebt,
  updateDebtPayment,
  debtTotals,
  debtView,
  type DebtInput,
  type DebtView,
} from '../../repos/debts';

export function useDebts() {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((value) => value + 1), []);
  const today = todayISO();

  const views = useMemo(() => {
    void tick;
    return listDebts().map((debt) => debtView(debt, today));
  }, [tick, today]);

  const totals = useMemo(() => {
    void tick;
    return debtTotals();
  }, [tick]);

  return {
    today,
    views,
    totals,
    refresh,
    create: (input: DebtInput) => {
      const row = createDebt(input);
      refresh();
      return row;
    },
    update: (id: string, input: DebtInput) => {
      updateDebt(id, input);
      refresh();
    },
    remove: (id: string) => {
      deleteDebt(id);
      refresh();
    },
    pay: (id: string, amount: number, date?: string) => {
      payDebt(id, amount, date);
      refresh();
    },
    payments: (id: string) => {
      void tick;
      return listDebtPayments(id);
    },
    updatePayment: (paymentId: string, amount: number, date: string) => {
      updateDebtPayment(paymentId, amount, date);
      refresh();
    },
    removePayment: (paymentId: string) => {
      deleteDebtPayment(paymentId);
      refresh();
    },
  };
}

export function debtStatusLabel(view: DebtView): string {
  if (view.status === 'paid') {
    return 'Liquidada';
  }
  if (view.status === 'overdue') {
    return 'Atrasada';
  }
  return 'Em aberto';
}

export function debtMeta(view: DebtView): string {
  if (view.status === 'paid') {
    return `Liquidada · ${formatDayMonthPt(view.debt.due_date ?? view.debt.loan_date)}`;
  }

  const suffix =
    view.debt.due_date !== null
      ? view.debt.due_date < todayISO()
        ? `venceu a ${formatDayMonthPt(view.debt.due_date)}`
        : `vence a ${formatDayMonthPt(view.debt.due_date)}`
      : 'sem vencimento';

  return `Falta ${formatKz(view.remaining)} · ${suffix}`;
}
