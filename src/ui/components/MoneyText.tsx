import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';

import { formatKzNumber } from '../../domain/money';
import { colors, fonts } from '../theme';

type Size = 'hero' | 'balance' | 'lg' | 'md' | 'sm';
type Tone = 'default' | 'income' | 'expense' | 'warn' | 'muted';

const SIZES: Record<Size, number> = { hero: 52, balance: 40, lg: 20, md: 16, sm: 13 };
const SUFFIX_SIZES: Record<Size, number> = { hero: 22, balance: 20, lg: 14, md: 11, sm: 9 };
const WEIGHTS: Record<Size, string> = {
  hero: fonts.bold,
  balance: fonts.bold,
  lg: fonts.bold,
  md: fonts.medium,
  sm: fonts.regular,
};
const TONES: Record<Tone, string> = {
  default: colors.text,
  income: colors.accent,
  expense: colors.text,
  warn: colors.warn,
  muted: colors.textMuted,
};

export function MoneyText({
  value,
  tone = 'default',
  size = 'md',
  showKz = true,
  style,
}: {
  value: number;
  tone?: Tone;
  size?: Size;
  showKz?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  const color = TONES[tone];
  const fontSize = SIZES[size];

  return (
    <Text
      style={[
        styles.base,
        { color, fontSize, fontFamily: WEIGHTS[size], letterSpacing: size === 'hero' || size === 'balance' ? -1 : 0 },
        style,
      ]}
    >
      {formatKzNumber(value)}
      {showKz ? <Text style={[styles.suffix, { fontSize: SUFFIX_SIZES[size], color }]}> Kz</Text> : null}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontVariant: ['tabular-nums'],
  },
  suffix: {
    fontFamily: fonts.medium,
    opacity: 0.7,
  },
});
