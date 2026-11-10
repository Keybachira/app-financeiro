import { useCallback, useEffect, useState } from "react";

import { bumpDataVersion, subscribeDataVersion } from "../../repos/dataVersion";
import { getSetting, removeSetting, setSetting } from "../../repos/settings";

export type PreferenciaTema = "system" | "light" | "dark";

const THEME_KEY = "theme_preference";
const HIDE_AMOUNTS_KEY = "hide_amounts";
const ONBOARDING_KEY = "onboarding_complete";

function lerTema(): PreferenciaTema {
  const value = getSetting(THEME_KEY);
  return value === "light" || value === "dark" ? value : "system";
}

function lerBooleano(key: string): boolean {
  return getSetting(key) === "1";
}

/**
 * Preferências globais: tema, esconder valores e onboarding concluído.
 *
 * Lê diretamente de 'settings' a cada versão de dados e expõe ações que
 * escrevem e avisam ('bumpDataVersion') todos os ecrãs subscritos.
 */
export function usePreferenciasApp() {
  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => subscribeDataVersion(refresh), [refresh]);

  const theme = lerTema();
  const hideAmounts = lerBooleano(HIDE_AMOUNTS_KEY);
  const onboardingComplete = lerBooleano(ONBOARDING_KEY);

  const setTheme = useCallback((value: PreferenciaTema) => {
    setSetting(THEME_KEY, value);
    bumpDataVersion();
  }, []);

  const toggleHideAmounts = useCallback(() => {
    setSetting(HIDE_AMOUNTS_KEY, hideAmounts ? "0" : "1");
    bumpDataVersion();
  }, [hideAmounts]);

  const completeOnboarding = useCallback(() => {
    setSetting(ONBOARDING_KEY, "1");
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

/** Verificação sem hook, para decidir a rota inicial no arranque. */
export function onboardingConcluido(): boolean {
  return lerBooleano(ONBOARDING_KEY);
}
