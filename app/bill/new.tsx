import { useLocalSearchParams, useRouter } from "expo-router";

import { FormularioConta } from "../../src/features/contas/FormularioConta";
import { getBill } from "../../src/repos/bills";

/**
 * Rota fina para a folha de conta fixa.
 *
 * O formulário vive em `FormularioConta`, que a lista de despesas fixas abre
 * diretamente por cima do ecrã. Esta rota mantém os atalhos antigos a funcionar
 * (`/bill/new` e `/bill/new?id=…`, usado pelo "Novo item"): renderiza a mesma
 * folha já aberta e fecha com `router.back()`.
 */
export default function NovaContaFixaScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const conta = typeof id === "string" ? getBill(id) : null;

  return (
    <FormularioConta visible conta={conta} onClose={() => router.back()} />
  );
}
