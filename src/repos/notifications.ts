import type * as NotificationsModule from 'expo-notifications';

/**
 * Wrapper de carregamento preguiçoso para `expo-notifications`.
 *
 * A partir do SDK 53 o Expo Go deixou de suportar notificações push remotas e o
 * acesso ao módulo nativo pode lançar uma exceção. Como o import estático é
 * avaliado no arranque do bundle, carregamos o módulo de forma dinâmica dentro
 * de um `try/catch` para que a aplicação continue a funcionar sem notificações
 * (por exemplo, no Expo Go) em vez de crashar.
 */

let cached: typeof NotificationsModule | null | undefined;

export function getNotifications(): typeof NotificationsModule | null {
  if (cached !== undefined) {
    return cached;
  }

  try {
    // `require` dinâmico mantém o módulo fora do grafo de import estático.
    cached = require('expo-notifications') as typeof NotificationsModule;
  } catch {
    cached = null;
  }

  return cached;
}
