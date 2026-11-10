import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { toqueLigeiro } from "../haptica";
import { fonts, radius, useEstilosTema, type Cores } from "../tema";

export type OpcaoSegmentada<T extends string> = {
  value: T;
  label: string;
};

const TRACK_HEIGHT = 44;
const TRACK_PAD = 4;
const ITEM_RADIUS = radius.control - TRACK_PAD;

/**
 * Segmentado com "polegar" deslizante: o indicador animado move-se para o item
 * selecionado em vez de cada item ter a sua própria cor de fundo. Resolve os
 * dois problemas da versão anterior — o bloco ativo com cor sólida que pesava
 * mais do que o track, e a troca instantânea sem qualquer sinal de movimento.
 */
export function ControloSegmentado<T extends string>({
  options,
  value,
  onChange,
}: {
  options: OpcaoSegmentada<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const styles = useEstilosTema(makeStyles);
  const [trackWidth, setTrackWidth] = useState(0);
  const thumb = useRef(new Animated.Value(index)).current;

  const itemWidth =
    trackWidth > 0 ? (trackWidth - TRACK_PAD * 2) / options.length : 0;

  useEffect(() => {
    Animated.timing(thumb, {
      toValue: index,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      // Só mexe em `transform`, logo o driver nativo é seguro.
      useNativeDriver: true,
    }).start();
  }, [index, thumb]);

  const translateX = thumb.interpolate({
    inputRange: options.map((_, i) => i),
    outputRange: options.map((_, i) => i * itemWidth),
  });

  return (
    <View
      accessibilityRole="tablist"
      style={styles.track}
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
    >
      {itemWidth > 0 ? (
        <Animated.View
          style={[
            styles.thumb,
            { width: itemWidth, transform: [{ translateX }] },
          ]}
        />
      ) : null}

      {options.map((option) => {
        const active = option.value === value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (!active) {
                toqueLigeiro();
              }

              onChange(option.value);
            }}
            hitSlop={4}
            style={styles.item}
          >
            <Text
              style={[styles.label, active && styles.labelActive]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (colors: Cores) =>
  StyleSheet.create({
    track: {
      flexDirection: "row",
      backgroundColor: colors.inputBg,
      borderRadius: radius.control,
      borderWidth: 1,
      borderColor: colors.hairline,
      height: TRACK_HEIGHT,
      padding: TRACK_PAD,
    },
    thumb: {
      position: "absolute",
      left: TRACK_PAD,
      top: TRACK_PAD,
      bottom: TRACK_PAD,
      borderRadius: ITEM_RADIUS,
      backgroundColor: colors.chipAccentBg,
      borderWidth: 1,
      borderColor: colors.chipAccentText,
    },
    item: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    label: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: colors.textMuted,
    },
    labelActive: {
      fontFamily: fonts.bold,
      color: colors.text,
    },
  });
