import { Redirect, useLocalSearchParams } from "expo-router";

/**
 * O formulário antigo escrevia no store de demonstração. Mantém-se a rota
 * (links antigos continuam a funcionar), mas agora abre o editor real.
 */
export default function NovoItemRedirect() {
  const { tipo } = useLocalSearchParams<{ tipo?: string }>();

  if (tipo === "dividas") {
    return <Redirect href="/debt/new" />;
  }

  if (tipo === "projetos") {
    return <Redirect href="/project/new" />;
  }

  if (tipo === "fixas") {
    return <Redirect href="/bill/new" />;
  }

  return <Redirect href="/goal/new" />;
}
