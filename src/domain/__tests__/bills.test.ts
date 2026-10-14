import { describe, expect, it } from '@jest/globals';

import { billsUnpaidThisMonth, nextBillDueDate } from '../bills';

const noPayments = () => false;

describe('contas fixas', () => {
  it('usa o dia configurado do mes atual', () => {
    expect(nextBillDueDate({ dayOfMonth: 20 }, '2026-10-14', noPayments)).toBe('2026-10-20');
  });

  it('passa ao mes seguinte quando a data ja passou', () => {
    expect(nextBillDueDate({ dayOfMonth: 10 }, '2026-10-14', noPayments)).toBe('2026-11-10');
  });

  it('passa ao mes seguinte quando a conta ja foi paga', () => {
    const paidOctober = (month: string) => month === '2026-10';
    expect(nextBillDueDate({ dayOfMonth: 20 }, '2026-10-14', paidOctober)).toBe('2026-11-20');
  });

  it('limita o dia em meses curtos', () => {
    expect(nextBillDueDate({ dayOfMonth: 31 }, '2026-02-10', noPayments)).toBe('2026-02-28');
  });

  it('soma as contas ativas por pagar no mes', () => {
    const bills = [
      { id: 'a', amount: 5000, dayOfMonth: 10, active: true },
      { id: 'b', amount: 8000, dayOfMonth: 5, active: true },
      { id: 'c', amount: 9000, dayOfMonth: 3, active: false },
    ];
    expect(billsUnpaidThisMonth(bills, '2026-10', noPayments)).toBe(13000);
    expect(billsUnpaidThisMonth(bills, '2026-10', () => true)).toBe(0);
  });
});
