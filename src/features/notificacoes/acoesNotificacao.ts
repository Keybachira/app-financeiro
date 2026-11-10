import { ensureNotificationSetup } from "../../repos/bills";
import { getNotifications } from "../../repos/notifications";

/**
 * Envia uma notificação de teste, criando primeiro a permissão se necessário.
 *
 * Nunca lança: devolve '{ ok, message }' para o ecrã poder mostrar o resultado.
 */
export async function enviarNotificacaoTeste(): Promise<{
  ok: boolean;
  message: string;
}> {
  const Notifications = getNotifications();
  if (!Notifications) {
    return { ok: false, message: "Notificações indisponíveis neste build." };
  }

  const permission = await ensureNotificationSetup();
  if (permission !== "granted") {
    return {
      ok: false,
      message: "Permissão de notificações não concedida.",
    };
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Notificações ativas",
        body: "Teste do Meu Kumbo. Os teus lembretes vão aparecer assim.",
        data: { screen: "notifications" },
      },
      trigger: null,
    });
    return { ok: true, message: "Notificação de teste enviada." };
  } catch {
    return { ok: false, message: "Não foi possível enviar a notificação." };
  }
}
