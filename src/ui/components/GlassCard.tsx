import type { ReactNode } from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme, useThemedStyles, type Colors } from "../theme";
import { RadialHighlight } from "./RadialHighlight";

export function GlassCard({
  children,
  style,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, gradients } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <LinearGradient
      colors={gradients.glass.colors}
      start={gradients.glass.start}
      end={gradients.glass.end}
      style={[styles.card, style]}
    >
      <RadialHighlight
        cx={0.92}
        cy={-0.1}
        rx={0.45}
        color={colors.glowWhite}
        opacity={0.5}
      />
      <RadialHighlight
        cx={0}
        cy={1.15}
        rx={0.55}
        color={colors.glowDeep}
        opacity={0.7}
      />
      {children}
    </LinearGradient>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    card: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      padding: 20,
      overflow: "hidden",
      shadowColor: colors.accent,
      shadowOpacity: 0.22,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      elevation: 8,
    },
  });
