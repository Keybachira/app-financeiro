import type { ComponentProps } from "react";
import type { Feather } from "@expo/vector-icons";

type FeatherName = ComponentProps<typeof Feather>["name"];

export type VisualCategoria = {
  icon: FeatherName;
  color: string;
};

// Categorias de `src/domain/categories.ts` mais as antigas do protótipo
// ("Comida", "Serviços"), para que dados importados de backups antigos também
// tenham ícone e cor em vez de caírem todas em "Outros".
const VISUALS: Record<string, VisualCategoria> = {
  Alimentação: { icon: "coffee", color: "#f08a3c" },
  Comida: { icon: "coffee", color: "#f08a3c" },
  Casa: { icon: "home", color: "#4d8bf0" },
  Serviços: { icon: "zap", color: "#d9a514" },
  Transporte: { icon: "truck", color: "#2fb5a3" },
  Lazer: { icon: "star", color: "#e0569a" },
  Saúde: { icon: "heart", color: "#e2574c" },
  Dívidas: { icon: "credit-card", color: "#d9a514" },
  Projetos: { icon: "briefcase", color: "#4d8bf0" },
  Salário: { icon: "dollar-sign", color: "#1f9d57" },
  Extra: { icon: "plus", color: "#1f9d57" },
  Outros: { icon: "more-horizontal", color: "#8d8d8d" },
};

/**
 * Ícone Feather + cor de cada categoria, incluindo nomes antigos do protótipo
 * ("Comida", "Serviços") para os backups importados continuarem coloridos.
 */
export function visualCategoria(category: string): VisualCategoria {
  return VISUALS[category] ?? VISUALS.Outros;
}
