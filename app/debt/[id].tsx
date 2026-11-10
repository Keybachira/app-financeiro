import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeftRight, Pencil, Trash, X } from 'lucide-react-native';

import { formatKz } from '../../src/domain/money';
import { formatDayMonthPt } from '../../src/domain/dates';
import { FolhaValor } from '../../src/ui/componentes/FolhaValor';
import { FolhaConfirmacao } from '../../src/ui/componentes/FolhaConfirmacao';
import { CartaoDestaque } from '../../src/ui/componentes/CartaoDestaque';
import { BotaoIcone } from '../../src/ui/componentes/BotaoIcone';
import { TextoValor } from '../../src/ui/componentes/TextoValor';
import { Painel } from '../../src/ui/componentes/Painel';
import { BarraProgresso } from '../../src/ui/componentes/BarraProgresso';
import { FundoEcra } from '../../src/ui/componentes/FundoEcra';
import { ChipEstado } from '../../src/ui/componentes/ChipEstado';
import { useAvisoRapido } from '../../src/ui/componentes/AvisoRapido';
import { fonts, spacing, useTema, useEstilosTema, type Cores } from '../../src/ui/tema';
import { debtView, getDebt } from '../../src/repos/debts';
import { rotuloEstadoDivida, useDividas } from '../../src/features/dividas/useDividas';
import { callbackProtegido, executarAcaoProtegida } from '../../src/ui/protecaoAcoes';

export default function DebtDetailScreen() {
  const { colors, gradients } = useTema();
  const styles = useEstilosTema(makeStyles);
  const router = useRouter();
  const toast = useAvisoRapido();
  const { id } = useLocalSearchParams<{ id: string }>();
  const debtId = typeof id === 'string' ? id : null;
  const { today, pay, payments, updatePayment, removePayment, remove } = useDividas();

  const [payOpen, setPayOpen] = useState(false);
  const [editPaymentId, setEditPaymentId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const actionLock = useRef(false);
  const debt = debtId ? getDebt(debtId) : null;
  const view = debt ? debtView(debt, today) : null;

  if (!debtId || !debt || !view) {
    return (
      <View style={styles.root}>
        <FundoEcra />
        <View style={styles.header}>
          <Text style={styles.title}>Dívida</Text>
          <BotaoIcone icon={X} label="Fechar" onPress={() => router.back()} />
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
      <FundoEcra />
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {debt.party}
          </Text>
          <View style={styles.headerActions}>
            <BotaoIcone
              icon={Pencil}
              label="Editar dívida"
              onPress={callbackProtegido(() => router.push({ pathname: '/debt/new', params: { id: debtId } }))}
            />
            <BotaoIcone icon={X} label="Fechar" onPress={() => router.back()} />
          </View>
        </View>

        <CartaoDestaque>
          <View style={styles.summaryRow}>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>{debt.kind === 'owe' ? 'Falta pagar' : 'Falta receber'}</Text>
              <TextoValor value={view.remaining} size="balance" />
            </View>
            <ChipEstado label={rotuloEstadoDivida(view)} tone={tone} />
          </View>

          <View style={styles.progressBlock}>
            <BarraProgresso value={view.progress} tone="white" />
            <View style={styles.progressMeta}>
              <Text style={styles.summaryLabel}>
                Pago {formatKz(view.paid)} de {formatKz(debt.total)}
              </Text>
              <Text style={styles.summaryLabel}>
                {debt.due_date ? `Vence a ${formatDayMonthPt(debt.due_date)}` : 'Sem vencimento'}
              </Text>
            </View>
          </View>
        </CartaoDestaque>

        {view.status !== 'paid' ? (
          <Painel style={styles.payCard} padded={false}>
            <Pressable accessibilityRole="button" onPress={callbackProtegido(() => setPayOpen(true))} style={styles.payButton}>
              <Text style={styles.payLabel}>Registar pagamento</Text>
              <Text style={styles.payHint}>
                {debt.kind === 'owe' ? 'Cria uma despesa em Dívidas' : 'Cria uma receita em Dívidas'}
              </Text>
            </Pressable>
          </Painel>
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
                <TextoValor value={payment.amount} size="md" />
                <Pressable
                  accessibilityLabel="Editar pagamento"
                  hitSlop={8}
                  onPress={callbackProtegido(() => setEditPaymentId(payment.id))}
                >
                  <Pencil color={colors.textMuted} size={16} strokeWidth={2} />
                </Pressable>
                <Pressable
                  accessibilityLabel="Apagar pagamento"
                  hitSlop={8}
                  onPress={() => executarAcaoProtegida(() => {
                    try { removePayment(payment.id); toast({ message: 'Pagamento apagado' }); } catch (e) { toast({ message: e instanceof Error ? e.message : 'Falhou.', tone: 'error' }); }
                  })}
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
      </ScrollView>

      <FolhaValor
        visible={payOpen}
        title={`Pagamento · ${debt.party}`}
        confirmLabel="Registar"
        maxAmount={view.remaining}
        helper={`Em falta ${formatKz(view.remaining)}`}
        onCancel={() => setPayOpen(false)}
        onConfirm={(amount) => {
          if (actionLock.current) return;
          actionLock.current = true;
          try {
            setPayOpen(false);
            pay(debtId, amount);
            toast({ message: `Pagamento de ${formatKz(amount)} registado` });
          } catch (e) { toast({ message: e instanceof Error ? e.message : 'Falhou.', tone: 'error' }); }
          finally { actionLock.current = false; }
        }}
      />

      <FolhaValor
        visible={editing !== null}
        title="Editar pagamento"
        confirmLabel="Guardar"
        maxAmount={editing ? view.remaining + editing.amount : view.remaining}
        onCancel={() => setEditPaymentId(null)}
        onConfirm={(amount) => {
          if (!editing || actionLock.current) return;
          actionLock.current = true;
          try {
            updatePayment(editing.id, amount, editing.date);
            setEditPaymentId(null);
            toast({ message: 'Pagamento atualizado' });
          } catch (e) { toast({ message: e instanceof Error ? e.message : 'Falhou.', tone: 'error' }); }
          finally { actionLock.current = false; }
        }}
      />

      <FolhaConfirmacao
        visible={confirmDelete}
        title="Apagar dívida"
        message="Os pagamentos registados vão ser apagados. Os movimentos ligados deixam de estar associados a eles."
        confirmLabel="Apagar"
        destructive
        onConfirm={() => {
          if (actionLock.current) return;
          actionLock.current = true;
          try {
            setConfirmDelete(false);
            remove(debtId);
            toast({ message: 'D�vida apagada' });
            router.back();
          } catch (e) { actionLock.current = false; toast({ message: e instanceof Error ? e.message : 'Falhou.', tone: 'error' }); }
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </View>
  );
}

const makeStyles = (colors: Cores) =>
  StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    flexGrow: 1,
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
