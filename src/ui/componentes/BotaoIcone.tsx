import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { useTema, useEstilosTema, type Cores } from "../tema";
import { PressivelEscala } from "./PressivelEscala";

/**
 * Botão quadrado (44×44, o alvo mínimo de toque) com um ícone e, opcionalmente,
 * um ponto de aviso no canto superior direito.
 */
export function BotaoIcone({
  icon: Icon,
  label,
  onPress,
  badge = false,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  badge?: boolean;
}) {
  const { colors, gradients } = useTema();
  const styles = useEstilosTema(makeStyles);

  return (
    <PressivelEscala
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.wrap}
      radius={22}
    >
      <LinearGradient
        colors={gradients.panel.colors}
        start={gradients.panel.start}
        end={gradients.panel.end}
        style={styles.button}
      >
        <Icon color={colors.text} size={22} strokeWidth={2} />
        {badge ? <View style={styles.badge} /> : null}
      </LinearGradient>
    </PressivelEscala>
  );
}

const makeStyles = (colors: Cores) =>
  StyleSheet.create({
    wrap: {
      width: 44,
      height: 44,
    },
    button: {
      flex: 1,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.panelBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    badge: {
      position: "absolute",
      top: 10,
      right: 11,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.warn,
    },
  });
