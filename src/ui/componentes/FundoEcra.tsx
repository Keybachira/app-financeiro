import { StyleSheet, View } from "react-native";

import { useTema } from "../tema";

/**
 * Fundo do ecrã: cor plana da paleta ativa.
 *
 * A referência (`ab-finance.html`) usa `--bg` sólido, sem gradiente nem brilho
 * radial. O antigo fundo com gradiente + `DestaqueRadial` foi removido para não
 * reintroduzir a identidade visual antiga.
 */
export function FundoEcra() {
  const { colors } = useTema();

  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]}
    />
  );
}
