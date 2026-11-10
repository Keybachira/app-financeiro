import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { fonts, spacing, useEstilosTema, type Cores } from "../tema";

/**
 * Cabeçalho normal: título grande, subtítulo opcional (uma linha, truncado) e
 * um slot à direita para ações.
 */
export function CabecalhoEcra({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  const styles = useEstilosTema(makeStyles);

  return (
    <View style={styles.header}>
      <View style={styles.titleBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {/* O slot era renderizado cru: `styles.right` estava definido mas nunca
          aplicado, por isso vários ícones no `right` ficavam colados sem gap. */}
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const makeStyles = (colors: Cores) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.lg,
      minHeight: 44,
    },
    titleBlock: {
      flex: 1,
      gap: 2,
    },
    subtitle: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 28,
      fontWeight: "700",
      letterSpacing: -0.5,
      color: colors.text,
    },
    right: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
  });
