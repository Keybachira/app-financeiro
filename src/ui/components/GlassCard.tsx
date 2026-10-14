import type { ReactNode } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, gradients, radius } from '../theme';
import { RadialHighlight } from './RadialHighlight';

export function GlassCard({ children, style }: { children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient
      colors={gradients.glass.colors}
      start={gradients.glass.start}
      end={gradients.glass.end}
      style={[styles.card, style]}
    >
      <RadialHighlight cx={0.92} cy={-0.1} rx={0.45} color={colors.glowWhite} opacity={0.5} />
      <RadialHighlight cx={0} cy={1.15} rx={0.55} color={colors.glowDeep} opacity={0.7} />
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 20,
    overflow: 'hidden',
    shadowColor: '#2850C8',
    shadowOpacity: 0.4,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
});
