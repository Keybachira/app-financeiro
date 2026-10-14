import { useMemo } from 'react';

import { formatKzNumber } from '../../domain/money';
import { suggestCategory } from '../../domain/categoryHints';
import { lastMovement, quickPicks } from '../../domain/quickPicks';
import { recentMovements } from '../../repos/movements';
import { useCategoryHints } from './useCategoryHints';

export { useCategoryHints };

export type QuickChipData = {
  key: string;
  label: string;
  note: string | null;
  amount: number;
  type: 'income' | 'expense';
  category: string | null;
  highlighted: boolean;
};

export function useQuickChips(today: string, limit = 2): QuickChipData[] {
  const hints = useCategoryHints();

  return useMemo(() => {
    const movements = recentMovements(60, today, 100);
    const last = lastMovement(movements);
    const pairs = quickPicks(movements, today, 60, limit);
    const chips: QuickChipData[] = [];

    if (last) {
      const lastNote = last.note && last.note.trim().length > 0 ? last.note : null;
      const fallbackLabel = last.type === 'income' ? 'Receita' : 'Despesa';

      chips.push({
        key: `last-${last.id}`,
        label: `${lastNote ?? fallbackLabel} ${formatKzNumber(last.amount)}`,
        note: last.note,
        amount: last.amount,
        type: last.type,
        category: last.category,
        highlighted: true,
      });
    }

    for (const pair of pairs) {
      chips.push({
        key: `pair-${pair.note}-${pair.amount}`,
        label: `${pair.note} ${formatKzNumber(pair.amount)}`,
        note: pair.note,
        amount: pair.amount,
        type: 'expense',
        category: suggestCategory(pair.note, hints),
        highlighted: false,
      });
    }

    return chips;
  }, [today, limit, hints]);
}
