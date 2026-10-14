import { describe, expect, it } from '@jest/globals';

import { normalizeNote, suggestCategory } from '../categoryHints';

describe('sugestao de categoria', () => {
  it('normaliza a nota para minusculas sem acentos', () => {
    expect(normalizeNote('ÁGUA  do  Mês')).toBe('agua do mes');
    expect(normalizeNote('  Café Central ')).toBe('cafe central');
  });

  it('sugere a categoria pela palavra-chave', () => {
    const hints = [
      { keyword: 'agua', category: 'Casa' },
      { keyword: 'cafe', category: 'Alimentação' },
    ];
    expect(suggestCategory('pagamento da agua', hints)).toBe('Casa');
    expect(suggestCategory('Café Central', hints)).toBe('Alimentação');
  });

  it('prefere a palavra-chave mais especifica', () => {
    const hints = [
      { keyword: 'agua', category: 'Casa' },
      { keyword: 'agua mineral', category: 'Saúde' },
    ];
    expect(suggestCategory('agua mineral', hints)).toBe('Saúde');
  });

  it('devolve nulo sem correspondencia', () => {
    expect(suggestCategory('presente', [{ keyword: 'agua', category: 'Casa' }])).toBeNull();
  });

  it('devolve nulo para nota vazia', () => {
    expect(suggestCategory('   ', [{ keyword: 'agua', category: 'Casa' }])).toBeNull();
  });
});
