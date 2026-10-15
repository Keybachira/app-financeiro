import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, gradients } from '../theme';

type Tone = 'white' | 'accent' | 'warn' | 'gradient';

const FILLS: Record<Exclude<Tone, 'gradient'>, string> = {
  white: colors.text,
  accent: colors.accent,
  warn: colors.warn,
};

export function ProgressBar({
  value,
  tone = 'gradient',
  height = 6,
  style,
}: {
  value: number;
  tone?: Tone;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const pct = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
      style={[styles.track, { height, borderRadius: height / 2 }, style]}
    >
      <View style={[styles.fillWrapper, { width: `${pct * 100}%`, height, borderRadius: height / 2 }]}>
        {tone === 'gradient' ? (
          <LinearGradient
            colors={gradients.progress.colors}
            start={gradients.progress.start}
            end={gradients.progress.end}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: FILLS[tone] }]} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.trackSoft,
    overflow: 'hidden',
  },
  fillWrapper: {
    overflow: 'hidden',
  },
});
