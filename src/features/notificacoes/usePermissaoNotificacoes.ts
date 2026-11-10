import { useCallback, useEffect, useState } from "react";

import { motorInteligencia } from "../inteligencia/motor";
import { rescheduleAllBillNotifications } from "../../repos/bills";
import {
  getNotificationPermissionState,
  requestNotificationPermission,
  type NotificationPermissionState,
} from "../../repos/notifications";

/**
 * Estado da permissão de notificações e pedido da mesma.
 *
 * Ao obter "granted" reagenda logo os lembretes de contas e pede ao motor de
 * inteligência que reagende a janela atual, em vez de esperar pelo próximo
 * arranque da app.
 */
export function usePermissaoNotificacoes(): {
  state: NotificationPermissionState | null;
  refresh: () => Promise<void>;
  request: () => Promise<NotificationPermissionState>;
} {
  const [state, setState] = useState<NotificationPermissionState | null>(null);

  const refresh = useCallback(async () => {
    setState(await getNotificationPermissionState());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const request = useCallback(async () => {
    const next = await requestNotificationPermission();
    setState(next);
    if (next === "granted") {
      await rescheduleAllBillNotifications();
      // A inteligência também tem lembretes próprios; ao ganhar permissão,
      // agenda já a janela atual em vez de esperar pelo próximo arranque.
      void motorInteligencia.onAppOpen().catch(() => undefined);
    }
    return next;
  }, []);

  return { state, refresh, request };
}
