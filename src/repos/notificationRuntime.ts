import Constants from 'expo-constants';

/** Expo Go não inclui a implementação nativa de push remoto desde o SDK 53. */
export function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}
