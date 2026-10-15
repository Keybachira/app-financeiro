import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';

import { listMovementsForMonth, type MovementRow } from '../../repos/movements';

export function useMonthMovements(
  month: string,
  search = ''
): { movements: MovementRow[]; refresh: () => void } {
  // `search` chega a cada tecla e o `refresh` fazia logo uma query SQLite
  // síncrona, pelo que a lista piscava a cada caractere. `useDeferredValue`
  // mantém o campo instantâneo e deixa a lista apanhar o valor antigo até a
  // query pesada ter tempo de terminar.
  const deferredSearch = useDeferredValue(search);
  const [movements, setMovements] = useState<MovementRow[]>(() => listMovementsForMonth(month, search));

  const refresh = useCallback(() => {
    setMovements(listMovementsForMonth(month, deferredSearch));
  }, [month, deferredSearch]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return useMemo(() => ({ movements, refresh }), [movements, refresh]);
}
