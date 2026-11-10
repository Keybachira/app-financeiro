import { useMemo } from "react";

import { formatKzNumber } from "../../domain/money";
import { suggestCategory } from "../../domain/categoryHints";
import { lastMovement, quickPicks } from "../../domain/quickPicks";
import { recentMovements } from "../../repos/movements";
import { useSugestoesCategoria } from "./useSugestoesCategoria";

export { useSugestoesCategoria };

export type DadosChipRapido = {
  key: string;
  label: string;
  note: string | null;
  amount: number;
  type: "income" | "expense";
  category: string | null;
  highlighted: boolean;
};

/**
 * Atalhos do editor de movimentos: o último movimento e os pares
 * nota+valor mais repetidos nos últimos 60 dias.
 *
 * Cada chip já traz o tipo e a categoria sugerida para que um toque crie o
 * movimento sem passar pelo formulário.
 */
export function useChipsRapidos(today: string, limit = 2): DadosChipRapido[] {
  const hints = useSugestoesCategoria();

  return useMemo(() => {
    const movements = recentMovements(60, today, 100);
    const last = lastMovement(movements);
    const pairs = quickPicks(movements, today, 60, limit);
    const chips: DadosChipRapido[] = [];

    if (last) {
      const lastNote =
        last.note && last.note.trim().length > 0 ? last.note : null;
      const fallbackLabel = last.type === "income" ? "Receita" : "Despesa";

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
        key: `pair-${pair.type}-${pair.note}-${pair.amount}`,
        label: `${pair.note} ${formatKzNumber(pair.amount)}`,
        note: pair.note,
        amount: pair.amount,
        type: pair.type,
        category: suggestCategory(pair.note, hints),
        highlighted: false,
      });
    }

    return chips;
  }, [today, limit, hints]);
}
