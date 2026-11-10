import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text } from "react-native";

import { addDays, formatDayMonthPt } from "../../domain/dates";
import { fonts, useTema, useEstilosTema, type Cores } from "../tema";
import { PressivelEscala } from "./PressivelEscala";

/**
 * Atalhos de data: Hoje, Ontem e "Outro dia" (abre o calendário).
 *
 * O chip "Outro dia" nunca deriva o estado ativo da data: se a data atual for
 * hoje, ficaria aceso ao mesmo tempo que "Hoje". Daí o 'isCustom'.
 */
export function ChipsDia({
  value,
  today,
  onChange,
  onCustomPress,
}: {
  value: string;
  today: string;
  onChange: (date: string) => void;
  onCustomPress: () => void;
}) {
  const { gradients } = useTema();
  const styles = useEstilosTema(makeStyles);
  const yesterday = addDays(today, -1);
  const isCustom = value !== today && value !== yesterday;

  const options = [
    {
      key: "today",
      label: "Hoje",
      date: today,
      active: value === today,
      onPress: () => onChange(today),
    },
    {
      key: "yesterday",
      label: "Ontem",
      date: yesterday,
      active: value === yesterday,
      onPress: () => onChange(yesterday),
    },
    {
      // `active` não pode ser derivado de `date`: o chip "Outro dia" recebe a
      // data atual em `value`, o que o faria acender em conjunto com "Hoje".
      key: "custom",
      label: isCustom ? formatDayMonthPt(value) : "Outro dia",
      date: value,
      active: isCustom,
      onPress: onCustomPress,
    },
  ];

  return (
    <LinearGradient
      colors={gradients.panel.colors}
      start={gradients.panel.start}
      end={gradients.panel.end}
      style={styles.row}
    >
      {options.map((option) => {
        const active = option.active;
        return (
          <PressivelEscala
            key={option.key}
            accessibilityLabel={option.label}
            accessibilityState={{ selected: active }}
            onPress={option.onPress}
            hitSlop={4}
            pressedScale={0.94}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {option.label}
            </Text>
          </PressivelEscala>
        );
      })}
    </LinearGradient>
  );
}

const makeStyles = (colors: Cores) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      gap: 8,
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
      backgroundColor: colors.tabPill,
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
