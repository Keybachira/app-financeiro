import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius } from '../theme';

export function Switch({
  value,
  onValueChange,
  label,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      onPress={() => onValueChange(!value)}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      style={[styles.track, value && styles.trackOn]}
    >
      <View style={[styles.knob, value && styles.knobOn]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 52,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,.14)',
    padding: 4,
    justifyContent: 'center',
  },
  trackOn: {
    backgroundColor: colors.tabPill,
  },
  knob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.text,
  },
  knobOn: {
    transform: [{ translateX: 20 }],
  },
});
