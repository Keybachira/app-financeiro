import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet } from "react-native";

import { toqueLigeiro } from "../haptica";
import { curva, duracao, useMovimentoReduzido } from "../movimento";
import { radius, useEstilosTema, type Cores } from "../tema";

const KNOB_TRAVEL = 18;

/**
 * Interruptor on/off próprio (não é o `Switch` do React Native).
 *
 * Métricas da referência (`.sw`): 44×26, botão branco de 20 que desliza 18 px.
 * Só se anima `transform`, por isso `useNativeDriver` é seguro.
 */
export function Interruptor({
  value,
  onValueChange,
  label,
  disabled = false,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  const styles = useEstilosTema(makeStyles);
  const reduzido = useMovimentoReduzido();
  const travel = useRef(new Animated.Value(value ? KNOB_TRAVEL : 0)).current;

  useEffect(() => {
    if (reduzido) {
      travel.setValue(value ? KNOB_TRAVEL : 0);
      return;
    }

    const animacao = Animated.timing(travel, {
      toValue: value ? KNOB_TRAVEL : 0,
      duration: duracao.interruptor,
      easing: curva.padrao,
      useNativeDriver: true,
    });
    animacao.start();
    return () => animacao.stop();
  }, [travel, value, reduzido]);

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => {
        toqueLigeiro();
        onValueChange(!value);
      }}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      android_ripple={{ color: "rgba(127,127,127,.25)" }}
      style={[
        styles.track,
        value && styles.trackOn,
        disabled && styles.disabled,
      ]}
    >
      <Animated.View
        style={[styles.knob, { transform: [{ translateX: travel }] }]}
      />
    </Pressable>
  );
}

const makeStyles = (colors: Cores) =>
  StyleSheet.create({
    track: {
      width: 44,
      height: 26,
      borderRadius: radius.pill,
      backgroundColor: colors.track,
      paddingHorizontal: 3,
      justifyContent: "center",
      flexShrink: 0,
    },
    trackOn: {
      backgroundColor: colors.accent,
    },
    knob: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: "#FFFFFF",
    },
    disabled: {
      opacity: 0.45,
    },
  });
