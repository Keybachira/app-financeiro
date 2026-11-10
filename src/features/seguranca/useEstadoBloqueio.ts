import { useCallback, useEffect, useState } from "react";
import * as Crypto from "expo-crypto";
import * as ScreenCapture from "expo-screen-capture";

import { bumpDataVersion, subscribeDataVersion } from "../../repos/dataVersion";
import { getSetting, removeSetting, setSetting } from "../../repos/settings";

const LOCK_KEY = "app_lock_enabled";
const HASH_KEY = "app_pin_hash";
const SALT_KEY = "app_pin_salt";
const FAIL_KEY = "app_pin_failures";
const BLOCK_KEY = "app_pin_blocked_until";
const ROUNDS_KEY = "app_pin_block_rounds";

// 5 tentativas erradas → 30 s de espera; cada bloqueio seguinte dura o dobro, até
// 5 minutos. Os contadores ficam nas definições para sobreviverem a um reinício
// da app (senão bastava fechar e abrir para ter tentativas infinitas).
const MAX_TENTATIVAS = 5;
const BLOQUEIO_BASE_MS = 30_000;
const BLOQUEIO_MAX_MS = 5 * 60_000;

function lerNumero(chave: string): number {
  const raw = getSetting(chave);
  const valor = raw === null ? 0 : Number(raw);
  return Number.isFinite(valor) ? valor : 0;
}

async function gerarHashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${pin}`,
  );
}

export type EstadoBloqueio = {
  hasPin: boolean;
  enabled: boolean;
  unlock: (pin: string) => Promise<boolean>;
  setPin: (pin: string) => Promise<void>;
  removePin: () => Promise<void>;
  setEnabled: (enabled: boolean) => void;
  /** Tentativas que ainda restam antes do bloqueio temporário. */
  tentativasRestantes: number;
  /** Momento (ms) até quando as tentativas estão bloqueadas, ou null. */
  bloqueadoAte: number | null;
};

/**
 * PIN de bloqueio da app: criar, validar, remover e ligar/desligar.
 *
 * O PIN nunca é guardado em claro — só 'SHA-256(salt:pin)' e um salt aleatório.
 * Enquanto o bloqueio está ativo, as capturas de ecrã são impedidas. Tudo é
 * relido quando a versão dos dados muda (um backup pode trazer outro PIN).
 */
export function useEstadoBloqueio(): EstadoBloqueio {
  // Recalculado a cada bump: importar um backup pode trocar o PIN, desligar o
  // lock ou remover o PIN sem que nenhum destes ecrãs se remonte.
  const [hasPin, setHasPin] = useState(() => getSetting(HASH_KEY) !== null);
  const [enabled, setEnabledState] = useState(
    () => getSetting(LOCK_KEY) === "1" && getSetting(HASH_KEY) !== null,
  );
  const [falhas, setFalhas] = useState(() => lerNumero(FAIL_KEY));
  const [bloqueadoAte, setBloqueadoAte] = useState<number | null>(() => {
    const ate = lerNumero(BLOCK_KEY);
    return ate > Date.now() ? ate : null;
  });

  useEffect(
    () =>
      subscribeDataVersion(() => {
        setHasPin(getSetting(HASH_KEY) !== null);
        setEnabledState(
          getSetting(LOCK_KEY) === "1" && getSetting(HASH_KEY) !== null,
        );
        setFalhas(lerNumero(FAIL_KEY));
        const ate = lerNumero(BLOCK_KEY);
        setBloqueadoAte(ate > Date.now() ? ate : null);
      }),
    [],
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
    setSetting(LOCK_KEY, value ? "1" : "0");
    setEnabledState(value && getSetting(HASH_KEY) !== null);
    bumpDataVersion();
  }, []);

  const setPin = useCallback(async (pin: string) => {
    const salt = Crypto.randomUUID();
    const hash = await gerarHashPin(pin, salt);

    setSetting(SALT_KEY, salt);
    setSetting(HASH_KEY, hash);
    setSetting(LOCK_KEY, "1");
    // PIN novo começa com o contador de tentativas limpo.
    removeSetting(FAIL_KEY);
    removeSetting(BLOCK_KEY);
    removeSetting(ROUNDS_KEY);
    setHasPin(true);
    setEnabledState(true);
    setFalhas(0);
    setBloqueadoAte(null);
    bumpDataVersion();
  }, []);

  const removePin = useCallback(async () => {
    removeSetting(SALT_KEY);
    removeSetting(HASH_KEY);
    removeSetting(LOCK_KEY);
    removeSetting(FAIL_KEY);
    removeSetting(BLOCK_KEY);
    removeSetting(ROUNDS_KEY);
    setHasPin(false);
    setEnabledState(false);
    setFalhas(0);
    setBloqueadoAte(null);
    bumpDataVersion();
  }, []);

  const unlock = useCallback(async (pin: string) => {
    const salt = getSetting(SALT_KEY);
    const hash = getSetting(HASH_KEY);

    if (salt === null || hash === null) {
      return false;
    }

    // Bloqueio temporário: nem chega a comparar o PIN.
    if (lerNumero(BLOCK_KEY) > Date.now()) {
      return false;
    }

    const candidate = await gerarHashPin(pin, salt);

    if (candidate === hash) {
      removeSetting(FAIL_KEY);
      removeSetting(BLOCK_KEY);
      removeSetting(ROUNDS_KEY);
      setFalhas(0);
      setBloqueadoAte(null);
      return true;
    }

    const erradas = lerNumero(FAIL_KEY) + 1;

    if (erradas >= MAX_TENTATIVAS) {
      const rondas = lerNumero(ROUNDS_KEY) + 1;
      const espera = Math.min(
        BLOQUEIO_BASE_MS * 2 ** (rondas - 1),
        BLOQUEIO_MAX_MS,
      );
      const ate = Date.now() + espera;

      setSetting(ROUNDS_KEY, String(rondas));
      setSetting(BLOCK_KEY, String(ate));
      removeSetting(FAIL_KEY);
      setFalhas(0);
      setBloqueadoAte(ate);
      return false;
    }

    setSetting(FAIL_KEY, String(erradas));
    setFalhas(erradas);
    return false;
  }, []);

  return {
    hasPin,
    enabled,
    unlock,
    setPin,
    removePin,
    setEnabled,
    tentativasRestantes: Math.max(0, MAX_TENTATIVAS - falhas),
    bloqueadoAte,
  };
}
