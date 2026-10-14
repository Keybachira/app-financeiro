import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text } from 'react-native';

import { addDays, formatDayMonthPt } from '../../domain/dates';
import { colors, fonts, gradients } from '../theme';

export function DayChips({
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
  const yesterday = addDays(today, -1);
  const isCustom = value !== today && value !== yesterday;

  const options = [
    { key: 'today', label: 'Hoje', date: today, onPress: () => onChange(today) },
    { key: 'yesterday', label: 'Ontem', date: yesterday, onPress: () => onChange(yesterday) },
    {
      key: 'custom',
      label: isCustom ? formatDayMonthPt(value) : 'Outro dia',
      date: value,
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
        const active = option.date === value;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={option.onPress}
            hitSlop={{ top: 4, bottom: 4, left: 0, right: 0 }}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.panelBorder,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.tabPill,
    borderColor: 'transparent',
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
