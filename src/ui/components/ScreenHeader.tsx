import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '../theme';

export function ScreenHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    minHeight: 44,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.text,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});

export function ScreenHeaderActions({ children }: { children: ReactNode }) {
  return <View style={styles.right}>{children}</View>;
}
