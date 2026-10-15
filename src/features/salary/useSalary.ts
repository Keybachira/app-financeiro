import { useCallback, useEffect, useMemo, useState } from 'react';

import { pendingSalaryLaunch, type SalarySettings } from '../../domain/salary';
import { todayISO } from '../../domain/dates';
import { getSetting, removeSetting, setSetting } from '../../repos/settings';
import { createMovement } from '../../repos/movements';

const KEYS = {
  amount: 'salary_amount',
  day: 'salary_day',
  adjust: 'salary_adjust_business_day',
  auto: 'salary_auto_income',
  lastMonth: 'last_salary_month',
};

function readSalarySettings(): SalarySettings {
  const rawAmount = getSetting(KEYS.amount);
  const rawDay = getSetting(KEYS.day);
  const amount = rawAmount === null ? Number.NaN : Number(rawAmount);
  const day = rawDay === null ? Number.NaN : Number(rawDay);

  return {
    amount: Number.isFinite(amount) && amount > 0 ? Math.round(amount) : null,
    day: Number.isInteger(day) && day >= 1 && day <= 31 ? day : null,
    adjustBusinessDay: getSetting(KEYS.adjust) === '1',
    autoIncome: getSetting(KEYS.auto) === '1',
    lastMonth: getSetting(KEYS.lastMonth),
  };
}

export function useSalary() {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((value) => value + 1), []);

  const settings = useMemo(() => {
    void tick;
    return readSalarySettings();
  }, [tick]);

  const save = useCallback(
    (partial: Partial<SalarySettings>) => {
      if (partial.amount !== undefined) {
        if (partial.amount === null || partial.amount <= 0) {
          removeSetting(KEYS.amount);
        } else {
          setSetting(KEYS.amount, String(Math.round(partial.amount)));
        }
      }

      if (partial.day !== undefined) {
        if (partial.day === null) {
          removeSetting(KEYS.day);
        } else {
          setSetting(KEYS.day, String(partial.day));
        }
      }

      if (partial.adjustBusinessDay !== undefined) {
        setSetting(KEYS.adjust, partial.adjustBusinessDay ? '1' : '0');
      }

      if (partial.autoIncome !== undefined) {
        setSetting(KEYS.auto, partial.autoIncome ? '1' : '0');
      }

      refresh();
    },
    [refresh]
  );

  return { settings, save, refresh };
}

export function useAutoSalary(): void {
  const { settings } = useSalary();

  useEffect(() => {
    const pending = pendingSalaryLaunch(settings, todayISO());

    if (pending && settings.amount !== null) {
      try {
        createMovement({
          type: 'income',
          amount: settings.amount,
          category: 'Salário',
          date: pending.date,
          note: 'Salário',
          origin: 'salary',
        });
        setSetting(KEYS.lastMonth, pending.month);
      } catch {
        // Falha silenciosa: tenta novamente no próximo arranque.
      }
    }
  }, [settings]); // Reavalia sempre que as definições mudarem (incluindo ao abrir a app)
}
