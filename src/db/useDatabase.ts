import { useState } from 'react';

import { purgeAutomaticCategoryHints } from '../repos/movements';
import { ensureDatabase } from './client';

export function useDatabase(): { ready: boolean; error: Error | null } {
  const [state] = useState(() => {
    try {
      ensureDatabase();
      // Corre depois das migrações, que fazem o backfill de `origin`: só aí é
      // possível distinguir em código a nota automática da nota do utilizador.
      purgeAutomaticCategoryHints();
      return { ready: true, error: null };
    } catch (error) {
      return { ready: false, error: error as Error };
    }
  });

  return state;
}
