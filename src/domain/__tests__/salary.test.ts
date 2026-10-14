import { describe, expect, it } from '@jest/globals';

import { adjustToBusinessDay, daysUntilSalary, nextSalaryDate, salaryDateForMonth } from '../salary';

describe('salario', () => {
  it('limita o dia ao ultimo dia do mes', () => {
    expect(salaryDateForMonth(2026, 2, 31)).toBe('2026-02-28');
    expect(salaryDateForMonth(2026, 2, 30)).toBe('2026-02-28');
    expect(salaryDateForMonth(2028, 2, 29)).toBe('2028-02-29');
  });

  it('usa a data do mes quando ainda nao passou', () => {
    expect(nextSalaryDate({ salaryDay: 23, adjustBusinessDay: false, today: '2026-10-14' })).toBe('2026-10-23');
    expect(daysUntilSalary('2026-10-14', '2026-10-23')).toBe(9);
  });

  it('passa ao mes seguinte quando a data ja passou', () => {
    expect(nextSalaryDate({ salaryDay: 23, adjustBusinessDay: false, today: '2026-10-24' })).toBe('2026-11-23');
  });

  it('aceita a propria data do salario', () => {
    expect(nextSalaryDate({ salaryDay: 14, adjustBusinessDay: false, today: '2026-10-14' })).toBe('2026-10-14');
  });

  it('recua fim de semana para a sexta anterior', () => {
    expect(adjustToBusinessDay('2026-10-24')).toBe('2026-10-23');
    expect(adjustToBusinessDay('2026-10-25')).toBe('2026-10-23');
    expect(adjustToBusinessDay('2026-10-23')).toBe('2026-10-23');
    expect(nextSalaryDate({ salaryDay: 24, adjustBusinessDay: true, today: '2026-10-20' })).toBe('2026-10-23');
    expect(nextSalaryDate({ salaryDay: 25, adjustBusinessDay: true, today: '2026-10-20' })).toBe('2026-10-23');
  });

  it('nunca devolve data no passado depois do ajuste', () => {
    expect(nextSalaryDate({ salaryDay: 24, adjustBusinessDay: true, today: '2026-10-25' })).toBe('2026-11-24');
  });
});
