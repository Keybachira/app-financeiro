import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Download, Plus, Receipt, Wallet } from 'lucide-react-native';

import { monthDaysOf, monthNamePt, todayISO } from '../../src/domain/dates';
import { formatShortPt } from '../../src/domain/dates';
import { formatKz } from '../../src/domain/money';
import { GlassCard } from '../../src/ui/components/GlassCard';
import { Panel } from '../../src/ui/components/Panel';
import { MoneyText } from '../../src/ui/components/MoneyText';
import { ProgressBar } from '../../src/ui/components/ProgressBar';
import { DailyBarChart } from '../../src/ui/components/DailyBarChart';
import { CategoryRow } from '../../src/ui/components/CategoryRow';
import { MovementRow } from '../../src/ui/components/MovementRow';
import { SearchInput } from '../../src/ui/components/SearchInput';
import { Fab } from '../../src/ui/components/Fab';
import { IconButton } from '../../src/ui/components/IconButton';
import { Screen } from '../../src/ui/components/Screen';
import { colors, fonts, radius, spacing } from '../../src/ui/theme';
import { useMonthSummary } from '../../src/features/movements/useMonthSummary';
import { useMonthMovements } from '../../src/features/movements/useMovements';
import { useBillsSummary } from '../../src/features/bills/useBills';
import { QuickAction } from '../../src/ui/components/QuickAction';

export default function HomeScreen() {
  const today = todayISO();
  const router = useRouter();
  const { summary, refresh } = useMonthSummary(today);
  const [search, setSearch] = useState('');
  const { movements, refresh: refreshList } = useMonthMovements(summary.month, search);
  const { openCount: billsDue, refresh: refreshBills } = useBillsSummary();

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshList();
      refreshBills();
    }, [refresh, refreshList, refreshBills])
  );

  const searching = search.trim().length > 0;
  const visible = searching ? movements : movements.slice(0, 6);
  const monthDays = monthDaysOf(today);

  return (
    <Screen
      title={monthNamePt(`${summary.month}-01`)}
      right={
        <View style={styles.headerActions}>
          <IconButton icon={Download} label="Backup e exportar" onPress={() => router.push('/backup')} />
        </View>
      }
      floating={<Fab icon={Plus} label="Novo movimento" onPress={() => router.push('/movement/new')} />}
    >
      <GlassCard>
        <Text style={styles.cardLabel}>Saldo do mês</Text>
        <MoneyText value={summary.balance} size="balance" />
        <View style={styles.cardChip}>
          <Text style={styles.cardChipText}>Reservado em metas · {formatKz(summary.reserved)}</Text>
        </View>

        {summary.limit !== null ? (
          <View style={styles.limitBlock}>
            <View style={styles.limitRow}>
              <Text style={styles.limitLabel}>Limite · {Math.round(summary.limitPercent * 100)}%</Text>
              <Text style={styles.limitValue}>
                {formatKz(summary.expenses)} / {formatKz(summary.limit)}
              </Text>
            </View>
            <ProgressBar value={summary.limitPercent} tone="white" />
          </View>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => router.push('/settings')} style={styles.setLimit}>
            <Plus color={colors.glassText} size={16} strokeWidth={2} />
            <Text style={styles.setLimitText}>Definir limite mensal</Text>
          </Pressable>
        )}
      </GlassCard>

      <View style={styles.panels}>
        <Panel style={styles.panelHalf}>
          <Text style={styles.panelLabel}>Podes gastar</Text>
          <MoneyText
            value={Number.isFinite(summary.spendable.amount) ? summary.spendable.amount : 0}
            size="lg"
          />
          <Text style={[styles.panelMeta, summary.spendable.overLimit && styles.panelMetaWarn]}>
            {summary.spendable.overLimit ? 'Já passaste o limite' : `por dia · ${summary.daysToSalary} dias`}
          </Text>
        </Panel>

        <Pressable accessibilityRole="button" onPress={() => router.push('/salary')}>
          <Panel style={styles.panelHalf}>
            <Text style={styles.panelLabel}>Próximo salário ›</Text>
            <Text style={styles.panelValue}>
              {summary.nextSalary ? formatShortPt(summary.nextSalary) : '—'}
            </Text>
            <Text style={styles.panelMeta}>
              {summary.nextSalary ? `faltam ${summary.daysToSalary} dias` : 'por configurar'}
            </Text>
          </Panel>
        </Pressable>
      </View>

      <View style={styles.quickRow}>
        <QuickAction
          icon={Receipt}
          label="Contas fixas"
          badge={billsDue}
          onPress={() => router.push('/bill')}
        />
        <QuickAction icon={Wallet} label="Salário" onPress={() => router.push('/salary')} />
        <QuickAction icon={Download} label="Backup" onPress={() => router.push('/backup')} />
      </View>

      <Panel>
        <DailyBarChart
          month={summary.month}
          data={summary.daily}
          daysInMonth={monthDays}
          dailyLimit={summary.dailyLimit}
        />
      </Panel>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categorias</Text>
        {summary.categories.length > 0 ? (
          summary.categories.map((row) => (
            <CategoryRow key={row.category} category={row.category} amount={row.amount} share={row.share} />
          ))
        ) : (
          <Text style={styles.empty}>Sem despesas registadas este mês.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Movimentos</Text>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Procurar por nota ou categoria"
        />
        <View style={styles.list}>
          {visible.map((movement) => (
            <MovementRow
              key={movement.id}
              movement={movement}
              today={today}
              onPress={() => router.push(`/movement/${movement.id}`)}
            />
          ))}
          {visible.length === 0 ? (
            <Text style={styles.empty}>{searching ? 'Sem resultados para a pesquisa.' : 'Sem movimentos este mês.'}</Text>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  cardLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.glassText,
  },
  cardChip: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    backgroundColor: colors.chipOnGlass,
    borderRadius: radius.control,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  cardChipText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text,
  },
  limitBlock: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  limitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  limitLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.glassText,
  },
  limitValue: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.glassText,
    fontVariant: ['tabular-nums'],
  },
  setLimit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.lg,
    minHeight: 44,
  },
  setLimitText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.glassText,
  },
  panels: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  panelHalf: {
    flex: 1,
    padding: 14,
    gap: 2,
  },
  panelLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  panelMeta: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  panelValue: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.text,
  },
  panelMetaWarn: {
    color: colors.warn,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  list: {
    marginTop: spacing.xs,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    paddingVertical: spacing.sm,
  },
});
