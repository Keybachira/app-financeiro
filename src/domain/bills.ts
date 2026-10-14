import { dateWithClampedDay, monthKey, monthWithOffset } from './dates';

export type Bill = {
  id: string;
  amount: number;
  dayOfMonth: number;
  active: boolean;
};

export function nextBillDueDate(
  bill: { dayOfMonth: number },
  today: string,
  isPaidMonth: (month: string) => boolean
): string {
  let candidate = today;

  for (let offset = 0; offset < 24; offset += 1) {
    const { year, month } = monthWithOffset(today, offset);
    candidate = dateWithClampedDay(year, month, bill.dayOfMonth);

    if (candidate < today) {
      continue;
    }

    if (isPaidMonth(monthKey(candidate))) {
      continue;
    }

    return candidate;
  }

  return candidate;
}

export function billsUnpaidThisMonth(
  bills: Bill[],
  currentMonth: string,
  isPaidMonth: (month: string) => boolean
): number {
  return bills
    .filter((bill) => bill.active && !isPaidMonth(currentMonth))
    .reduce((sum, bill) => sum + bill.amount, 0);
}
