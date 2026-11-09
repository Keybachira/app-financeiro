import { DEFAULT_CONFIG, IntelligenceConfig, MovementInput, Observation } from '../types/intelligence.types';
import { addDays, dateFromMonthIndex, dayOf, diffDays, dimOf, monthIndex, weekdayOf } from '../time/dates';
import { mean, median, normalize } from '../stats';

export const patternKey = (m: MovementInput): string => {
  const n = normalize(m.note ?? '');
  return `${m.type}:${n || 'cat:' + normalize(m.category)}`;
};

type Ctx = { cfg: IntelligenceConfig; list: MovementInput[]; key: string };

function build(c: Ctx, run: MovementInput[], cadence: 'weekly' | 'monthly', medAmt: number, medDay: number | null, jitter: number): Observation {
  const last = run[run.length - 1];
  return {
    key: c.key,
    label: (last.note && last.note.trim()) || last.category,
    type: last.type,
    category: last.category,
    cadence,
    occurrences: run.length,
    medianAmount: Math.round(medAmt),
    amountSpread: Math.max(...run.map((m) => Math.abs(m.amount - medAmt) / medAmt)),
    dateJitter: jitter,
    dayOfMonth: medDay,
    weekday: cadence === 'weekly' ? weekdayOf(last.date) : null,
    lastDate: last.date,
    movementIds: run.map((m) => m.id),
  };
}

function detectMonthly(c: Ctx): Observation | null {
  const { cfg, list } = c, n = cfg.minOccurrences;
  if (list.length < n) return null;
  const seed = list.slice(-n);
  for (let i = 1; i < seed.length; i++) if (monthIndex(seed[i].date) - monthIndex(seed[i - 1].date) !== 1) return null;
  const medDay = Math.round(median(seed.map((m) => dayOf(m.date))));
  const medAmt = median(seed.map((m) => m.amount));
  // fim de mês: dia 31 em fevereiro conta como último dia
  const dayDev = (m: MovementInput) => Math.abs(dayOf(m.date) - Math.min(medDay, dimOf(m.date)));
  const okDay = (m: MovementInput) => dayDev(m) <= cfg.dateToleranceDays;
  const okAmt = (m: MovementInput) => Math.abs(m.amount - medAmt) / medAmt <= cfg.amountTolerancePct;
  if (!seed.every((m) => okDay(m) && okAmt(m))) return null;
  const run = [...seed];
  for (let i = list.length - n - 1; i >= 0; i--) {
    const m = list[i];
    if (monthIndex(m.date) !== monthIndex(run[0].date) - 1 || !okDay(m) || !okAmt(m)) break;
    run.unshift(m);
  }
  return build(c, run, 'monthly', medAmt, medDay, mean(run.map(dayDev)));
}

function detectWeekly(c: Ctx): Observation | null {
  const { cfg, list } = c, n = cfg.minOccurrences;
  if (list.length < n) return null;
  const okInt = (a: MovementInput, b: MovementInput) => Math.abs(diffDays(b.date, a.date) - 7) <= 1;
  const seed = list.slice(-n);
  for (let i = 1; i < seed.length; i++) if (!okInt(seed[i - 1], seed[i])) return null;
  const medAmt = median(seed.map((m) => m.amount));
  const okAmt = (m: MovementInput) => Math.abs(m.amount - medAmt) / medAmt <= cfg.amountTolerancePct;
  if (!seed.every(okAmt)) return null;
  const run = [...seed];
  for (let i = list.length - n - 1; i >= 0; i--) {
    if (!okInt(list[i], run[0]) || !okAmt(list[i])) break;
    run.unshift(list[i]);
  }
  const jit = mean(run.slice(1).map((m, i) => Math.abs(diffDays(m.date, run[i].date) - 7)));
  return build(c, run, 'weekly', medAmt, null, jit);
}

/** Deteta padrões mensais e semanais. Padrões irregulares não geram observação. */
export function detectRecurrences(movements: MovementInput[], cfg: IntelligenceConfig = DEFAULT_CONFIG): Observation[] {
  const groups = new Map<string, MovementInput[]>();
  for (const m of movements) {
    if (m.amount <= 0) continue;
    if (cfg.ignoreBillMovements && m.billId) continue; // contas fixas já têm lembrete próprio
    const k = patternKey(m);
    let g = groups.get(k);
    if (!g) groups.set(k, (g = []));
    g.push(m);
  }
  const out: Observation[] = [];
  groups.forEach((list, key) => {
    list.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id < b.id ? -1 : 1));
    const ctx: Ctx = { cfg, list, key };
    const o = detectMonthly(ctx) ?? detectWeekly(ctx);
    if (o) out.push(o);
  });
  return out.sort((a, b) => (a.key < b.key ? -1 : 1));
}

/** Datas esperadas depois da última ocorrência, até `to` (inclusive). */
export function expectedDates(o: Observation, to: string): string[] {
  const out: string[] = [];
  if (o.cadence === 'weekly') {
    for (let d = addDays(o.lastDate, 7), i = 0; d <= to && i < 500; d = addDays(d, 7), i++) out.push(d);
  } else {
    const base = monthIndex(o.lastDate);
    for (let k = 1; k < 200; k++) {
      const d = dateFromMonthIndex(base + k, o.dayOfMonth ?? dayOf(o.lastDate));
      if (d > to) break;
      out.push(d);
    }
  }
  return out;
}
