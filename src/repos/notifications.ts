import type * as NotificationsModule from 'expo-notifications';

/**
 * Wrapper de carregamento preguiçoso para `expo-notifications`.
 */

let cached: typeof NotificationsModule | null | undefined;

export type NotificationPermissionState = 'granted' | 'denied' | 'unavailable';

export function getNotifications(): typeof NotificationsModule | null {
  if (cached !== undefined) return cached;
  try {
    cached = require('expo-notifications') as typeof NotificationsModule;
  } catch {
    cached = null;
  }
  return cached;
}

export async function configureNotificationHandling(): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch {
    // Ambiente sem suporte.
  }
}

export async function getNotificationPermissionState(): Promise<NotificationPermissionState> {
  const Notifications = getNotifications();
  if (!Notifications) return 'unavailable';
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'unavailable';
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  const Notifications = getNotifications();
  if (!Notifications) return 'unavailable';
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.status === 'granted') return 'granted';
    const request = await Notifications.requestPermissionsAsync();
    return request.status === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'unavailable';
  }
}