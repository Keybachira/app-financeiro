import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeftRight, Pencil, Trash, X } from 'lucide-react-native';

import { formatKz } from '../../src/domain/money';
import { formatDayMonthPt } from '../../src/domain/dates';
import { AmountSheet } from '../../src/ui/components/AmountSheet';
import { ConfirmSheet } from '../../src/ui/components/ConfirmSheet';
import { GlassCard } from '../../src/ui/components/GlassCard';
import { IconButton } from '../../src/ui/components/IconButton';
import { MoneyText } from '../../src/ui/components/MoneyText';
import { Panel } from '../../src/ui/components/Panel';
import { ProgressBar } from '../../src/ui/components/ProgressBar';
import { ScreenBackground } from '../../src/ui/components/ScreenBackground';
import { StatusChip } from '../../src/ui/components/StatusChip';
import { useToast } from '../../src/ui/components/Toast';
import { colors, fonts, spacing } from '../../src/ui/theme';
import { debtView, getDebt } from '../../src/repos/debts';
import { debtStatusLabel, useDebts } from '../../src/features/debts/useDebts';

export default function DebtDetailScreen() {
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const debtId = typeof id === 'string' ? id : null;
  const { today, pay, payments, updatePayment, removePayment, remove } = useDebts();

  const [payOpen, setPayOpen] = useState(false);
  const [editPaymentId, setEditPaymentId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const debt = debtId ? getDebt(debtId) : null;
  const view = debt ? debtView(debt, today) : null;

  if (!debtId || !debt || !view) {
    return (
      <View style={styles.root}>
        <ScreenBackground />
        <View style={styles.header}>
          <Text style={styles.title}>Dívida</Text>
          <IconButton icon={X} label="Fechar" onPress={() => router.back()} />
        </View>
        <View style={styles.body}>
          <Text style={styles.muted}>Esta dívida já não existe.</Text>
        </View>
      </View>
    );
  }

  const paymentList = payments(debtId);
  const editing = paymentList.find((payment) => payment.id === editPaymentId) ?? null;
  const tone = view.status === 'paid' ? 'accent' : view.status === 'overdue' ? 'warn' : 'neutral';

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {debt.party}
          </Text>
          <View style={styles.headerActions}>
            <IconButton
              icon={Pencil}
              label="Editar dívida"
              onPress={() => router.push({ pathname: '/debt/new', params: { id: debtId } })}
            />
            <IconButton icon={X} label="Fechar" onPress={() => router.back()} />
          </View>
        </View>

        <GlassCard>
          <View style={styles.summaryRow}>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>{debt.kind === 'owe' ? 'Falta pagar' : 'Falta receber'}</Text>
              <MoneyText value={view.remaining} size="balance" />
            </View>
            <StatusChip label={debtStatusLabel(view)} tone={tone} />
          </View>

          <View style={styles.progressBlock}>
            <ProgressBar value={view.progress} tone="white" />
            <View style={styles.progressMeta}>
              <Text style={styles.summaryLabel}>
                Pago {formatKz(view.paid)} de {formatKz(debt.total)}
              </Text>
              <Text style={styles.summaryLabel}>
                {debt.due_date ? `Vence a ${formatDayMonthPt(debt.due_date)}` : 'Sem vencimento'}
              </Text>
            </View>
          </View>
        </GlassCard>

        {view.status !== 'paid' ? (
          <Panel style={styles.payCard} padded={false}>
            <Pressable accessibilityRole="button" onPress={() => setPayOpen(true)} style={styles.payButton}>
              <Text style={styles.payLabel}>Registar pagamento</Text>
              <Text style={styles.payHint}>
                {debt.kind === 'owe' ? 'Cria uma despesa em Dívidas' : 'Cria uma receita em Dívidas'}
              </Text>
            </Pressable>
          </Panel>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pagamentos</Text>
          {paymentList.length > 0 ? (
            paymentList.map((payment) => (
              <View key={payment.id} style={styles.paymentRow}>
                <View style={styles.paymentIcon}>
                  <ArrowLeftRight color={colors.accent} size={18} strokeWidth={2} />
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentDate}>{formatDayMonthPt(payment.date)}</Text>
                  <Text style={styles.paymentMeta}>
                    {payment.movement_id ? 'Movimento ligado' : 'Sem movimento ligado'}
                  </Text>
                </View>
                <MoneyText value={payment.amount} size="md" />
                <Pressable
                  accessibilityLabel="Editar pagamento"
                  hitSlop={8}
                  onPress={() => setEditPaymentId(payment.id)}
                >
                  <Pencil color={colors.textMuted} size={16} strokeWidth={2} />
                </Pressable>
                <Pressable
                  accessibilityLabel="Apagar pagamento"
                  hitSlop={8}
                  onPress={() => {
                    removePayment(payment.id);
                    toast({ message: 'Pagamento apagado' });
                  }}
                >
                  <Trash color={colors.warn} size={16} strokeWidth={2} />
                </Pressable>
              </View>
            ))
          ) : (
            <Text style={styles.muted}>Sem pagamentos registados.</Text>
          )}
        </View>

        <Pressable accessibilityRole="button" onPress={() => setConfirmDelete(true)} style={styles.textButton}>
          <Trash color={colors.warn} size={16} strokeWidth={2} />
          <Text style={styles.deleteLabel}>Apagar dívida</Text>
        </Pressable>
      </View>

      <AmountSheet
        visible={payOpen}
        title={`Pagamento · ${debt.party}`}
        confirmLabel="Registar"
        maxAmount={view.remaining}
        helper={`Em falta ${formatKz(view.remaining)}`}
        onCancel={() => setPayOpen(false)}
        onConfirm={(amount) => {
          setPayOpen(false);
          pay(debtId, amount);
          toast({ message: `Pagamento de ${formatKz(amount)} registado` });
        }}
      />

      <AmountSheet
        visible={editing !== null}
        title="Editar pagamento"
        confirmLabel="Guardar"
        maxAmount={view.remaining}
        onCancel={() => setEditPaymentId(null)}
        onConfirm={(amount) => {
          if (!editing) {
            return;
          }
          updatePayment(editing.id, amount, editing.date);
          setEditPaymentId(null);
          toast({ message: 'Pagamento atualizado' });
        }}
      />

      <ConfirmSheet
        visible={confirmDelete}
        title="Apagar dívida"
        message="Os pagamentos registados vão ser apagados. Os movimentos ligados deixam de estar associados a eles."
        confirmLabel="Apagar"
        destructive
        onConfirm={() => {
          setConfirmDelete(false);
          remove(debtId);
          toast({ message: 'Dívida apagada' });
          router.back();
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  body: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.text,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  summaryInfo: {
    flex: 1,
    gap: 2,
  },
  summaryLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.glassText,
  },
  progressBlock: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  payCard: {
    overflow: 'hidden',
  },
  payButton: {
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  payLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  payHint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
  paymentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.iconTileBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentDate: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
  paymentMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  textButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
  },
  deleteLabel: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.warn,
  },
  muted: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    paddingVertical: spacing.sm,
  },
});
