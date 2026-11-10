import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Animated, type StyleProp, type ViewStyle } from "react-native";

import {
  curva,
  deslocamento,
  duracao,
  useMovimentoReduzido,
} from "../movimento";

type Variante = "vista" | "linha" | "revelacao";

/**
 * Entradas animadas da referência.
 *
 * - `vista`: ecrã inteiro, `translateX(14px)` + fade (`in`).
 * - `linha`: linha de lista, `translateY(10px)` + fade (`nin`).
 * - `revelacao`: item revelado por etapas, `translateY(16px)` + fade (`rv`),
 *   com atraso crescente conforme o `indice`.
 *
 * Com o movimento reduzido ligado no sistema, o conteúdo aparece já no estado
 * final — o mesmo efeito do `prefers-reduced-motion` do protótipo.
 */
export function EntradaAnimada({
  children,
  variante = "vista",
  indice = 0,
  gatilho,
  style,
}: {
  children?: ReactNode;
  variante?: Variante;
  /** Posição na lista, usada para escalonar a `revelacao`. */
  indice?: number;
  /** Quando muda, a animação recomeça (ex.: o título do ecrã). */
  gatilho?: string | number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduzido = useMovimentoReduzido();
  const progresso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduzido) {
      progresso.setValue(1);
      return;
    }

    const preset = PRESETS[variante];
    progresso.setValue(0);
    const animacao = Animated.timing(progresso, {
      toValue: 1,
      duration: preset.duracao,
      delay:
        preset.atraso +
        (variante === "revelacao" ? indice * duracao.escalonamento : 0),
      easing: curva.padrao,
      useNativeDriver: true,
    });
    animacao.start();

    return () => animacao.stop();
  }, [indice, progresso, reduzido, variante, gatilho]);

  const preset = PRESETS[variante];
  const deslocamentoAnimado = progresso.interpolate({
    inputRange: [0, 1],
    outputRange: [preset.distancia, 0],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progresso,
          transform: [
            preset.eixo === "x"
              ? { translateX: deslocamentoAnimado }
              : { translateY: deslocamentoAnimado },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const PRESETS = {
  vista: {
    eixo: "x",
    distancia: deslocamento.vista,
    duracao: duracao.vista,
    atraso: 0,
  },
  linha: {
    eixo: "y",
    distancia: deslocamento.linha,
    duracao: duracao.linha,
    atraso: 0,
  },
  revelacao: {
    eixo: "y",
    distancia: deslocamento.revelacao,
    duracao: duracao.revelacao,
    atraso: duracao.atrasoLista,
  },
} as const;
