import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import React from "react";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { radius, spacing, useEstilosTema, useTema, type Cores } from "../tema";

type Props = {
  /** Texto principal do aviso. */
  children: React.ReactNode;
  /** Quando true, o aviso desliza para cima e fica visível. */
  visível?: boolean;
  /** Ação ao tocar no aviso. */
  onPress?: () => void;
};

/**
 * Aviso push (`.npush` do protótipo `ab-finance.html`).
 *
 * Overlay absoluto no topo do ecrã, com entrada animada (desliza de baixo
 * para cima e ganha opacidade). Inicialmente oculto; exibe-se quando `visível`
 * é true. Não altera a lógica de negócio — é puramente visual.
 */
export function AvisoPush({
  children,
  visível = false,
  onPress,
}: Props) {
  const { colors } = useTema();
  const ins = useSafeAreaInsets();
  const styles = useEstilosTema(makeStyles);
  const anim = React.useRef(new Animated.Value(visível ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: visível ? 1 : 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [anim, visível]);

  const opacidade = anim;
  const translacaoY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-40, 0],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { top: 14 + ins.top, opacity: opacidade, transform: [{ translateY: translacaoY }] },
      ]}
    >
      <Pressable
        style={styles.card}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Aviso"
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

function makeStyles(colors: Cores) {
  return StyleSheet.create({
    container: {
      position: "absolute",
      left: spacing.xs,
      right: spacing.xs,
      alignItems: "flex-start",
      zIndex: 60,
      pointerEvents: "box-none",
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      backgroundColor: colors.panelFrom ?? colors.bg,
      paddingVertical: 13,
      paddingHorizontal: 14,
      borderRadius: radius.panel,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.08,
      shadowRadius: 38,
      elevation: 8,
      borderWidth: 1,
      borderColor: colors.hairline,
      minHeight: 56,
    },
  });
}
