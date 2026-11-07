import type { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { type Colors, spacing, useThemedStyles } from "../theme";

export function Panel({
  children,
  style,
  padded = true,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={[styles.panel, padded && styles.padded, style]}>
      {children}
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    panel: {
      borderRadius: 28,
      backgroundColor: colors.bgMid,
    },
    padded: {
      padding: spacing.lg,
    },
  });
