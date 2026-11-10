import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { FONT, kz, useTemaBase, type Theme } from "../../../data";

// [2026-11-10] Medidas partilhadas entre botão e recorte (ajusta aqui e tudo acompanha)
const BTN_W = 120;
const BTN_H = 50;
const GAP = 8; // espaço entre o botão e a borda do recorte
const R = 24; // raio das curvas (igual ao dos fillets)
const NOTCH_W = BTN_W + GAP * 2;
const NOTCH_H = BTN_H + GAP * 2;

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
 * Cartão principal do Início: saldo disponível, receitas, despesas e o botão
 * "Registar" encaixado num recorte do canto inferior direito.
 *
 * Usa o tema legado de 'data.ts' (não o de 'src/ui/tema.ts') porque o ecrã do
 * Início ainda vive nesse sistema. Os quatro cantos em "fillet" são desenhados
 * com círculos recortados sobre a cor do fundo — a alternativa seriam imagens.
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
  const { t } = useTemaBase();
  const styles = makeStyles(t);
  const amount = (value: number, mask: string) => (hidden ? mask : kz(value));

  return (
    <View style={[styles.main, overlapsSalary && { marginTop: -47 }]}>
      <Text style={styles.mainL}>Saldo disponível</Text>
      <Pressable
        onPress={onToggleHidden}
        accessibilityLabel="Mostrar ou esconder saldo"
      >
        <Text style={styles.big}>{amount(balance, "••••••")}</Text>
      </Pressable>
      <View style={styles.io}>
        <View style={styles.ioBox}>
          <Text style={styles.ioL}>Receitas</Text>
          <Text style={styles.ioB}>{amount(income, "••••")}</Text>
        </View>
        <View style={styles.ioBox}>
          <Text style={styles.ioL}>Despesas</Text>
          <Text style={styles.ioB}>{amount(expenses, "••••")}</Text>
        </View>
      </View>
      <View
        style={[styles.fillet, { left: -24, bottom: 0 }]}
        pointerEvents="none"
      >
        <View style={styles.filletDisc} />
      </View>
      <View
        style={[styles.fillet, { right: 0, top: -24 }]}
        pointerEvents="none"
      >
        <View style={styles.filletDisc} />
      </View>

      {/* [2026-11-10] Recorte no canto inferior direito (cor do fundo, ponta superior esquerda arredondada) */}
      <View style={styles.notch} pointerEvents="none" />
      {/* [2026-11-10] Curva do cartão no lado direito, logo acima do recorte */}
      <View
        style={[styles.fillet, { right: 0, bottom: NOTCH_H }]}
        pointerEvents="none"
      >
        <View style={styles.filletDisc} />
      </View>
      {/* [2026-11-10] Curva do cartão na base, logo à esquerda do recorte */}
      <View
        style={[styles.fillet, { right: NOTCH_W, bottom: 0 }]}
        pointerEvents="none"
      >
        <View style={styles.filletDisc} />
      </View>

      <Pressable
        style={styles.add}
        onPress={onRegister}
        accessibilityLabel="Registar despesa"
      >
        <View style={styles.addPlus}>
          <Feather name="plus" size={20} color={t.addp} />
        </View>
        <Text style={styles.addTxt}>Registar</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    main: {
      backgroundColor: t.acc,
      borderRadius: 24,
      paddingTop: 20,
      paddingHorizontal: 20,
      // [2026-11-10] antes: paddingBottom: 72,
      // Agora garante espaço para o recorte + curva acima dele sem tocar nas caixas
      paddingBottom: NOTCH_H + R + 4,
      overflow: "hidden",
    },
    mainL: { fontSize: 12, fontFamily: FONT.reg, color: "#fff", opacity: 0.85 },
    big: {
      fontSize: 33,
      fontFamily: FONT.med,
      color: "#fff",
      lineHeight: 44,
      letterSpacing: -0.6,
    },
    io: { flexDirection: "row", gap: 8, marginTop: 12 },
    ioBox: {
      flex: 1,
      backgroundColor: "#ffffff22",
      borderRadius: 16,
      paddingVertical: 9,
      paddingHorizontal: 10,
    },
    ioL: { fontSize: 11, fontFamily: FONT.reg, color: "#fff", opacity: 0.8 },
    ioB: { fontSize: 15, fontFamily: FONT.med, color: "#fff", marginTop: 3 },
    fillet: {
      position: "absolute",
      width: 24,
      height: 24,
      overflow: "hidden",
      backgroundColor: t.bg,
    },
    filletDisc: {
      position: "absolute",
      left: -24,
      top: -24,
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: t.acc,
    },
    // [2026-11-10] novo: bloco do recorte
    notch: {
      position: "absolute",
      right: 0,
      bottom: 0,
      width: NOTCH_W,
      height: NOTCH_H,
      backgroundColor: t.bg,
      borderTopLeftRadius: R,
    },
    add: {
      position: "absolute",
      // [2026-11-10] antes: right: 0, bottom: 0, width: 120, height: 50,
      right: GAP,
      bottom: GAP,
      width: BTN_W,
      height: BTN_H,
      borderRadius: 25,
      backgroundColor: t.add,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingLeft: 9,
    },
    addPlus: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: t.addc,
      alignItems: "center",
      justifyContent: "center",
    },
    addTxt: { fontSize: 13, fontFamily: FONT.med, color: "#fff" },
  });
}
