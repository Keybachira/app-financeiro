import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';

import { colors, fontAssets, fonts, radius, spacing } from '../src/ui/theme';
import { useDatabase } from '../src/db/useDatabase';
import { ToastProvider } from '../src/ui/components/Toast';

export default function RootLayout() {
  const [fontsLoaded, fontsError] = useFonts(fontAssets);
  const { ready: dbReady, error: dbError } = useDatabase();

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

  return (
    <ToastProvider>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="movement/new" options={{ presentation: 'modal' }} />
          <Stack.Screen name="movement/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
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
