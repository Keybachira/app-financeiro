export const CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Casa',
  'Saúde',
  'Lazer',
  'Dívidas',
  'Projetos',
  'Outros',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const DEFAULT_CATEGORY: Category = 'Outros';

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}
