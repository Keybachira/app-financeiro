import { fmtDate } from './dates';

/** Relógio injetável: nos testes usa-se fixedClock, na app systemClock. */
export interface Clock {
  now(): Date;
  /** Data local de hoje 'YYYY-MM-DD'. */
  today(): string;
  /** Hora local atual (0-23). */
  hour(): number;
}

export const systemClock: Clock = {
  now: () => new Date(),
  today: () => {
    const d = new Date();
    return fmtDate(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  },
  hour: () => new Date().getHours(),
};

export interface FixedClock extends Clock {
  set(date: string, hour?: number): void;
}

export function fixedClock(date: string, hour = 8): FixedClock {
  let d = date,
    h = hour;
  return {
    now: () => new Date(`${d}T${String(h).padStart(2, '0')}:00:00`),
    today: () => d,
    hour: () => h,
    set(nd, nh = h) {
      d = nd;
      h = nh;
    },
  };
}
