import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { tapLight } from '../haptics';
import { colors, radius } from '../theme';

const KNOB_TRAVEL = 20;

export function Switch({
  value,
  onValueChange,
  label,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
}) {
  const travel = useRef(new Animated.Value(value ? KNOB_TRAVEL : 0)).current;

  // Único componente de UI sem animação: a knob saltava de translateX 0 para
  // 20 de um instante. Só transform, logo `useNativeDriver` é seguro.
  useEffect(() => {
    Animated.timing(travel, {
      toValue: value ? KNOB_TRAVEL : 0,
      duration: 170,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [travel, value]);

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      onPress={() => {
        tapLight();
        onValueChange(!value);
      }}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      android_ripple={{ color: 'rgba(255,255,255,.14)' }}
      style={[styles.track, value && styles.trackOn]}
    >
      <Animated.View style={[styles.knob, { transform: [{ translateX: travel }] }]} />
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
});
