import { useFocusEffect, useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";

import { formatKz } from "../../src/domain/money";
import { BotaoFlutuante } from "../../src/ui/componentes/BotaoFlutuante";
import { CartaoDestaque } from "../../src/ui/componentes/CartaoDestaque";
import { Ecra } from "../../src/ui/componentes/Ecra";
import {
  fonts,
  spacing,
  useEstilosTema,
  type Cores,
} from "../../src/ui/tema";
import { useDividas } from "../../src/features/dividas/useDividas";
import { CartaoDivida, EstadoVazioDividas } from "../../src/features/dividas/CartaoDivida";
import { useAcaoProtegida } from "../../src/ui/useAcaoProtegida";

export default function DebtsScreen() {
  const styles = useEstilosTema(makeStyles);
  const router = useRouter();
  const { views, totals, refresh } = useDividas();
  const openNewDebt = useAcaoProtegida(() => router.push("/debt/new"));

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const open = views.filter((view) => view.status !== "paid");
  const paid = views.filter((view) => view.status === "paid");
  const subtitle =
    open.length === 0
      ? "Sem dívidas em aberto"
      : `${open.length} ${open.length === 1 ? "dívida em aberto" : "dívidas em aberto"}`;

  return (
    <Ecra
      title="Dívidas"
      subtitle={subtitle}
      floating={<BotaoFlutuante icon={Plus} label="Nova dívida" onPress={openNewDebt} />}
    >
      <CartaoDestaque>
        <Text style={styles.cardLabel}>Em aberto</Text>
        <View style={styles.totalsRow}>
          <View style={styles.totalBlock}>
            <Text style={styles.totalCaption}>Devo</Text>
            <Text style={styles.totalValue}>{formatKz(totals.owe)}</Text>
          </View>
          <View style={styles.totalBlock}>
            <Text style={styles.totalCaption}>Devem-me</Text>
            <Text style={styles.totalValue}>{formatKz(totals.owed)}</Text>
          </View>
        </View>
      </CartaoDestaque>

      {views.length === 0 ? <EstadoVazioDividas onCreate={openNewDebt} /> : null}

      {open.map((view) => (
        <CartaoDivida
          key={view.debt.id}
          view={view}
          onPress={() => router.push(`/debt/${view.debt.id}`)}
        />
      ))}

      {paid.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Liquidadas ({paid.length})</Text>
          {paid.map((view) => (
            <CartaoDivida
              key={view.debt.id}
              view={view}
              onPress={() => router.push(`/debt/${view.debt.id}`)}
            />
          ))}
        </>
      ) : null}
    </Ecra>
  );
}

const makeStyles = (colors: Cores) =>
  StyleSheet.create({
    cardLabel: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.glassText,
    },
    totalsRow: {
      flexDirection: "row",
      gap: spacing.lg,
      marginTop: spacing.sm,
    },
    totalBlock: {
      flex: 1,
      gap: 2,
    },
    totalCaption: {
      fontFamily: fonts.medium,
      fontSize: 12,
      color: colors.glassText,
      opacity: 0.78,
    },
    totalValue: {
      fontFamily: fonts.bold,
      fontSize: 24,
      color: colors.glassText,
      fontVariant: ["tabular-nums"],
    },
    sectionTitle: {
      marginTop: spacing.sm,
      fontFamily: fonts.bold,
      fontSize: 16,
      color: colors.text,
    },
  });
