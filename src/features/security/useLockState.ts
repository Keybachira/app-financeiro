import { useCallback, useEffect, useState } from 'react';
import * as Crypto from 'expo-crypto';
import * as ScreenCapture from 'expo-screen-capture';

import { subscribeDataVersion } from '../../repos/dataVersion';
import { getSetting, removeSetting, setSetting } from '../../repos/settings';

const LOCK_KEY = 'app_lock_enabled';
const HASH_KEY = 'app_pin_hash';
const SALT_KEY = 'app_pin_salt';

async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
}

export type LockState = {
  hasPin: boolean;
  enabled: boolean;
  unlock: (pin: string) => Promise<boolean>;
  setPin: (pin: string) => Promise<void>;
  removePin: () => Promise<void>;
  setEnabled: (enabled: boolean) => void;
};

export function useLockState(): LockState {
  // Recalculado a cada bump: importar um backup pode trocar o PIN, desligar o
  // lock ou remover o PIN sem que nenhum destes ecrãs se remonte.
  const [hasPin, setHasPin] = useState(() => getSetting(HASH_KEY) !== null);
  const [enabled, setEnabledState] = useState(
    () => getSetting(LOCK_KEY) === '1' && getSetting(HASH_KEY) !== null
  );

  useEffect(
    () =>
      subscribeDataVersion(() => {
        setHasPin(getSetting(HASH_KEY) !== null);
        setEnabledState(getSetting(LOCK_KEY) === '1' && getSetting(HASH_KEY) !== null);
      }),
    []
  );

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let active = true;

    void ScreenCapture.preventScreenCaptureAsync().catch(() => undefined);

    return () => {
      active = false;
      void ScreenCapture.allowScreenCaptureAsync().catch(() => undefined);
    };
  }, [enabled]);

  const setEnabled = useCallback((value: boolean) => {
    setSetting(LOCK_KEY, value ? '1' : '0');
    setEnabledState(value && getSetting(HASH_KEY) !== null);
  }, []);

  const setPin = useCallback(async (pin: string) => {
    const salt = Crypto.randomUUID();
    const hash = await hashPin(pin, salt);

    setSetting(SALT_KEY, salt);
    setSetting(HASH_KEY, hash);
    setSetting(LOCK_KEY, '1');
    setHasPin(true);
    setEnabledState(true);
  }, []);

  const removePin = useCallback(async () => {
    removeSetting(SALT_KEY);
    removeSetting(HASH_KEY);
    removeSetting(LOCK_KEY);
    setHasPin(false);
    setEnabledState(false);
  }, []);

  const unlock = useCallback(async (pin: string) => {
    const salt = getSetting(SALT_KEY);
    const hash = getSetting(HASH_KEY);

    if (salt === null || hash === null) {
      return false;
    }

    const candidate = await hashPin(pin, salt);
    return candidate === hash;
  }, []);

  return { hasPin, enabled, unlock, setPin, removePin, setEnabled };
}
