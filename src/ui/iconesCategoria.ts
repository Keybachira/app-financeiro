import type { LucideIcon } from "lucide-react-native";
import {
  Bus,
  Briefcase,
  Coins,
  Ellipsis,
  Gamepad2,
  House,
  HeartPulse,
  Landmark,
  Utensils,
} from "lucide-react-native";

import { isCategory, type Category } from "../domain/categories";

const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  Alimentação: Utensils,
  Transporte: Bus,
  Casa: House,
  Saúde: HeartPulse,
  Lazer: Gamepad2,
  Dívidas: Landmark,
  Projetos: Briefcase,
  Outros: Ellipsis,
};

/**
 * Devolve o ícone Lucide de uma categoria, caindo em "…" quando o nome não é
 * reconhecido (dados antigos ou importados).
 */
export function iconeCategoria(category: string): LucideIcon {
  return isCategory(category) ? CATEGORY_ICONS[category] : Ellipsis;
}

/** Ícone usado nas receitas (moedas). */
export function iconeReceita(): LucideIcon {
  return Coins;
}
