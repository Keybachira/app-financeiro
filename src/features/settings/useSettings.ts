import { useCallback, useEffect, useMemo, useState } from 'react';

import { subscribeDataVersion } from '../../repos/dataVersion';
import { getSetting, removeSetting, setSetting } from '../../repos/settings';

export function useMonthlyLimit(): {
  limit: number | null;
  setLimit: (value: number | null) => void;
  refresh: () => void;
} {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((value) => value + 1), []);

  // Lido em useMemo (e não no useState inicial) para que `refresh` volte a ler
  // a partir do SQLite. Sem isto, alterar o limite em Definições só chegava
  // à Home depois de reiniciar a app.
  const limit = useMemo(() => {
    void tick; // força reavaliação
    const raw = getSetting('monthly_limit');
    const parsed = raw === null ? Number.NaN : Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }, [tick]);

  const setLimit = useCallback((value: number | null) => {
    if (value === null || !Number.isFinite(value) || value <= 0) {
      removeSetting('monthly_limit');
      setTick((current) => current + 1);
      return;
    }

    const rounded = Math.round(value);
    setSetting('monthly_limit', String(rounded));
    setTick((current) => current + 1);
  }, []);

  // Um backup importado também traz o limite: sem isto, a Home continuava a
  // mostrar o valor antigo.
  useEffect(
    () =>
      subscribeDataVersion(() => {
        setTick((current) => current + 1);
      }),
    []
  );

  return { limit, setLimit, refresh };
}

export function useSalarySettings(): { salaryDay: number | null; adjustBusinessDay: boolean } & { refresh: () => void } {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((v) => v + 1), []);

  const settings = useMemo(() => {
    void tick; // força reavaliação
    const rawDay = getSetting('salary_day');
    const parsedDay = rawDay === null ? Number.NaN : Number(rawDay);
    const validDay = Number.isInteger(parsedDay) && parsedDay >= 1 && parsedDay <= 31;

    return {
      salaryDay: validDay ? parsedDay : null,
      adjustBusinessDay: getSetting('salary_adjust_business_day') === '1',
      refresh,
    };
  }, [tick, refresh]);

  return settings;
}
