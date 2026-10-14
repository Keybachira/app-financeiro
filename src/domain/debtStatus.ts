export type DebtStatus = 'paid' | 'overdue' | 'open';

export function debtRemaining(total: number, paid: number): number {
  return Math.max(0, total - paid);
}

export function debtStatus(total: number, paid: number, dueDate: string | null, today: string): DebtStatus {
  if (debtRemaining(total, paid) === 0) {
    return 'paid';
  }

  if (dueDate !== null && dueDate < today) {
    return 'overdue';
  }

  return 'open';
}

export function debtSummary(debts: { kind: 'owe' | 'owed'; total: number; paid: number }[]): {
  owe: number;
  owed: number;
} {
  let owe = 0;
  let owed = 0;

  for (const debt of debts) {
    const remaining = debtRemaining(debt.total, debt.paid);

    if (debt.kind === 'owe') {
      owe += remaining;
    } else {
      owed += remaining;
    }
  }

  return { owe, owed };
}
