import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

import { fonts, radius, useTema, type Cores } from "../tema";

type Tone = "neutral" | "warn" | "accent";

const tones = (colors: Cores): Record<Tone, { bg: string; text: string }> => ({
  neutral: { bg: colors.chipNeutralBg, text: colors.chipNeutralText },
  warn: { bg: colors.chipWarnBg, text: colors.chipWarnText },
  accent: { bg: colors.chipAccentBg, text: colors.chipAccentText },
});

/**
 * Etiqueta pequena de estado (ex.: "Liquidada", "Atrasada").
 *
 * 'tone' escolhe o trio de cores (fundo/texto) do tema: neutro, aviso ou
 * destaque.
 */
export function ChipEstado({
  label,
  tone = "neutral",
  style,
}: {
  label: string;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTema();
  const t = tones(colors)[tone];

  return (
    <View style={[styles.chip, { backgroundColor: t.bg }, style]}>
      <Text style={[styles.label, { color: t.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    borderRadius: radius.chip,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
});
