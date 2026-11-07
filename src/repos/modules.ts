import { bumpDataVersion, subscribeDataVersion } from './dataVersion';
import { getSetting, setSetting } from './settings';
import { DEFAULT_MODULE_STATES, detectProfile, sanitizeModuleStates, type ModuleId, type ModuleProfileId, PROFILE_MODULE_STATES } from '../domain/modules';

export const MODULE_SETTINGS_KEY = 'module_config_v1';
export const MODULE_PROFILE_KEY = 'module_profile_v1';

export type ModuleConfig = {
  profile: ModuleProfileId;
  modules: Record<ModuleId, boolean>;
};

export function getModuleConfig(): ModuleConfig {
  const raw = getSetting(MODULE_SETTINGS_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<ModuleConfig> & { modules?: Partial<Record<ModuleId, boolean>> };
      const modules = sanitizeModuleStates(parsed.modules);
      const profileRaw = getSetting(MODULE_PROFILE_KEY);
      const profile = (profileRaw === 'student' || profileRaw === 'worker' || profileRaw === 'freelancer' || profileRaw === 'custom')
        ? profileRaw
        : detectProfile(modules);
      return { profile, modules };
    } catch {
      // fallback
    }
  }
  return { profile: 'custom', modules: { ...DEFAULT_MODULE_STATES } };
}

export function saveModuleConfig(config: ModuleConfig): ModuleConfig {
  const modules = sanitizeModuleStates(config.modules);
  const profile = config.profile === 'custom' ? 'custom' : (detectProfile(modules) === config.profile ? config.profile : 'custom');
  setSetting(MODULE_SETTINGS_KEY, JSON.stringify({ modules }));
  setSetting(MODULE_PROFILE_KEY, profile);
  bumpDataVersion();
  return { profile, modules };
}

export function setModuleEnabled(id: ModuleId, enabled: boolean): ModuleConfig {
  const current = getModuleConfig();
  return saveModuleConfig({ ...current, profile: 'custom', modules: { ...current.modules, [id]: enabled } });
}

export function applyModuleProfile(profile: ModuleProfileId): ModuleConfig {
  const modules = sanitizeModuleStates(PROFILE_MODULE_STATES[profile]);
  return saveModuleConfig({ profile, modules });
}

export { subscribeDataVersion };