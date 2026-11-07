import type { ReactNode } from "react";
import { AccessibilityInfo, Animated, ScrollView, StyleSheet, View } from "react-native";
import { useEffect, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { spacing, useThemedStyles, type Colors } from "../theme";
import { ModalHeader } from "./ModalHeader";
import { ScreenBackground } from "./ScreenBackground";
import { ScreenHeader } from "./ScreenHeader";

export function Screen({
  title,
  subtitle,
  right,
  floating,
  header,
  back = false,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  floating?: ReactNode;
  header?: ReactNode;
  /**
   * Ecrãs abertos como modal precisam de voltar visível: o cabeçalho nativo do
   * `Stack` está desligado (`headerShown: false`), portanto sem isto só o gesto
   * de sistema tirava o utilizador do ecrã.
   */
  back?: boolean;
  children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const entrance = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { mounted = false; subscription.remove(); };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      entrance.setValue(1);
      return;
    }
    entrance.setValue(0);
    Animated.timing(entrance, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [entrance, reduceMotion, title]);

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.sm },
        ]}
        showsVerticalScrollIndicator={false}
        // Sem isto, o primeiro toque numa linha com o teclado aberto era
        // consumido para o fechar e a linha não navegava. Os ecrãs de formulário
        // já usavam "handled"; este é o `ScrollView` da Home e listas.
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {header ? header : back ? (
          <ModalHeader title={title} subtitle={subtitle} right={right} />
        ) : (
          <ScreenHeader title={title} right={right} />
        )}
        <Animated.View style={{ opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>{children}</Animated.View>
      </ScrollView>
      {floating}
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: 140,
      gap: spacing.md,
    },
  });
