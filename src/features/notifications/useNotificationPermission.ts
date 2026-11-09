import { useCallback, useEffect, useState } from "react";

import { intelligenceEngine } from "../intelligence/engine";
import { rescheduleAllBillNotifications } from "../../repos/bills";
import {
  getNotificationPermissionState,
  requestNotificationPermission,
  type NotificationPermissionState,
} from "../../repos/notifications";

export function useNotificationPermission(): {
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
      void intelligenceEngine.onAppOpen().catch(() => undefined);
    }
    return next;
  }, []);

  return { state, refresh, request };
}
