import type { NotificationResponse } from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";

import { rescheduleAllBillNotifications } from "../../repos/bills";
import { isExpoGo } from "../../repos/notificationRuntime";
import {
  configureNotificationHandling,
  getNotifications,
} from "../../repos/notifications";

export function useNotificationSetup(ready: boolean): void {
  const router = useRouter();
  const handled = useRef(new Set<string>());

  useEffect(() => {
    void configureNotificationHandling();
  }, []);

  // Reagenda os lembretes de contas mesmo que o utilizador não abra o ecrã.
  useEffect(() => {
    if (!ready || isExpoGo()) return;
    void rescheduleAllBillNotifications().catch(() => undefined);
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const Notifications = getNotifications();
    if (!Notifications) return;

    const openResponse = (response: NotificationResponse) => {
      const key = `${response.notification.request.identifier}:${response.actionIdentifier}`;
      if (handled.current.has(key)) return;
      handled.current.add(key);
      // Evita navegação duplicada no arranque sem bloquear um toque posterior.
      setTimeout(() => handled.current.delete(key), 1000);

      const data = response.notification.request.content.data as
        | { billId?: unknown; source?: unknown }
        | null
        | undefined;

      if (data?.source === "intelligence") {
        router.push("/inteligencia");
      } else if (data && typeof data.billId === "string") {
        router.push("/bill");
      } else {
        router.push("/notificacoes");
      }
    };

    const subscription =
      Notifications.addNotificationResponseReceivedListener(openResponse);

    try {
      const last = Notifications.getLastNotificationResponse();
      if (last) {
        openResponse(last);
        Notifications.clearLastNotificationResponse();
      }
    } catch {
      // A implementação nativa pode não estar disponível neste ambiente.
    }

    return () => subscription.remove();
  }, [ready, router]);
}
