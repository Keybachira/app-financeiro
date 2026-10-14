import { useCallback, useEffect, useState } from 'react';

import { listMovementsForMonth, type MovementRow } from '../../repos/movements';

export function useMonthMovements(
  month: string,
  search = ''
): { movements: MovementRow[]; refresh: () => void } {
  const [movements, setMovements] = useState<MovementRow[]>(() => listMovementsForMonth(month, search));

  const refresh = useCallback(() => {
    setMovements(listMovementsForMonth(month, search));
  }, [month, search]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { movements, refresh };
}
