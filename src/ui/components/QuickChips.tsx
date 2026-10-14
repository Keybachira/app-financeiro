import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { RotateCcw } from 'lucide-react-native';

import { colors, fonts, gradients } from '../theme';
import { PressableScale } from './PressableScale';

export type QuickChipItem = {
  key: string;
  label: string;
  highlighted: boolean;
};

export function QuickChips({
  items,
  onSelect,
}: {
  items: QuickChipItem[];
  onSelect: (key: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {items.map((item) => (
        <PressableScale
          key={item.key}
          accessibilityLabel={item.label}
          onPress={() => onSelect(item.key)}
          hitSlop={4}
          pressedScale={0.95}
          radius={18}
          style={styles.pressable}
        >
          <LinearGradient
            colors={item.highlighted ? gradients.primary.colors : gradients.panel.colors}
            start={item.highlighted ? gradients.primary.start : gradients.panel.start}
            end={item.highlighted ? gradients.primary.end : gradients.panel.end}
            style={[styles.chip, !item.highlighted && styles.chipMuted]}
          >
            {item.highlighted ? <RotateCcw color={colors.text} size={14} strokeWidth={2} /> : null}
            <Text style={[styles.label, !item.highlighted && styles.labelMuted]}>{item.label}</Text>
          </LinearGradient>
        </PressableScale>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    flexDirection: 'row',
    alignItems: 'center',
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
