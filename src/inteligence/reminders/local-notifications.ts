import { isExpoGo } from "../../repos/notificationRuntime";
import { getNotifications } from "../../repos/notifications";
import type {
  NotificationScheduler,
  Reminder,
} from "../types/intelligence.types";

const SOURCE = "intelligence";
const CHANNEL_ID = "intelligence";

/**
 * Camada de entrega: agenda previsões no sistema sem tocar nas notificações
 * das contas fixas. A app já configura o handler global em `repos/notifications`.
 */
export function createExpoScheduler(): NotificationScheduler {
  return {
    async cancelAll() {
      const Notifications = getNotifications();
      if (!Notifications) return;

      try {
        const all = await Notifications.getAllScheduledNotificationsAsync();
        await Promise.all(
          all
            .filter(
              (n) =>
                (n.content.data as { source?: string } | null)?.source ===
                SOURCE,
            )
            .map((n) =>
              Notifications.cancelScheduledNotificationAsync(n.identifier),
            ),
        );
      } catch {
        // Ambiente sem agendamento nativo.
      }
    },

    async schedule(reminders: Reminder[]) {
      // Expo Go não agenda lembretes automáticos; as previsões continuam a
      // funcionar no ecrã de inteligência.
      if (isExpoGo()) return;

      const Notifications = getNotifications();
      if (!Notifications) return;

      try {
        await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
          name: "Previsões",
          importance: Notifications.AndroidImportance.DEFAULT,
          lightColor: "#5B8DFF",
        });
        const permission = await Notifications.getPermissionsAsync();
        if (permission.status !== "granted") return;
      } catch {
        // iOS e ambientes sem canais/permissões.
      }

      const now = Date.now();

      for (const r of reminders) {
        const [y, m, d] = r.fireOn.split("-").map(Number);
        const date = new Date(y, m - 1, d, r.hour, 0, 0);
        if (date.getTime() <= now) continue; // nunca agendar no passado

        try {
          await Notifications.scheduleNotificationAsync({
            identifier: `${SOURCE}:${r.id}`,
            content: {
              title: r.title,
              body: r.body,
              data: { source: SOURCE, predictionId: r.predictionId },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date,
              channelId: CHANNEL_ID,
            },
          });
        } catch {
          // Uma previsão que falha não deve impedir as restantes.
        }
      }
    },
  };
}
