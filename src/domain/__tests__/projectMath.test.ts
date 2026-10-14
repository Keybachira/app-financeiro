import { describe, expect, it } from '@jest/globals';

import {
  projectPaymentLabel,
  projectPercentPaid,
  projectRemaining,
  projectsOutstandingTotal,
} from '../projectMath';

describe('projetos', () => {
  it('arredonda a percentagem paga', () => {
    expect(projectPercentPaid(65000, 40000)).toBe(62);
    expect(projectPercentPaid(25000, 10000)).toBe(40);
    expect(projectPercentPaid(25000, 30000)).toBe(100);
    expect(projectPercentPaid(25000, 0)).toBe(0);
  });

  it('nao deixa o valor em falta negativo', () => {
    expect(projectRemaining(25000, 30000)).toBe(0);
    expect(projectRemaining(25000, 10000)).toBe(15000);
  });

  it('traduz a percentagem em etiqueta', () => {
    expect(projectPaymentLabel(0)).toBe('Por receber');
    expect(projectPaymentLabel(40)).toBe('40% pago');
    expect(projectPaymentLabel(100)).toBe('Pago');
  });

  it('soma o total a receber dos projetos ativos', () => {
    expect(
      projectsOutstandingTotal([
        { total: 25000, received: 10000 },
        { total: 20000, received: 20000 },
        { total: 30000, received: 0 },
      ])
    ).toBe(45000);
  });
});
