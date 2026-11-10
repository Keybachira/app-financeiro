import { StyleSheet, Text, View } from "react-native";

import { TextoValor } from "./TextoValor";
import { IconeCirculo } from "./IconeCirculo";
import { BarraProgresso } from "./BarraProgresso";
import { iconeCategoria } from "../iconesCategoria";
import { fonts, useEstilosTema, type Cores } from "../tema";

/**
 * Linha de estatística: ícone da categoria, nome, valor e barra de proporção.
 *
 * 'share' já vem normalizado (0..1) de quem calcula os totais, por isso a linha
 * só desenha — não faz contas nem consulta a base de dados.
 */
export function LinhaCategoria({
  category,
  amount,
  share,
}: {
  category: string;
  amount: number;
  share: number;
}) {
  const styles = useEstilosTema(makeStyles);

  return (
    <View style={styles.row}>
      <IconeCirculo icon={iconeCategoria(category)} size={40} />
      <View style={styles.info}>
        <View style={styles.top}>
          <Text style={styles.name}>{category}</Text>
          <TextoValor value={amount} size="md" />
        </View>
        <BarraProgresso value={share} tone="gradient" height={6} />
      </View>
    </View>
  );
}

const makeStyles = (colors: Cores) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    info: {
      flex: 1,
      gap: 8,
    },
    top: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    name: {
      fontFamily: fonts.medium,
      fontSize: 16,
      color: colors.text,
    },
  });
