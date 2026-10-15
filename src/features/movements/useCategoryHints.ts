import { useEffect, useMemo, useState } from 'react';

import { subscribeDataVersion } from '../../repos/dataVersion';
import { listCategoryHints } from '../../repos/movements';

export function useCategoryHints(): { keyword: string; category: string }[] {
  const [version, setVersion] = useState(0);

  // Importar um backup substitui `category_hints`; sem esta subscrição as
  // sugestões continuavam a vir da base antiga até reiniciar a app.
  useEffect(
    () =>
      subscribeDataVersion(() => {
        setVersion((value) => value + 1);
      }),
    []
  );

  return useMemo(() => {
    void version; // força reavaliação
    return listCategoryHints();
  }, [version]);
}