import { useCallback, useRef } from 'react';
import { Animated, Easing, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

/**
 * Pressable com feedback de toque reutilizável: reduz ligeiramente a escala e a
 * opacidade enquanto premido, com retorno suave. Usa o driver nativo para não
 * bloquear a thread de JS.
 */
export function PressableScale({
  children,
  style,
  pressedScale = 0.96,
  pressedOpacity = 0.9,
  hitSlop,
  disabled,
  accessibilityRole = 'button',
  accessibilityLabel,
  accessibilityState,
  onPress,
  radius: radiusOverride,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  pressedScale?: number;
  pressedOpacity?: number;
  hitSlop?: number | { top?: number; bottom?: number; left?: number; right?: number };
  disabled?: boolean;
  accessibilityRole?: 'button' | 'switch' | 'link';
  accessibilityLabel?: string;
  accessibilityState?: { selected?: boolean; checked?: boolean; disabled?: boolean };
  onPress: () => void;
  radius?: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const animateTo = useCallback(
    (toScale: number, toOpacity: number) => {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: toScale,
          duration: 110,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: toOpacity,
          duration: 110,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    },
    [scale, opacity]
  );

  const handlePressIn = useCallback(() => {
    if (disabled) {
      return;
    }
    animateTo(pressedScale, pressedOpacity);
  }, [animateTo, disabled, pressedScale, pressedOpacity]);

  const handlePressOut = useCallback(() => {
    if (disabled) {
      return;
    }
    animateTo(1, 1);
  }, [animateTo, disabled]);

  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ ...accessibilityState, disabled }}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          { transform: [{ scale }], opacity },
          radiusOverride !== undefined ? { borderRadius: radiusOverride } : null,
          style,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
