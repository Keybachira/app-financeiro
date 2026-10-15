import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

/**
 * Pressable com feedback de toque reutilizável: reduz a escala e a opacidade
 * enquanto premido, com retorno suave. Usa o driver nativo para não bloquear
 * a thread de JS.
 *
 * O estilo é dividido em dois: o posicionamento (position, top, right, margens)
 * fica no Pressable exterior, para a área de toque coincidir com o botão; o
 * aspeto (fundo, sombra, bordas) fica na View animada.
 */

// Estilos que definem ONDE o botão está: ficam só no Pressable exterior.

const OUTER_ONLY = new Set([
  'position',
  'top',
  'bottom',
  'left',
  'right',
  'zIndex',
  'alignSelf',
  'margin',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginHorizontal',
  'marginVertical',
  'marginStart',
  'marginEnd',
]);

// Estilos de flex: ficam nos dois, para o interior preencher o exterior.
const BOTH = new Set(['flex', 'flexGrow', 'flexShrink', 'flexBasis']);

function splitStyle(style: StyleProp<ViewStyle>) {
  const flat = (StyleSheet.flatten(style) ?? {}) as Record<string, unknown>;
  const outer: Record<string, unknown> = {};
  const inner: Record<string, unknown> = {};

  for (const key of Object.keys(flat)) {
    if (OUTER_ONLY.has(key)) {
      outer[key] = flat[key];
    } else if (BOTH.has(key)) {
      outer[key] = flat[key];
      inner[key] = flat[key];
    } else {
      inner[key] = flat[key];
    }
  }

  return { outer: outer as ViewStyle, inner: inner as ViewStyle };
}

export function PressableScale({
  children,
  style,
  pressedScale = 0.92,
  pressedOpacity = 0.75,
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
  const pressedAt = useRef(0);
  const releaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { outer, inner } = useMemo(() => splitStyle(style), [style]);

  const clearReleaseTimer = useCallback(() => {
    if (releaseTimer.current) {
      clearTimeout(releaseTimer.current);
      releaseTimer.current = null;
    }
  }, []);

  useEffect(() => clearReleaseTimer, [clearReleaseTimer]);

  const animateTo = useCallback(
    (toScale: number, toOpacity: number, duration: number) => {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: toScale,
          duration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: toOpacity,
          duration,
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
    clearReleaseTimer();
    pressedAt.current = Date.now();
    animateTo(pressedScale, pressedOpacity, 70);
  }, [animateTo, clearReleaseTimer, disabled, pressedScale, pressedOpacity]);

  const handlePressOut = useCallback(() => {
    if (disabled) {
      return;
    }
    // Garante que o efeito de "premido" se vê pelo menos 90 ms, mesmo num toque rápido.
    
    const wait = Math.max(0, 90 - (Date.now() - pressedAt.current));
    clearReleaseTimer();
    releaseTimer.current = setTimeout(() => animateTo(1, 1, 160), wait);
  }, [animateTo, clearReleaseTimer, disabled]);

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
      style={outer}
    >
      <Animated.View
        style={[
          { transform: [{ scale }], opacity },
          radiusOverride !== undefined ? { borderRadius: radiusOverride } : null,
          inner,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}