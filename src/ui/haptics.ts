import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Feedback háptico centralizado.
 *
 * `expo-haptics` estava declarado nas dependências desde o início mas nunca
 * importado, pelo que a app era totalmente silenciosa ao toque. Passa a estar
 * ligado, mas de forma contenida: toque ligeiro nos números e interruptores,
 * confirmação mais forte nas ações destrutivas e de sucesso.
 *
 * Todas as chamadas são `void` e toleram falha — em iOS Simulator, web e
 * Android sem motor de vibração não há hardware e a app não pode quebrar por isso.
 */

function fire(run: () => Promise<unknown>): void {
  void run().catch(() => undefined);
}

/** Toque normal: teclas, chips, cards, fechar. */
export function tapLight(): void {
  if (Platform.OS === 'web') {
    return;
  }

  fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** Mimeo de uma ação que mudou algo: guardar, pagar, registar. */
export function tapMedium(): void {
  if (Platform.OS === 'web') {
    return;
  }

  fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

/** Sucesso confirmado: "Movimento guardado", "Conta paga". */
export function notifySuccess(): void {
  if (Platform.OS === 'web') {
    return;
  }

  fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

/** Erro ou ação recusada: PIN errado, "já foi paga", validação falha. */
export function notifyError(): void {
  if (Platform.OS === 'web') {
    return;
  }

  fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}