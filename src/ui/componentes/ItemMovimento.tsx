import { StyleSheet, Text, View } from "react-native";

import type { MovementRow as MovementRowData } from "../../repos/movements";
import { addDays, formatDayMonthPt } from "../../domain/dates";
import { iconeCategoria, iconeReceita } from "../iconesCategoria";
import { fonts, radius, useEstilosTema, type Cores } from "../tema";
import { IconeCirculo } from "./IconeCirculo";
import { TextoValor } from "./TextoValor";
import { PressivelEscala } from "./PressivelEscala";

function rotuloDia(date: string, today: string): string {
  if (date === today) {
    return "hoje";
  }

  if (date === addDays(today, -1)) {
    return "ontem";
  }

  return formatDayMonthPt(date);
}

/**
 * Linha de um movimento (ícone, nota/categoria, dia e valor).
 *
 * Receitas aparecem com "+" e cor de destaque. O título cai para a categoria
 * quando não há nota. 'rotuloDia' traduz datas próximas em "hoje"/"ontem" e usa
 * dd/mm para as restantes.
 *
 * Nota: atualmente nenhum ecrã usa este componente (as listas já desenham as
 * suas próprias linhas); mantém-se como referência do formato.
 */
export function ItemMovimento({
  movement,
  today,
  onPress,
}: {
  movement: MovementRowData;
  today: string;
  onPress: () => void;
}) {
  const styles = useEstilosTema(makeStyles);
  const isIncome = movement.type === "income";
  const Icon = isIncome ? iconeReceita() : iconeCategoria(movement.category);
  const title =
    movement.note && movement.note.trim().length > 0
      ? movement.note
      : movement.category;

  return (
    <PressivelEscala
      accessibilityLabel={`${isIncome ? "Receita" : "Despesa"} · ${title}`}
      onPress={onPress}
      pressedScale={0.98}
      radius={radius.panel}
      style={styles.pressable}
    >
      <IconeCirculo icon={Icon} size={40} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.meta}>
          {isIncome ? "Receita" : "Despesa"} · {rotuloDia(movement.date, today)}
        </Text>
      </View>
      <View style={styles.amount}>
        {isIncome ? <Text style={styles.sign}>+</Text> : null}
        <TextoValor
          value={movement.amount}
          size="md"
          tone={isIncome ? "income" : "default"}
        />
      </View>
    </PressivelEscala>
  );
}

const makeStyles = (colors: Cores) =>
  StyleSheet.create({
    pressable: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 10,
      minHeight: 60,
    },
    info: {
      flex: 1,
    },
    title: {
      fontFamily: fonts.medium,
      fontSize: 16,
      color: colors.text,
    },
    meta: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    amount: {
      flexDirection: "row",
      alignItems: "baseline",
    },
    sign: {
      fontFamily: fonts.medium,
      fontSize: 16,
      color: colors.accent,
    },
  });
