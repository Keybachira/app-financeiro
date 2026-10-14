import { describe, expect, it } from '@jest/globals';

import { formatKz, formatKzNumber } from '../money';

describe('formatKz', () => {
  it('formata zero', () => {
    expect(formatKz(0)).toBe('0 Kz');
  });

  it('agrupa milhares com espaco', () => {
    expect(formatKz(400000)).toBe('400 000 Kz');
    expect(formatKz(1000000)).toBe('1 000 000 Kz');
    expect(formatKz(999)).toBe('999 Kz');
  });

  it('mantem o sinal de valores negativos', () => {
    expect(formatKz(-2500)).toBe('-2 500 Kz');
  });

  it('arredonda valores com casas decimais', () => {
    expect(formatKz(2500.4)).toBe('2 500 Kz');
    expect(formatKzNumber(1234.6)).toBe('1 235');
  });
});
