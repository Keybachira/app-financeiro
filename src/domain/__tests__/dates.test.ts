import { describe, expect, it } from '@jest/globals';

import {
  addDays,
  addMonths,
  dateWithClampedDay,
  daysBetween,
  daysLeftInMonth,
  formatShortPt,
  isValidDate,
  monthDaysOf,
  monthNamePt,
  monthsBetween,
  monthWithOffset,
  isWeekend,
} from '../dates';

describe('datas', () => {
  it('valida datas inexistentes', () => {
    expect(isValidDate('2026-10-14')).toBe(true);
    expect(isValidDate('2028-02-29')).toBe(true);
    expect(isValidDate('2026-02-29')).toBe(false);
    expect(isValidDate('2026-13-01')).toBe(false);
    expect(isValidDate('2026-1-01')).toBe(false);
  });

  it('avança dias atravessando o ano', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-10-14', 9)).toBe('2026-10-23');
  });

  it('limita o dia ao ultimo dia do mes', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29');
    expect(dateWithClampedDay(2026, 2, 31)).toBe('2026-02-28');
    expect(dateWithClampedDay(2026, 2, 29)).toBe('2026-02-28');
  });

  it('conta dias e meses entre datas', () => {
    expect(daysBetween('2026-10-14', '2026-10-23')).toBe(9);
    expect(monthsBetween('2026-10-14', '2026-10-31')).toBe(0);
    expect(monthsBetween('2026-10-14', '2026-11-13')).toBe(0);
    expect(monthsBetween('2026-10-14', '2026-11-14')).toBe(1);
  });

  it('reconhece fins de semana', () => {
    expect(isWeekend('2026-10-23')).toBe(false);
    expect(isWeekend('2026-10-24')).toBe(true);
    expect(isWeekend('2026-10-25')).toBe(true);
  });

  it('formata datas curtas em portugues', () => {
    expect(formatShortPt('2026-10-23')).toBe('Sex 23 out');
    expect(monthNamePt('2026-10-01')).toBe('Outubro');
  });

  it('conta dias do mes e dias restantes', () => {
    expect(monthDaysOf('2026-02-10')).toBe(28);
    expect(monthDaysOf('2028-02-10')).toBe(29);
    expect(daysLeftInMonth('2026-10-14')).toBe(18);
    expect(daysLeftInMonth('2026-10-31')).toBe(1);
  });

  it('navega meses sem estourar o ano', () => {
    expect(monthWithOffset('2026-11-30', 3)).toEqual({ year: 2027, month: 2 });
    expect(monthWithOffset('2026-01-10', -1)).toEqual({ year: 2025, month: 12 });
  });
});
