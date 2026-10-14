export type SpendablePerDay = {
  amount: number;
  overLimit: boolean;
};

export function monthNet(income: number, expenses: number, goalDeposits: number, goalWithdrawals: number): number {
  return income - expenses - (goalDeposits - goalWithdrawals);
}

export function spendablePerDay(
  limit: number | null,
  monthSpent: number,
  unpaidBills: number,
  daysToNextSalary: number
): SpendablePerDay {
  if (limit === null) {
    return { amount: Number.POSITIVE_INFINITY, overLimit: false };
  }

  const days = Math.max(1, Math.floor(daysToNextSalary));
  const available = (limit - monthSpent - unpaidBills) / days;

  if (available < 0) {
    return { amount: 0, overLimit: true };
  }

  return { amount: available, overLimit: false };
}
