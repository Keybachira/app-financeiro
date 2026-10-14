import { useCallback, useState } from 'react';

import { getSetting, removeSetting, setSetting } from '../../repos/settings';

export function useMonthlyLimit(): { limit: number | null; setLimit: (value: number | null) => void } {
  const [limit, setLimitState] = useState<number | null>(() => {
    const raw = getSetting('monthly_limit');
    const parsed = raw === null ? Number.NaN : Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  });

  const setLimit = useCallback((value: number | null) => {
    if (value === null || !Number.isFinite(value) || value <= 0) {
      removeSetting('monthly_limit');
      setLimitState(null);
      return;
    }

    const rounded = Math.round(value);
    setSetting('monthly_limit', String(rounded));
    setLimitState(rounded);
  }, []);

  return { limit, setLimit };
}

export function useSalarySettings(): { salaryDay: number | null; adjustBusinessDay: boolean } {
  const [settings] = useState(() => {
    const rawDay = getSetting('salary_day');
    const parsedDay = rawDay === null ? Number.NaN : Number(rawDay);
    const validDay = Number.isInteger(parsedDay) && parsedDay >= 1 && parsedDay <= 31;

    return {
      salaryDay: validDay ? parsedDay : null,
      adjustBusinessDay: getSetting('salary_adjust_business_day') === '1',
    };
  });

  return settings;
}
