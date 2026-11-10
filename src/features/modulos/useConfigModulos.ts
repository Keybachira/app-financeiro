import { useCallback, useEffect, useMemo, useState } from "react";
import {
  applyModuleProfile,
  getModuleConfig,
  saveModuleConfig,
  setModuleEnabled,
} from "../../repos/modules";
import { subscribeDataVersion } from "../../repos/dataVersion";
import type { ModuleId, ModuleProfileId } from "../../domain/modules";

/**
 * Configuração dos módulos da app (ligar/desligar, aplicar um perfil, gravar).
 *
 * O estado real está em 'settings'; 'tick' força a releitura depois de cada
 * escrita e 'subscribeDataVersion' garante que uma importação de backup também
 * atualiza os ecrãs abertos.
 */
export function useConfigModulos() {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((v) => v + 1), []);
  useEffect(() => subscribeDataVersion(refresh), [refresh]);
  const config = useMemo(() => {
    void tick;
    return getModuleConfig();
  }, [tick]);
  const isEnabled = useCallback(
    (id: ModuleId) => config.modules[id],
    [config.modules],
  );
  return {
    ...config,
    isEnabled,
    refresh,
    setEnabled: (id: ModuleId, enabled: boolean) => {
      setModuleEnabled(id, enabled);
    },
    setProfile: (profile: ModuleProfileId) => {
      applyModuleProfile(profile);
    },
    save: (
      modules: Record<ModuleId, boolean>,
      profile: ModuleProfileId = "custom",
    ) => {
      saveModuleConfig({ modules, profile });
    },
  };
}
