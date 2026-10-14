import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius } from '../theme';
import { PressableScale } from './PressableScale';

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.track}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <PressableScale
            key={option.value}
            accessibilityLabel={option.label}
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            hitSlop={4}
            pressedScale={0.96}
            style={[styles.item, active && styles.itemActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,.12)',
    borderRadius: radius.control,
    padding: 4,
    gap: 4,
  },
  item: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemActive: {
    backgroundColor: colors.tabPill,
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
  labelActive: {
    fontFamily: fonts.bold,
    color: colors.text,
  },
});
