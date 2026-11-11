import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { formatKzNumber } from "../../domain/money";
import { fonts, useEstilosTema, useTema, type Cores } from "../tema";

// Medidas do recorte (`.notch` / `.add`) — iguais às do protótipo:
// o recorte é 128×56 e o botão 120×50 encosta ao canto inferior direito,
// deixando 8px à esquerda e 6px em cima.
const NOTCH_W = 128;
const NOTCH_H = 56;
const BTN_W = 120;
const BTN_H = 50;
const R = 24; // raio das curvas e do canto superior esquerdo do recorte

type BalanceCardProps = {
  balance: number;
  income: number;
  expenses: number;
  hidden: boolean;
  overlapsSalary?: boolean;
  onToggleHidden: () => void;
  onRegister: () => void;
};

/**
 * Cartão principal do Início (`.main` / `.notch` / `.add`).
 *
 * Saldo disponível em destaque, receitas e despesas lado a lado, e o botão
 * "Registar" encaixado no recorte do canto inferior direito. As duas curvas
 * invertidas do recorte são desenhadas com círculos recortados sobre a cor do
 * fundo (`--bg`), tal como o protótipo faz com `::before` / `::after`.
 */
export function CartaoSaldo({
  balance,
  income,
  expenses,
  hidden,
  overlapsSalary = false,
  onToggleHidden,
  onRegister,
}: BalanceCardProps) {
  const { colors } = useTema();
  const styles = useEstilosTema(makeStyles);
  const amount = (value: number, mask: string) =>
    hidden ? mask : formatKzNumber(value);

  return (
    <View style={[styles.main, overlapsSalary && styles.overlap]}>
      <Text style={styles.label}>Saldo disponível</Text>
      <Pressable
        onPress={onToggleHidden}
        accessibilityRole="button"
        accessibilityLabel="Mostrar ou esconder saldo"
      >
        <Text style={styles.big}>
          {amount(balance, "••••••")}
          <Text style={styles.bigSuffix}> Kz</Text>
        </Text>
      </Pressable>

      <View style={styles.io}>
        <View style={styles.ioBox}>
          <Text style={styles.ioLabel}>Receitas</Text>
          <Text style={styles.ioValue}>{amount(income, "••••")}</Text>
        </View>
        <View style={styles.ioBox}>
          <Text style={styles.ioLabel}>Despesas</Text>
          <Text style={styles.ioValue}>{amount(expenses, "••••")}</Text>
        </View>
      </View>

      {/* recorte do canto inferior direito */}
      <View style={styles.notch} pointerEvents="none" />
      {/* curva do cartão no lado direito, logo acima do recorte */}
      <View
        style={[styles.fillet, { right: 0, bottom: NOTCH_H }]}
        pointerEvents="none"
      >
        <View style={styles.filletDisc} />
      </View>
      {/* curva do cartão na base, logo à esquerda do recorte */}
      <View
        style={[styles.fillet, { right: NOTCH_W, bottom: 0 }]}
        pointerEvents="none"
      >
        <View style={styles.filletDisc} />
      </View>

      <Pressable
        style={styles.add}
        onPress={onRegister}
        accessibilityRole="button"
        accessibilityLabel="Registar despesa"
      >
        <View style={styles.addCircle}>
          <Feather name="plus" size={18} color={colors.addIcon} />
        </View>
        <Text style={styles.addTxt}>Registar</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (colors: Cores) =>
  StyleSheet.create({
    main: {
      backgroundColor: colors.accent,
      borderRadius: R,
      paddingTop: 20,
      paddingHorizontal: 20,
      paddingBottom: 72,
      overflow: "hidden",
    },
    overlap: {
      marginTop: -47,
    },
    label: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.glassText,
      opacity: 0.85,
    },
    big: {
      fontFamily: fonts.medium,
      fontSize: 33,
      lineHeight: 44,
      letterSpacing: -0.6,
      color: colors.glassText,
    },
    bigSuffix: {
      fontFamily: fonts.regular,
      fontSize: 16,
      opacity: 0.8,
    },
    io: {
      flexDirection: "row",
      gap: 10,
      marginTop: 12,
    },
    ioBox: {
      flex: 1,
      backgroundColor: "#ffffff22",
      borderRadius: 16,
      paddingVertical: 9,
      paddingHorizontal: 12,
    },
    ioLabel: {
      fontFamily: fonts.regular,
      fontSize: 11,
      color: colors.glassText,
    },
    ioValue: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: colors.glassText,
      marginTop: 2,
    },
    notch: {
      position: "absolute",
      right: 0,
      bottom: 0,
      width: NOTCH_W,
      height: NOTCH_H,
      backgroundColor: colors.bg,
      borderTopLeftRadius: R,
    },
    fillet: {
      position: "absolute",
      width: R,
      height: R,
      overflow: "hidden",
      backgroundColor: colors.bg,
    },
    filletDisc: {
      position: "absolute",
      left: -R,
      top: -R,
      width: R * 2,
      height: R * 2,
      borderRadius: R,
      backgroundColor: colors.accent,
    },
    add: {
      position: "absolute",
      right: 0,
      bottom: 0,
      width: BTN_W,
      height: BTN_H,
      borderRadius: BTN_H / 2,
      backgroundColor: colors.addBg,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingLeft: 9,
    },
    addCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.addCircle,
      alignItems: "center",
      justifyContent: "center",
    },
    addTxt: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.glassText,
    },
  });
