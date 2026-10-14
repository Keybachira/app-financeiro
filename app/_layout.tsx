import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';

import { colors, fontAssets, fonts, radius, spacing } from '../src/ui/theme';
import { useDatabase } from '../src/db/useDatabase';
import { ToastProvider } from '../src/ui/components/Toast';
import { useAutoSalary } from '../src/features/salary/useSalary';
import { useLockState } from '../src/features/security/useLockState';
import { LockScreen } from './lock';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontsError] = useFonts(fontAssets);
  const { ready: dbReady, error: dbError } = useDatabase();
  const { hasPin, enabled } = useLockState();
  const [unlocked, setUnlocked] = useState(() => !(hasPin && enabled));

  useAutoSalary();

  useEffect(() => {
    if (fontsLoaded || fontsError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontsError]);

  const handleUnlocked = useCallback(() => setUnlocked(true), []);

  if (dbError) {
    return (
      <View style={styles.centered}>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Erro ao abrir a base de dados</Text>
          <Text style={styles.errorText}>{dbError.message}</Text>
        </View>
      </View>
    );
  }

  if ((!fontsLoaded && !fontsError) || !dbReady) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  if (!unlocked && hasPin && enabled) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <LockScreen onUnlocked={handleUnlocked} />
      </SafeAreaProvider>
    );
  }

  return (
    <ToastProvider>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: 'fade',
            animationDuration: 180,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="movement/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="movement/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="settings" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="backup" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="goal/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="goal/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="debt/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="debt/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="project/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="project/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="salary" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="bill" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="bill/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
      </SafeAreaProvider>
    </ToastProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  errorCard: {
    margin: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.panel,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.bgMid,
  },
  errorTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.warn,
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
