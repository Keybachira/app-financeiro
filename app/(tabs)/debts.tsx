import { useFocusEffect, useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";

import { formatKz } from "../../src/domain/money";
import { Fab } from "../../src/ui/components/Fab";
import { GlassCard } from "../../src/ui/components/GlassCard";
import { Screen } from "../../src/ui/components/Screen";
import {
  fonts,
  spacing,
  useThemedStyles,
  type Colors,
} from "../../src/ui/theme";
import { useDebts } from "../../src/features/debts/useDebts";
import { DebtCard, DebtEmptyState } from "../../src/features/debts/DebtCard";
import { useGuardedAction } from "../../src/ui/useGuardedAction";

export default function DebtsScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { views, totals, refresh } = useDebts();
  const openNewDebt = useGuardedAction(() => router.push("/debt/new"));

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
    <Screen
      title="Dívidas"
      subtitle={subtitle}
      floating={<Fab icon={Plus} label="Nova dívida" onPress={openNewDebt} />}
    >
      <GlassCard>
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
      </GlassCard>

      {views.length === 0 ? <DebtEmptyState onCreate={openNewDebt} /> : null}

      {open.map((view) => (
        <DebtCard
          key={view.debt.id}
          view={view}
          onPress={() => router.push(`/debt/${view.debt.id}`)}
        />
      ))}

      {paid.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Liquidadas ({paid.length})</Text>
          {paid.map((view) => (
            <DebtCard
              key={view.debt.id}
              view={view}
              onPress={() => router.push(`/debt/${view.debt.id}`)}
            />
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const makeStyles = (colors: Colors) =>
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
