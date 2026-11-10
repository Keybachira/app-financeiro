import type { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { type Cores, spacing, useEstilosTema } from "../tema";

/**
 * Superfície base do design system: fundo 'bgMid' e cantos muito redondos.
 *
 * 'padded' liga/desliga o espaçamento interior — listas que desenham linhas
 * encostadas às bordas passam 'padded={false}'.
 */
export function Painel({
  children,
  style,
  padded = true,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  const styles = useEstilosTema(makeStyles);

  return (
    <View style={[styles.panel, padded && styles.padded, style]}>
      {children}
    </View>
  );
}

const makeStyles = (colors: Cores) =>
  StyleSheet.create({
    panel: {
      borderRadius: 28,
      backgroundColor: colors.bgMid,
    },
    padded: {
      padding: spacing.lg,
    },
  });
