import { useCallback, useEffect, useMemo, useState } from "react";

import { bumpDataVersion, subscribeDataVersion } from "../../repos/dataVersion";
import { getSetting, removeSetting, setSetting } from "../../repos/settings";

const USER_NAME_KEY = "user_name";
const USER_AVATAR_KEY = "user_avatar";

/** Nome mostrado no Início e editado nos Ajustes. */
export function useNomeUtilizador(): {
  name: string;
  setName: (value: string) => void;
  refresh: () => void;
} {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => subscribeDataVersion(refresh), [refresh]);

  const name = useMemo(() => {
    void tick;
    return getSetting(USER_NAME_KEY)?.trim() ?? "";
  }, [tick]);

  const setName = useCallback((value: string) => {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      removeSetting(USER_NAME_KEY);
    } else {
      setSetting(USER_NAME_KEY, trimmed);
    }

    bumpDataVersion();
  }, []);

  return { name, setName, refresh };
}

/** Avatar escolhido pelo utilizador. Vazio significa usar a inicial do nome. */
export function useAvatarUtilizador(): {
  avatar: string;
  setAvatar: (value: string | null) => void;
  refresh: () => void;
} {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => subscribeDataVersion(refresh), [refresh]);

  const avatar = useMemo(() => {
    void tick;
    return getSetting(USER_AVATAR_KEY) ?? "";
  }, [tick]);

  const setAvatar = useCallback((value: string | null) => {
    if (value) {
      setSetting(USER_AVATAR_KEY, value);
    } else {
      removeSetting(USER_AVATAR_KEY);
    }
    bumpDataVersion();
  }, []);

  return { avatar, setAvatar, refresh };
}

/**
 * Limite de gastos mensal (null = sem limite).
 *
 * É lido dentro de 'useMemo' para que 'refresh' volte a consultar o SQLite:
 * alterar o limite nas definições tem de chegar ao Início sem reiniciar.
 */
export function useLimiteMensal(): {
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
    const raw = getSetting("monthly_limit");
    const parsed = raw === null ? Number.NaN : Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }, [tick]);

  const setLimit = useCallback((value: number | null) => {
    if (value === null || !Number.isFinite(value) || value <= 0) {
      removeSetting("monthly_limit");
      setTick((current) => current + 1);
      return;
    }

    const rounded = Math.round(value);
    setSetting("monthly_limit", String(rounded));
    setTick((current) => current + 1);
  }, []);

  // Um backup importado também traz o limite: sem isto, a Home continuava a
  // mostrar o valor antigo.
  useEffect(
    () =>
      subscribeDataVersion(() => {
        setTick((current) => current + 1);
      }),
    [],
  );

  return { limit, setLimit, refresh };
}

/**
 * Dia de pagamento e ajuste para dia útil (usado no cálculo do salário
 * seguinte e do valor disponível por dia).
 */
export function useDefinicoesSalario(): {
  salaryDay: number | null;
  adjustBusinessDay: boolean;
} & { refresh: () => void } {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((v) => v + 1), []);

  const settings = useMemo(() => {
    void tick; // força reavaliação
    const rawDay = getSetting("salary_day");
    const parsedDay = rawDay === null ? Number.NaN : Number(rawDay);
    const validDay =
      Number.isInteger(parsedDay) && parsedDay >= 1 && parsedDay <= 31;

    return {
      salaryDay: validDay ? parsedDay : null,
      adjustBusinessDay: getSetting("salary_adjust_business_day") === "1",
      refresh,
    };
  }, [tick, refresh]);

  return settings;
}
