import type { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { useEstilosTema, type Cores } from "../tema";

/**
 * Superfície de destaque da referência (`.hs`): roxo sólido, cantos de 26 e
 * texto branco.
 *
 * Substitui o antigo `CartaoVidro` — sem gradiente nem brilhos radiais, porque
 * esses elementos não existem no protótipo `ab-finance.html`.
 */
export function CartaoDestaque({
  children,
  style,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useEstilosTema(makeStyles);

  return <View style={[styles.card, style]}>{children}</View>;
}

const makeStyles = (colors: Cores) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.accent,
      borderRadius: 26,
      paddingTop: 18,
      paddingHorizontal: 18,
      paddingBottom: 16,
      marginTop: 16,
    },
  });
