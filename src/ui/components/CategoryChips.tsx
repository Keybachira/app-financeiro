import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors, fonts, gradients, radius } from '../theme';

export function CategoryChips({
  categories,
  value,
  onChange,
}: {
  categories: readonly string[];
  value: string;
  onChange: (category: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {categories.map((category) => {
        const active = category === value;
        return (
          <Pressable
            key={category}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(category)}
            hitSlop={{ top: 4, bottom: 4, left: 0, right: 0 }}
          >
            <LinearGradient
              colors={active ? gradients.primary.colors : gradients.panel.colors}
              start={active ? gradients.primary.start : gradients.panel.start}
              end={active ? gradients.primary.end : gradients.panel.end}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.label, active && styles.labelActive]}>{category}</Text>
            </LinearGradient>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
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
