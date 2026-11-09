import { useCallback, useEffect, useState } from 'react';

import { bumpDataVersion, subscribeDataVersion } from '../../repos/dataVersion';
import { getSetting, removeSetting, setSetting } from '../../repos/settings';

export type ThemePreference = 'system' | 'light' | 'dark';

const THEME_KEY = 'theme_preference';
const HIDE_AMOUNTS_KEY = 'hide_amounts';
const ONBOARDING_KEY = 'onboarding_complete';

function readTheme(): ThemePreference {
  const value = getSetting(THEME_KEY);
  return value === 'light' || value === 'dark' ? value : 'system';
}

function readBoolean(key: string): boolean {
  return getSetting(key) === '1';
}

export function useAppPreferences() {
  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => subscribeDataVersion(refresh), [refresh]);

  const theme = readTheme();
  const hideAmounts = readBoolean(HIDE_AMOUNTS_KEY);
  const onboardingComplete = readBoolean(ONBOARDING_KEY);

  const setTheme = useCallback((value: ThemePreference) => {
    setSetting(THEME_KEY, value);
    bumpDataVersion();
  }, []);

  const toggleHideAmounts = useCallback(() => {
    setSetting(HIDE_AMOUNTS_KEY, hideAmounts ? '0' : '1');
    bumpDataVersion();
  }, [hideAmounts]);

  const completeOnboarding = useCallback(() => {
    setSetting(ONBOARDING_KEY, '1');
    bumpDataVersion();
  }, []);

  const resetOnboarding = useCallback(() => {
    removeSetting(ONBOARDING_KEY);
    bumpDataVersion();
  }, []);

  return {
    theme,
    hideAmounts,
    onboardingComplete,
    setTheme,
    toggleHideAmounts,
    completeOnboarding,
    resetOnboarding,
    refresh,
  };
}

export function isOnboardingComplete(): boolean {
  return readBoolean(ONBOARDING_KEY);
}
