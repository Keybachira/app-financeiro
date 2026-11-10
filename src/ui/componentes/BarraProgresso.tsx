import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useTema, useEstilosTema, type Cores } from "../tema";

type Tone = "white" | "accent" | "warn" | "gradient";

const fills = (
  colors: Cores,
): Record<Exclude<Tone, "gradient">, string> => ({
  white: colors.text,
  accent: colors.accent,
  warn: colors.warn,
});

/**
 * Barra de progresso horizontal; 'value' é uma fração 0..1.
 *
 * O valor é limitado a 0..1 só para o desenho — quem mostra percentagens usa o
 * valor original para não esconder excessos. O preenchimento pode ser um
 * gradiente ou uma cor sólida conforme 'tone'.
 */
export function BarraProgresso({
  value,
  tone = "gradient",
  height = 6,
  style,
}: {
  value: number;
  tone?: Tone;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, gradients } = useTema();
  const styles = useEstilosTema(makeStyles);
  const pct = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
      style={[styles.track, { height, borderRadius: height / 2 }, style]}
    >
      <View
        style={[
          styles.fillWrapper,
          { width: `${pct * 100}%`, height, borderRadius: height / 2 },
        ]}
      >
        {tone === "gradient" ? (
          <LinearGradient
            colors={gradients.progress.colors}
            start={gradients.progress.start}
            end={gradients.progress.end}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: fills(colors)[tone] },
            ]}
          />
        )}
      </View>
    </View>
  );
}

const makeStyles = (colors: Cores) =>
  StyleSheet.create({
    track: {
      backgroundColor: colors.trackSoft,
      overflow: "hidden",
    },
    fillWrapper: {
      overflow: "hidden",
    },
  });
