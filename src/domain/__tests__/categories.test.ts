import { describe, expect, it } from '@jest/globals';

import { CATEGORIES, DEFAULT_CATEGORY, isCategory } from '../categories';

describe('categorias', () => {
  it('tem a lista inicial definida no plano', () => {
    expect(CATEGORIES).toEqual([
      'Alimentação',
      'Transporte',
      'Casa',
      'Saúde',
      'Lazer',
      'Dívidas',
      'Projetos',
      'Outros',
    ]);
  });

  it('usa Outros como categoria por omissao', () => {
    expect(DEFAULT_CATEGORY).toBe('Outros');
    expect(isCategory(DEFAULT_CATEGORY)).toBe(true);
    expect(isCategory('Viagens')).toBe(false);
  });
});
