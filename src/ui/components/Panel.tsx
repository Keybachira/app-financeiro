import type { ReactNode } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { gradients, radius, spacing } from '../theme';

export function Panel({
  children,
  style,
  padded = true,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  return (
    <LinearGradient
      colors={gradients.panel.colors}
      start={gradients.panel.start}
      end={gradients.panel.end}
      style={[styles.panel, padded && styles.padded, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: radius.panel,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.07)',
    backgroundColor: '#101839',
  },
  padded: {
    padding: spacing.lg,
  },
});
