import { useMemo } from 'react';

import { listCategoryHints } from '../../repos/movements';

export function useCategoryHints(): { keyword: string; category: string }[] {
  return useMemo(() => listCategoryHints(), []);
}
