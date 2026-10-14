import { useCallback, useEffect, useMemo, useState } from 'react';

import { monthKey, todayISO } from '../../domain/dates';
import {
  billView,
  billsMonthProgress,
  billsUnpaidTotal,
  createBill,
  deleteBill,
  deleteBillPayment,
  getBill,
  isBillPaidInMonth,
  listBillPayments,
  listBills,
  payBill,
  rescheduleAllBillNotifications,
  setBillActive,
  updateBill,
  type BillInput,
} from '../../repos/bills';

export function useBillsSummary() {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((value) => value + 1), []);
  const today = todayISO();
  const month = monthKey(today);

  const openCount = useMemo(() => {
    void tick;
    return listBills().filter((bill) => bill.active === 1 && !isBillPaidInMonth(bill.id, month)).length;
  }, [tick, month]);

  return { openCount, refresh };
}

export function useBills() {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((value) => value + 1), []);
  const today = todayISO();
  const month = monthKey(today);

  useEffect(() => {
    void rescheduleAllBillNotifications();
  }, [tick]);

  const views = useMemo(() => {
    void tick;
    return listBills().map((bill) => billView(bill, today));
  }, [tick, today]);

  const unpaidTotal = useMemo(() => {
    void tick;
    return billsUnpaidTotal(month);
  }, [tick, month]);

  const progress = useMemo(() => {
    void tick;
    return billsMonthProgress(month);
  }, [tick, month]);

  const open = views.filter((view) => view.bill.active === 1 && !view.paidThisMonth);
  const payable = views.filter((view) => view.bill.active === 1 && view.status !== 'paid');

  return {
    today,
    month,
    views,
    open,
    payable,
    unpaidTotal,
    progress,
    refresh,
    create: (input: BillInput) => {
      const row = createBill(input);
      refresh();
      return row;
    },
    update: (id: string, input: BillInput) => {
      updateBill(id, input);
      refresh();
    },
    remove: (id: string) => {
      deleteBill(id);
      refresh();
    },
    toggleActive: (id: string, active: boolean) => {
      setBillActive(id, active);
      refresh();
    },
    pay: (id: string) => {
      payBill(id);
      refresh();
    },
    payments: (id: string) => {
      void tick;
      return listBillPayments(id);
    },
    removePayment: (paymentId: string) => {
      deleteBillPayment(paymentId);
      refresh();
    },
    bill: (id: string) => {
      void tick;
      const row = getBill(id);
      return row ? billView(row, today) : null;
    },
  };
}
