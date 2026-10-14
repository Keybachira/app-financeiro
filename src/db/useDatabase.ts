import { useState } from 'react';

import { ensureDatabase } from './client';

export function useDatabase(): { ready: boolean; error: Error | null } {
  const [state] = useState(() => {
    try {
      ensureDatabase();
      return { ready: true, error: null };
    } catch (error) {
      return { ready: false, error: error as Error };
    }
  });

  return state;
}
