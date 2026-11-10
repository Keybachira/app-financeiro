import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { useTema } from "../tema";

/**
 * Círculo colorido com um ícone no centro, usado como avatar/indicador de
 * categoria. O tamanho do círculo e do ícone são independentes para permitir
 * versões compactas (ex.: 28/16) sem perder legibilidade.
 */
export function IconeCirculo({
  icon: Icon,
  size = 40,
  iconSize = 22,
  tone = "accent",
  style,
}: {
  icon: LucideIcon;
  size?: number;
  iconSize?: number;
  tone?: "accent" | "neutral";
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTema();

  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor:
            tone === "accent" ? colors.iconTileBg : colors.chipNeutralBg,
        },
        style,
      ]}
    >
      <Icon
        color={tone === "accent" ? colors.accent : colors.textMuted}
        size={iconSize}
        strokeWidth={2}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: "center",
    justifyContent: "center",
  },
});
