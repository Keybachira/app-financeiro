import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Animated, type StyleProp, type ViewStyle } from "react-native";

import { curva, duracao, useMovimentoReduzido } from "../movimento";

/**
 * Pulsação contínua usada no indicador de notificações (`.bdg` / `bdgp`):
 * escala 1 → 1.14 → 1 num ciclo de 2.4 s.
 *
 * O ciclo só corre quando `activo`; caso contrário o conteúdo fica em repouso,
 * para não gastar bateria com um selo que ninguém vê.
 */
export function Pulso({
  children,
  activo = true,
  style,
}: {
  children?: ReactNode;
  activo?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const reduzido = useMovimentoReduzido();
  const escala = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!activo || reduzido) {
      escala.setValue(1);
      return;
    }

    escala.setValue(1);
    const animacao = Animated.loop(
      Animated.sequence([
        Animated.timing(escala, {
          toValue: 1.14,
          duration: duracao.pulso / 2,
          easing: curva.padrao,
          useNativeDriver: true,
        }),
        Animated.timing(escala, {
          toValue: 1,
          duration: duracao.pulso / 2,
          easing: curva.padrao,
          useNativeDriver: true,
        }),
      ]),
    );
    animacao.start();

    return () => animacao.stop();
  }, [activo, escala, reduzido]);

  return (
    <Animated.View style={[style, { transform: [{ scale: escala }] }]}>
      {children}
    </Animated.View>
  );
}
