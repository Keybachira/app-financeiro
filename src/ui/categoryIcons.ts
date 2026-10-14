import type { LucideIcon } from 'lucide-react-native';
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
} from 'lucide-react-native';

import { isCategory, type Category } from '../domain/categories';

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

export function categoryIcon(category: string): LucideIcon {
  return isCategory(category) ? CATEGORY_ICONS[category] : Ellipsis;
}

export function incomeIcon(): LucideIcon {
  return Coins;
}
