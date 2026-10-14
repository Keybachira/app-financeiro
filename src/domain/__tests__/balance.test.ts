import { describe, expect, it } from '@jest/globals';

import { monthNet, spendablePerDay } from '../balance';

describe('saldo e orcamento', () => {
  it('desconta o movimento liquido das metas do saldo do mes', () => {
    expect(monthNet(150000, 90000, 20000, 5000)).toBe(45000);
  });

  it('divide o disponivel pelos dias ate ao salario', () => {
    expect(spendablePerDay(300000, 186000, 0, 15)).toEqual({ amount: 7600, overLimit: false });
  });

  it('desconta as contas fixas por pagar', () => {
    expect(spendablePerDay(300000, 100000, 20000, 10)).toEqual({ amount: 18000, overLimit: false });
  });

  it('mostra zero e avisa quando o limite foi passado', () => {
    expect(spendablePerDay(300000, 350000, 0, 15)).toEqual({ amount: 0, overLimit: true });
    expect(spendablePerDay(300000, 100000, 250000, 5)).toEqual({ amount: 0, overLimit: true });
  });

  it('trata zero dias como um dia', () => {
    expect(spendablePerDay(300000, 100000, 20000, 0)).toEqual({ amount: 180000, overLimit: false });
  });

  it('sem limite definido devolve infinito', () => {
    expect(spendablePerDay(null, 100000, 0, 10)).toEqual({ amount: Number.POSITIVE_INFINITY, overLimit: false });
  });
});
