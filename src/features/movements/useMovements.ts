import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";

import { subscribeDataVersion } from "../../repos/dataVersion";
import {
  listMovements,
  listMovementsForMonth,
  type MovementRow,
} from "../../repos/movements";

/**
 * Lista completa de movimentos. É a fonte das abas Início, Movimentos e
 * Estatísticas: os ecrãs filtram e agrupam em memória, mas os valores vêm
 * sempre do SQLite.
 */
export function useAllMovements(): {
  movements: MovementRow[];
  refresh: () => void;
} {
  const [movements, setMovements] = useState<MovementRow[]>(() =>
    listMovements(),
  );
  const refresh = useCallback(() => setMovements(listMovements()), []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Uma importação de backup substitui a tabela sem remontar as abas.
  useEffect(() => subscribeDataVersion(refresh), [refresh]);

  return useMemo(() => ({ movements, refresh }), [movements, refresh]);
}

export function useMonthMovements(
  month: string,
  search = "",
): { movements: MovementRow[]; refresh: () => void } {
  // `search` chega a cada tecla e o `refresh` fazia logo uma query SQLite
  // síncrona, pelo que a lista piscava a cada caractere. `useDeferredValue`
  // mantém o campo instantâneo e deixa a lista apanhar o valor antigo até a
  // query pesada ter tempo de terminar.
  const deferredSearch = useDeferredValue(search);
  const [movements, setMovements] = useState<MovementRow[]>(() =>
    listMovementsForMonth(month, search),
  );

  const refresh = useCallback(() => {
    setMovements(listMovementsForMonth(month, deferredSearch));
  }, [month, deferredSearch]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return useMemo(() => ({ movements, refresh }), [movements, refresh]);
}
