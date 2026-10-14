import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, fonts, radius } from '../theme';

type Tone = 'neutral' | 'warn' | 'accent';

const TONES: Record<Tone, { bg: string; text: string }> = {
  neutral: { bg: colors.chipNeutralBg, text: colors.chipNeutralText },
  warn: { bg: colors.chipWarnBg, text: colors.chipWarnText },
  accent: { bg: colors.chipAccentBg, text: colors.chipAccentText },
};

export function StatusChip({
  label,
  tone = 'neutral',
  style,
}: {
  label: string;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
}) {
  const t = TONES[tone];

  return (
    <View style={[styles.chip, { backgroundColor: t.bg }, style]}>
      <Text style={[styles.label, { color: t.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    borderRadius: radius.chip,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.text,
  },
});
