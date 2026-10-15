import { useFocusEffect, useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { formatDayMonthPt, monthShort } from '../../src/domain/dates';
import { formatKz } from '../../src/domain/money';
import { Fab } from '../../src/ui/components/Fab';
import { GlassCard } from '../../src/ui/components/GlassCard';
import { MoneyText } from '../../src/ui/components/MoneyText';
import { Panel } from '../../src/ui/components/Panel';
import { ProgressBar } from '../../src/ui/components/ProgressBar';
import { Screen } from '../../src/ui/components/Screen';
import { StatusChip } from '../../src/ui/components/StatusChip';
import { useToast } from '../../src/ui/components/Toast';
import { gradients, radius } from '../../src/ui/theme';
import { colors, fonts, spacing } from '../../src/ui/theme';
import { categoryIcon } from '../../src/ui/categoryIcons';
import { useBills } from '../../src/features/bills/useBills';
import type { BillView } from '../../src/repos/bills';

export default function BillsScreen() {
  const router = useRouter();
  const toast = useToast();
  const { open, payable, unpaidTotal, progress, pay, refresh, today } = useBills();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const percent = progress.total > 0 ? Math.round((progress.paid / progress.total) * 100) : 0;

  return (
    <Screen
      title="Contas fixas"
      back
      subtitle={`${open.length} ${open.length === 1 ? 'conta ativa' : 'contas ativas'}`}
      floating={<Fab icon={Plus} label="Nova conta" onPress={() => router.push('/bill/new')} />}
    >
      <GlassCard>
        <Text style={styles.cardLabel}>Por pagar este mês</Text>
        <MoneyText value={unpaidTotal} size="balance" />
        <View style={styles.progressMeta}>
          <Text style={styles.cardLabel}>Pago · {percent}%</Text>
          <Text style={styles.cardLabel}>
            {formatKz(progress.paid)} / {formatKz(progress.total)}
          </Text>
        </View>
        <ProgressBar value={progress.total > 0 ? progress.paid / progress.total : 0} tone="white" />
      </GlassCard>

      {payable.length === 0 ? (
        <Panel>
          <Text style={styles.empty}>Sem contas por pagar este mês. Bom trabalho.</Text>
        </Panel>
      ) : null}

      {payable.map((view) => (
        <BillRowCard
          key={view.bill.id}
          view={view}
          today={today}
          onPay={() => {
            try {
              pay(view.bill.id);
              toast({ message: `${view.bill.name} paga`, tone: 'success' });
            } catch (caught) {
              // Sem isto, um "Pagar" falhado não dava nenhum sinal: tocava-se e
              // nada acontecia, sem toast nem erro.
              toast({
                message: caught instanceof Error ? caught.message : 'Não foi possível pagar a conta.',
                tone: 'error',
              });
            }
          }}
          onEdit={() => router.push({ pathname: '/bill/new', params: { id: view.bill.id } })}
        />
      ))}
    </Screen>
  );
}

function billAccessibilityLabel(view: BillView, today: string): string {
  const base = `${view.bill.name}, ${formatKz(view.bill.amount)}, dia ${view.bill.day_of_month}`;

  if (view.paidThisMonth) {
    return `${base}, paga em ${monthShort(today)}. Toca para editar.`;
  }

  return `${base}, por pagar. Toca para editar.`;
}

function BillRowCard({
  view,
  today,
  onPay,
  onEdit,
}: {
  view: BillView;
  today: string;
  onPay: () => void;
  onEdit: () => void;
}) {
  const Icon = categoryIcon(view.bill.category);
  const chip =
    view.status === 'paid'
      ? { tone: 'accent' as const, label: 'Paga' }
      : view.status === 'late'
        ? { tone: 'warn' as const, label: `Atrasada · ${formatDayMonthPt(view.dueDate ?? today)}` }
        : view.status === 'today'
          ? { tone: 'warn' as const, label: 'Vence hoje' }
          : view.status === 'soon'
            ? { tone: 'neutral' as const, label: `${view.daysToDue} dias` }
            : { tone: 'neutral' as const, label: `${view.daysToDue} dias` };

  // Wrapper é botão (editar) e contém outro botão (pagar) aninhado. O label vai
  // para o interno para o leitor não anunciar os dois em cima um do outro.
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={billAccessibilityLabel(view, today)} onPress={onEdit}>
      <Panel>
        <View style={styles.row}>
          <View style={styles.iconTile}>
            <Icon color={colors.accent} size={22} strokeWidth={2} />
          </View>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {view.bill.name}
            </Text>
            <Text style={styles.meta}>
              dia {view.bill.day_of_month} · {view.bill.category}
              {view.paidOn ? ` · paga a ${formatDayMonthPt(view.paidOn)}` : ''}
            </Text>
          </View>
          <View style={styles.amountBlock}>
            <MoneyText value={view.bill.amount} size="md" />
            <View style={styles.chip}>
              <StatusChip label={chip.label} tone={chip.tone} />
            </View>
          </View>
        </View>

        {view.paidThisMonth ? (
          <Text style={styles.paidLabel}>Paga em {monthShort(today)}</Text>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Pagar ${view.bill.name}, ${formatKz(view.bill.amount)}`}
            onPress={onPay}
            style={({ pressed }) => [styles.payWrap, pressed && styles.payWrapPressed]}
          >
            <LinearGradient
              colors={gradients.primary.colors}
              start={gradients.primary.start}
              end={gradients.primary.end}
              style={styles.payButton}
            >
              <Text style={styles.payLabel}>Pagar</Text>
            </LinearGradient>
          </Pressable>
        )}
      </Panel>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.glassText,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.iconTileBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  amountBlock: {
    alignItems: 'flex-end',
    gap: 6,
  },
  chip: {
    marginTop: 2,
  },
  payWrap: {
    marginTop: spacing.md,
    borderRadius: radius.pill,
  },
  payWrapPressed: {
    opacity: 0.7,
  },
  payButton: {
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text,
  },
  paidLabel: {
    marginTop: 12,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.chipAccentText,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
});
