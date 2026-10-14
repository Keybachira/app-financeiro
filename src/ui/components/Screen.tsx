import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../theme';
import { ScreenBackground } from './ScreenBackground';
import { ScreenHeader } from './ScreenHeader';

export function Screen({
  title,
  right,
  floating,
  children,
}: {
  title: string;
  right?: ReactNode;
  floating?: ReactNode;
  children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm }]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title={title} right={right} />
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
