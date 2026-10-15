import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../theme';
import { ModalHeader } from './ModalHeader';
import { ScreenBackground } from './ScreenBackground';
import { ScreenHeader } from './ScreenHeader';

export function Screen({
  title,
  subtitle,
  right,
  floating,
  back = false,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  floating?: ReactNode;
  /**
   * Ecrãs abertos como modal precisam de voltar visível: o cabeçalho nativo do
   * `Stack` está desligado (`headerShown: false`), portanto sem isto só o gesto
   * de sistema tirava o utilizador do ecrã.
   */
  back?: boolean;
  children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm }]}
        showsVerticalScrollIndicator={false}
        // Sem isto, o primeiro toque numa linha com o teclado aberto era
        // consumido para o fechar e a linha não navegava. Os ecrãs de formulário
        // já usavam "handled"; este é o `ScrollView` da Home e listas.
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {back ? (
          <ModalHeader title={title} subtitle={subtitle} right={right} />
        ) : (
          <ScreenHeader title={title} right={right} />
        )}
        {children}
      </ScrollView>
      {floating}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 140,
    gap: spacing.md,
  },
});
