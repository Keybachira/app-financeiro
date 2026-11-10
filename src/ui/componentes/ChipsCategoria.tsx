import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, StyleSheet, Text } from "react-native";

import { fonts, useTema, useEstilosTema, type Cores } from "../tema";
import { PressivelEscala } from "./PressivelEscala";

/**
 * Fila horizontal de categorias; a selecionada usa o gradiente primário.
 *
 * É um 'ScrollView' horizontal sem indicador porque a lista de categorias não
 * cabe na largura do telemóvel; o toque devolve sempre a categoria escolhida.
 */
export function ChipsCategoria({
  categories,
  value,
  onChange,
}: {
  categories: readonly string[];
  value: string;
  onChange: (category: string) => void;
}) {
  const { gradients } = useTema();
  const styles = useEstilosTema(makeStyles);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {categories.map((category) => {
        const active = category === value;
        return (
          <PressivelEscala
            key={category}
            accessibilityLabel={category}
            accessibilityState={{ selected: active }}
            onPress={() => onChange(category)}
            hitSlop={4}
            pressedScale={0.95}
            radius={18}
            style={active && styles.chipActive}
          >
            <LinearGradient
              colors={
                active ? gradients.primary.colors : gradients.panel.colors
              }
              start={active ? gradients.primary.start : gradients.panel.start}
              end={active ? gradients.primary.end : gradients.panel.end}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.label, active && styles.labelActive]}>
                {category}
              </Text>
            </LinearGradient>
          </PressivelEscala>
        );
      })}
    </ScrollView>
  );
}

const makeStyles = (colors: Cores) =>
  StyleSheet.create({
    row: {
      gap: 8,
      paddingVertical: 2,
    },
    chip: {
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.panelBorder,
      paddingHorizontal: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    chipActive: {
      borderColor: "transparent",
    },
    label: {
      fontFamily: fonts.regular,
      fontSize: 14,
      color: colors.text,
    },
    labelActive: {
      fontFamily: fonts.bold,
    },
  });
