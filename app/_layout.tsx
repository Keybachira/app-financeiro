import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';

import { fontAssets, fonts, radius, spacing, useTema } from '../src/ui/tema';
import { useDatabase } from '../src/db/useDatabase';
import { ProvedorAvisosRapidos } from '../src/ui/componentes/AvisoRapido';
import { useSalarioAutomatico } from '../src/features/salario/useSalario';
import { useConfiguracaoNotificacoes } from '../src/features/notificacoes/useConfiguracaoNotificacoes';
import { useArranqueInteligencia } from '../src/features/inteligencia/useInteligencia';
import { useEstadoBloqueio } from '../src/features/seguranca/useEstadoBloqueio';
import { LockScreen } from './lock';
import { usePreferenciasApp } from '../src/features/definicoes/usePreferenciasApp';
import Onboarding from './onboarding';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { ready: dbReady, error: dbError } = useDatabase();
  const { colors, dark } = useTema();
  const { onboardingComplete: onboarded } = usePreferenciasApp();
  const styles = makeStyles(colors);
  const [fontsLoaded, fontsError] = useFonts(fontAssets);
  const { hasPin, enabled } = useEstadoBloqueio();
  const [unlocked, setUnlocked] = useState(() => !(hasPin && enabled));

  useEffect(() => {
    if (!hasPin || !enabled) return;

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        setUnlocked(false);
      }
    });

    return () => subscription.remove();
  }, [enabled, hasPin]);

  useSalarioAutomatico();
  useConfiguracaoNotificacoes(dbReady);
  useArranqueInteligencia(dbReady);

  useEffect(() => {
    if ((fontsLoaded || fontsError) && (dbReady || dbError)) {
      void SplashScreen.hideAsync();
    }
  }, [dbError, dbReady, fontsError, fontsLoaded]);

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
        <StatusBar style={dark ? 'light' : 'dark'} />
        <LockScreen onUnlocked={handleUnlocked} />
      </SafeAreaProvider>
    );
  }

  if (!onboarded) {
    return (
      <SafeAreaProvider>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <Onboarding />
      </SafeAreaProvider>
    );
  }

  return (
    <ProvedorAvisosRapidos>
      <SafeAreaProvider>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: 'default',
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
          <Stack.Screen name="bill/new" options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="notificacoes" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="inteligencia" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
      </SafeAreaProvider>
    </ProvedorAvisosRapidos>
  );
}

function makeStyles(colors: ReturnType<typeof useTema>['colors']) {
  return StyleSheet.create({
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
}
