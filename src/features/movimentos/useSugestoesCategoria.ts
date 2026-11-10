import { useEffect, useMemo, useState } from "react";

import { subscribeDataVersion } from "../../repos/dataVersion";
import { listCategoryHints } from "../../repos/movements";

/**
 * Pares palavra-chave → categoria aprendidos a partir das notas anteriores.
 *
 * Serve de memória para 'suggestCategory'; é relido quando a versão dos dados
 * muda (importação de backup, novo movimento).
 */
export function useSugestoesCategoria(): { keyword: string; category: string }[] {
  const [version, setVersion] = useState(0);

  // Importar um backup substitui `category_hints`; sem esta subscrição as
  // sugestões continuavam a vir da base antiga até reiniciar a app.
  useEffect(
    () =>
      subscribeDataVersion(() => {
        setVersion((value) => value + 1);
      }),
    [],
  );

  return useMemo(() => {
    void version; // força reavaliação
    return listCategoryHints();
  }, [version]);
}
