import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { curva, duracao, useMovimentoReduzido } from "../movimento";
import { radius, spacing, useEstilosTema, type Cores } from "../tema";

/**
 * Folha inferior animada (`.ov` + `.sh` da referência).
 *
 * O conteúdo sobe do fundo do ecrã enquanto o fundo escurece; ao fechar faz o
 * percurso inverso e só depois é que o `Modal` é desmontado. A altura do ecrã é
 * usada como ponto de partida para a folha começar totalmente fora de vista,
 * sem precisar de medir o conteúdo.
 *
 * O `Pressable` do fundo fica marcado com `accessible={false}` — sem isso o
 * leitor de ecrã anunciava "Cancelar" antes do título real da folha.
 */
export function FolhaInferior({
  visible,
  onRequestClose,
  children,
}: {
  visible: boolean;
  onRequestClose: () => void;
  children?: ReactNode;
}) {
  const styles = useEstilosTema(makeStyles);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reduzido = useMovimentoReduzido();
  const [montada, setMontada] = useState(visible);
  const progresso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) setMontada(true);
  }, [visible]);

  useEffect(() => {
    if (!montada) return;

    if (reduzido) {
      progresso.setValue(visible ? 1 : 0);
      if (!visible) setMontada(false);
      return;
    }

    const animacao = Animated.timing(progresso, {
      toValue: visible ? 1 : 0,
      duration: visible ? duracao.folha : duracao.folhaSaida,
      easing: curva.padrao,
      useNativeDriver: true,
    });
    animacao.start(({ finished }) => {
      if (finished && !visible) setMontada(false);
    });

    return () => animacao.stop();
  }, [montada, progresso, reduzido, visible]);

  return (
    <Modal
      visible={montada}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onRequestClose}
    >
      <View style={styles.container}>
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: progresso }]}
        >
          <Pressable
            accessible={false}
            style={StyleSheet.absoluteFill}
            onPress={onRequestClose}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: spacing.xl + insets.bottom,
              transform: [
                {
                  translateY: progresso.interpolate({
                    inputRange: [0, 1],
                    outputRange: [height, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.handle} />
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: Cores) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      backgroundColor: colors.backdrop,
    },
    sheet: {
      backgroundColor: colors.bgMid,
      borderTopLeftRadius: radius.panel,
      borderTopRightRadius: radius.panel,
      paddingTop: 10,
      paddingHorizontal: 22,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 4,
      backgroundColor: colors.hairline,
      alignSelf: "center",
      marginBottom: 14,
    },
  });
