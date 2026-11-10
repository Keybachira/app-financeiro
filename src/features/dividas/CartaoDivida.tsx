import { Pressable, StyleSheet, Text, View } from "react-native";

import { formatKz } from "../../domain/money";
import { Painel } from "../../ui/componentes/Painel";
import { BarraProgresso } from "../../ui/componentes/BarraProgresso";
import { ChipEstado } from "../../ui/componentes/ChipEstado";
import { fonts, spacing, useEstilosTema, type Cores } from "../../ui/tema";
import { rotuloEstadoDivida, type useDividas } from "./useDividas";

type DebtViewType = ReturnType<typeof useDividas>["views"][number];

/**
 * Cartão de uma dívida: pessoa, tipo (devo/devem-me), valor em falta, chip de
 * estado e barra de progresso do que já foi pago.
 *
 * O 'accessibilityLabel' é construído à mão porque, sem ele, os leitores de
 * ecrã liam os números soltos sem dizer que o cartão é navegável.
 */
export function CartaoDivida({
  view,
  onPress,
}: {
  view: DebtViewType;
  onPress: () => void;
}) {
  const styles = useEstilosTema(makeStyles);
  const tone =
    view.status === "paid"
      ? "accent"
      : view.status === "overdue"
        ? "warn"
        : "neutral";

  // Sem label, o TalkBack agrupava os textos filhos e lia "botão, J, 1 500 Kz,
  // Pago 0 de 5 000 Kz" — sem dizer o que o botão faz.
  const accessibilityLabel = [
    view.debt.party,
    view.debt.kind === "owe" ? "Devo" : "Devem-me",
    rotuloEstadoDivida(view),
    view.status === "paid"
      ? `Liquidada, pago ${formatKz(view.paid)} de ${formatKz(view.debt.total)}`
      : `Falta ${formatKz(view.remaining)}, pago ${formatKz(view.paid)} de ${formatKz(view.debt.total)}`,
  ].join(". ");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
    >
      <Painel>
        <View style={styles.row}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {view.debt.party.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.info}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>
                {view.debt.party}
              </Text>
              <Text style={styles.kind}>
                {view.debt.kind === "owe" ? "Devo" : "Devem-me"}
              </Text>
            </View>
            <Text style={styles.amount}>{formatKz(view.remaining)}</Text>
          </View>
          <ChipEstado label={rotuloEstadoDivida(view)} tone={tone} />
        </View>

        <View style={styles.progressBlock}>
          <BarraProgresso value={view.progress} tone="gradient" />
          <Text style={styles.meta}>
            Pago {formatKz(view.paid)} de {formatKz(view.debt.total)}
          </Text>
        </View>
      </Painel>
    </Pressable>
  );
}

const makeStyles = (colors: Cores) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.iconTileBg,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      fontFamily: fonts.bold,
      fontSize: 18,
      color: colors.accentSoft,
    },
    info: {
      flex: 1,
      gap: 2,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    title: {
      flexShrink: 1,
      fontFamily: fonts.bold,
      fontSize: 16,
      color: colors.text,
    },
    kind: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
    },
    amount: {
      fontFamily: fonts.medium,
      fontSize: 15,
      color: colors.text,
      fontVariant: ["tabular-nums"],
    },
    progressBlock: {
      marginTop: spacing.md,
      gap: spacing.sm,
    },
    meta: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
    },
  });

/** Estado vazio da lista de dívidas; o cartão inteiro é o botão de criar. */
export function EstadoVazioDividas({ onCreate }: { onCreate: () => void }) {
  const styles = useEstilosTema(makeStyles);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Sem dívidas registadas. Toca para criar a primeira."
      onPress={onCreate}
    >
      <Painel>
        <Text style={styles.meta}>
          Sem dívidas registadas. Toca para criar a primeira.
        </Text>
      </Painel>
    </Pressable>
  );
}
