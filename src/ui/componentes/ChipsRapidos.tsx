import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, StyleSheet, Text } from "react-native";
import { RotateCcw } from "lucide-react-native";

import { fonts, useTema, useEstilosTema, type Cores } from "../tema";
import { PressivelEscala } from "./PressivelEscala";

export type ItemChipRapido = {
  key: string;
  label: string;
  highlighted: boolean;
};

/**
 * Fila de atalhos de movimentos recentes ("um toque guarda").
 *
 * Cada chip devolve apenas a sua 'key'; o ecrã de origem é que sabe os dados
 * completos por trás dela. Chips destacados (o último movimento) levam o
 * gradiente primário e o ícone de repetir.
 */
export function ChipsRapidos({
  items,
  onSelect,
}: {
  items: ItemChipRapido[];
  onSelect: (key: string) => void;
}) {
  const { colors, gradients } = useTema();
  const styles = useEstilosTema(makeStyles);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {items.map((item) => (
        <PressivelEscala
          key={item.key}
          accessibilityLabel={item.label}
          onPress={() => onSelect(item.key)}
          hitSlop={4}
          pressedScale={0.95}
          radius={18}
          style={styles.pressable}
        >
          <LinearGradient
            colors={
              item.highlighted
                ? gradients.primary.colors
                : gradients.panel.colors
            }
            start={
              item.highlighted ? gradients.primary.start : gradients.panel.start
            }
            end={item.highlighted ? gradients.primary.end : gradients.panel.end}
            style={[styles.chip, !item.highlighted && styles.chipMuted]}
          >
            {item.highlighted ? (
              <RotateCcw color={colors.text} size={14} strokeWidth={2} />
            ) : null}
            <Text
              style={[styles.label, !item.highlighted && styles.labelMuted]}
            >
              {item.label}
            </Text>
          </LinearGradient>
        </PressivelEscala>
      ))}
    </ScrollView>
  );
}

const makeStyles = (colors: Cores) =>
  StyleSheet.create({
    row: {
      gap: 8,
      paddingVertical: 2,
    },
    pressable: {
      borderRadius: 18,
    },
    chip: {
      height: 36,
      borderRadius: 18,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    chipMuted: {
      borderWidth: 1,
      borderColor: colors.panelBorder,
    },
    label: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: colors.text,
    },
    labelMuted: {
      fontFamily: fonts.regular,
    },
  });
