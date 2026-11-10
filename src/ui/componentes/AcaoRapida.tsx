import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { LucideIcon } from "lucide-react-native";

import { fonts, useTema, useEstilosTema, type Cores } from "../tema";
import { PressivelEscala } from "./PressivelEscala";

/**
 * Atalho circular do Início (ícone + legenda) com contador opcional.
 *
 * 'badge' conta itens por resolver (ex.: contas em aberto); só aparece quando
 * é maior que zero.
 */
export function AcaoRapida({
  icon: Icon,
  label,
  badge = 0,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  badge?: number;
  onPress: () => void;
}) {
  const { gradients } = useTema();
  const styles = useEstilosTema(makeStyles);

  return (
    <PressivelEscala
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.wrap}
    >
      <LinearGradient
        colors={gradients.primary.colors}
        start={gradients.primary.start}
        end={gradients.primary.end}
        style={styles.circle}
      >
        <Icon color="#FFFFFF" size={22} strokeWidth={2} />
        {badge > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{String(badge)}</Text>
          </View>
        ) : null}
      </LinearGradient>
      <Text style={styles.label}>{label}</Text>
    </PressivelEscala>
  );
}

const makeStyles = (colors: Cores) =>
  StyleSheet.create({
    wrap: {
      alignItems: "center",
      gap: 6,
      minWidth: 64,
    },
    circle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: "center",
      justifyContent: "center",
    },
    badge: {
      position: "absolute",
      top: 2,
      right: 0,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.warn,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
    },
    badgeText: {
      fontFamily: fonts.bold,
      fontSize: 12,
      color: "#101839",
    },
    label: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
    },
  });
