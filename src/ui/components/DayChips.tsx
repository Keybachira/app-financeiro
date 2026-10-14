import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text } from 'react-native';

import { addDays, formatDayMonthPt } from '../../domain/dates';
import { colors, fonts, gradients } from '../theme';
import { PressableScale } from './PressableScale';

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
          <PressableScale
            key={option.key}
            accessibilityLabel={option.label}
            accessibilityState={{ selected: active }}
            onPress={option.onPress}
            hitSlop={4}
            pressedScale={0.94}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
          </PressableScale>
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
