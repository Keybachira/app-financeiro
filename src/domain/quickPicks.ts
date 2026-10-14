import { addDays } from './dates';

export type QuickMovement = {
  type: 'income' | 'expense';
  amount: number;
  note: string | null;
  date: string;
};

export type QuickPick = {
  note: string;
  amount: number;
  count: number;
};

export function lastMovement<T extends QuickMovement>(movements: T[]): T | null {
  let latest: T | null = null;

  for (const movement of movements) {
    if (latest === null || movement.date >= latest.date) {
      latest = movement;
    }
  }

  return latest;
}

export function quickPicks(
  movements: QuickMovement[],
  today: string,
  days = 60,
  limit = 2
): QuickPick[] {
  const since = addDays(today, -days);
  const counts = new Map<string, QuickPick & { lastDate: string }>();

  for (const movement of movements) {
    const note = movement.note?.trim();

    if (!note || movement.date < since || movement.date > today) {
      continue;
    }

    const key = `${note}\u0000${movement.amount}`;
    const existing = counts.get(key);

    if (existing) {
      existing.count += 1;
      existing.lastDate = movement.date > existing.lastDate ? movement.date : existing.lastDate;
    } else {
      counts.set(key, { note, amount: movement.amount, count: 1, lastDate: movement.date });
    }
  }

  return [...counts.values()]
    .sort((a, b) => b.count - a.count || (b.lastDate > a.lastDate ? 1 : b.lastDate < a.lastDate ? -1 : 0))
    .slice(0, limit)
    .map(({ note, amount, count }) => ({ note, amount, count }));
}
