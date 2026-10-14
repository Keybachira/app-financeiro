import { useFocusEffect, useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatKz } from '../../src/domain/money';
import { Fab } from '../../src/ui/components/Fab';
import { Panel } from '../../src/ui/components/Panel';
import { MoneyText } from '../../src/ui/components/MoneyText';
import { Screen } from '../../src/ui/components/Screen';
import { SegmentedControl } from '../../src/ui/components/SegmentedControl';
import { colors, fonts } from '../../src/ui/theme';
import { DebtCard, DebtEmptyState } from '../../src/features/debts/DebtCard';
import { useDebts } from '../../src/features/debts/useDebts';

type Filter = 'all' | 'owe' | 'owed';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'owe', label: 'Devo' },
  { value: 'owed', label: 'Devem-me' },
];

export default function DebtsScreen() {
  const router = useRouter();
  const { views, totals, refresh } = useDebts();
  const [filter, setFilter] = useState<Filter>('all');

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const visible = views.filter((view) => {
    if (filter === 'all') {
      return true;
    }
    return view.debt.kind === filter;
  });

  const open = visible.filter((view) => view.status !== 'paid');
  const settled = visible.filter((view) => view.status === 'paid');

  return (
    <Screen title="Dívidas" floating={<Fab icon={Plus} label="Nova dívida" onPress={() => router.push('/debt/new')} />}>
      <View style={styles.totalsRow}>
        <Panel style={styles.totalCard}>
          <Text style={styles.totalLabel}>Devo</Text>
          <MoneyText value={totals.owe} size="lg" />
        </Panel>
        <Panel style={[styles.totalCard, styles.totalCardAccent]}>
          <Text style={styles.totalLabelAccent}>Devem-me</Text>
          <MoneyText value={totals.owed} size="lg" tone="income" />
        </Panel>
      </View>

      <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} />

      {open.map((view) => (
        <DebtCard key={view.debt.id} view={view} onPress={() => router.push(`/debt/${view.debt.id}`)} />
      ))}

      {open.length === 0 && settled.length === 0 ? (
        <DebtEmptyState onCreate={() => router.push('/debt/new')} />
      ) : null}

      {settled.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Liquidadas ({settled.length})</Text>
          {settled.map((view) => (
            <DebtCard key={view.debt.id} view={view} onPress={() => router.push(`/debt/${view.debt.id}`)} />
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  totalsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  totalCard: {
    flex: 1,
    padding: 14,
    gap: 2,
  },
  totalCardAccent: {
    backgroundColor: 'rgba(60,116,245,.24)',
  },
  totalLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  totalLabelAccent: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.chipAccentText,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
});
