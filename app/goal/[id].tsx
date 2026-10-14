import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeftRight, Pencil, Trash, X } from 'lucide-react-native';

import { formatKz } from '../../src/domain/money';
import { formatDayMonthPt, monthShort } from '../../src/domain/dates';
import { AmountSheet } from '../../src/ui/components/AmountSheet';
import { ConfirmSheet } from '../../src/ui/components/ConfirmSheet';
import { IconButton } from '../../src/ui/components/IconButton';
import { GlassCard } from '../../src/ui/components/GlassCard';
import { MoneyText } from '../../src/ui/components/MoneyText';
import { Panel } from '../../src/ui/components/Panel';
import { ProgressRing } from '../../src/ui/components/ProgressRing';
import { ScreenBackground } from '../../src/ui/components/ScreenBackground';
import { StatusChip } from '../../src/ui/components/StatusChip';
import { useToast } from '../../src/ui/components/Toast';
import { colors, fonts, radius, spacing } from '../../src/ui/theme';
import { useGoals } from '../../src/features/goals/useGoals';

type SheetMode = 'deposit' | 'withdraw' | null;

export default function GoalDetailScreen() {
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const goalId = typeof id === 'string' ? id : null;
  const { detail, ops, deposit, withdraw, remove, archive, removeOp } = useGoals();

  const [sheet, setSheet] = useState<SheetMode>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const view = goalId ? detail(goalId) : null;

  if (!goalId || !view) {
    return (
      <View style={styles.root}>
        <ScreenBackground />
        <View style={styles.header}>
          <Text style={styles.title}>Meta</Text>
          <IconButton icon={X} label="Fechar" onPress={() => router.back()} />
        </View>
        <View style={styles.body}>
          <Text style={styles.muted}>Esta meta já não existe.</Text>
        </View>
      </View>
    );
  }

  const operations = ops(goalId);
  const chipLabel = view.completed
    ? 'Concluída'
    : view.goal.deadline === null
      ? 'Sem prazo'
      : view.pace === 'ahead'
        ? 'Adiantada'
        : view.pace === 'behind'
          ? 'Atrasada'
          : 'No ritmo';
  const chipTone = view.completed || view.pace === 'ahead' ? 'accent' : view.pace === 'behind' ? 'warn' : 'neutral';

  const handleConfirmAmount = (amount: number) => {
    setSheet(null);

    if (sheet === 'deposit') {
      deposit(goalId, amount);
      toast({ message: `Depositado ${formatKz(amount)}` });
    } else if (sheet === 'withdraw') {
      withdraw(goalId, amount);
      toast({ message: `Levantado ${formatKz(amount)}` });
    }
  };

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {view.goal.name}
          </Text>
          <View style={styles.headerActions}>
            <IconButton
              icon={Pencil}
              label="Editar meta"
              onPress={() => router.push({ pathname: '/goal/new', params: { id: goalId } })}
            />
            <IconButton icon={X} label="Fechar" onPress={() => router.back()} />
          </View>
        </View>

        <GlassCard>
          <View style={styles.summaryRow}>
            <ProgressRing value={view.progress} size={72} stroke={8} />
            <View style={styles.summaryInfo}>
              <MoneyText value={view.saved} size="lg" />
              <Text style={styles.summaryTarget}>de {formatKz(view.goal.target)}</Text>
              <View style={styles.chip}>
                <StatusChip label={chipLabel} tone={chipTone} />
              </View>
            </View>
          </View>
          <Text style={styles.summaryFooter}>
            {view.completed
              ? 'Podes levantar ou arquivar quando quiseres'
              : view.goal.deadline === null
                ? 'Sem prazo definido'
                : `Poupar ${formatKz(view.monthlyNeeded)}/mês · até ${monthShort(view.goal.deadline)}`}
          </Text>
        </GlassCard>

        <View style={styles.actionsRow}>
          <Panel style={styles.actionCard} padded={false}>
            <Pressable accessibilityRole="button" onPress={() => setSheet('deposit')} style={styles.actionButton}>
              <Text style={styles.actionLabel}>Depositar</Text>
            </Pressable>
          </Panel>
          <Panel style={styles.actionCard} padded={false}>
            <Pressable
              accessibilityRole="button"
              disabled={view.saved <= 0}
              onPress={() => setSheet('withdraw')}
              style={[styles.actionButton, view.saved <= 0 && styles.actionDisabled]}
            >
              <Text style={styles.actionLabel}>Levantar</Text>
            </Pressable>
          </Panel>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operações</Text>
          {operations.length > 0 ? (
            operations.map((op) => (
              <View key={op.id} style={styles.opRow}>
                <View style={styles.opIcon}>
                  <ArrowLeftRight color={op.kind === 'deposit' ? colors.accent : colors.warn} size={18} strokeWidth={2} />
                </View>
                <View style={styles.opInfo}>
                  <Text style={styles.opTitle}>{op.kind === 'deposit' ? 'Depósito' : 'Levantamento'}</Text>
                  <Text style={styles.opMeta}>{formatDayMonthPt(op.date)}</Text>
                </View>
                <MoneyText value={op.amount} size="sm" tone={op.kind === 'deposit' ? 'default' : 'muted'} />
                <Pressable
                  accessibilityLabel="Apagar operação"
                  hitSlop={8}
                  onPress={() => {
                    removeOp(op.id);
                    toast({ message: 'Operação apagada' });
                  }}
                >
                  <X color={colors.textMuted} size={16} strokeWidth={2} />
                </Pressable>
              </View>
            ))
          ) : (
            <Text style={styles.muted}>Sem operações registadas.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              archive(goalId, view.goal.archived_at === null);
              toast({ message: view.goal.archived_at === null ? 'Meta arquivada' : 'Meta reativada' });
            }}
            style={styles.textButton}
          >
            <Text style={styles.textButtonLabel}>
              {view.goal.archived_at === null ? 'Arquivar meta' : 'Reativar meta'}
            </Text>
          </Pressable>

          <Pressable accessibilityRole="button" onPress={() => setConfirmDelete(true)} style={styles.textButton}>
            <Trash color={colors.warn} size={16} strokeWidth={2} />
            <Text style={styles.deleteLabel}>Apagar meta</Text>
          </Pressable>
        </View>
      </View>

      <AmountSheet
        visible={sheet !== null}
        title={sheet === 'deposit' ? 'Depositar na meta' : 'Levantar da meta'}
        confirmLabel={sheet === 'deposit' ? 'Depositar' : 'Levantar'}
        helper={sheet === 'withdraw' ? `Disponível: ${formatKz(view.saved)}` : undefined}
        maxAmount={sheet === 'withdraw' ? view.saved : undefined}
        onCancel={() => setSheet(null)}
        onConfirm={handleConfirmAmount}
      />

      <ConfirmSheet
        visible={confirmDelete}
        title="Apagar meta"
        message={`O reservado de ${formatKz(view.saved)} volta ao saldo do mês. Esta ação é irreversível.`}
        confirmLabel="Apagar"
        destructive
        onConfirm={() => {
          setConfirmDelete(false);
          remove(goalId);
          toast({ message: 'Meta apagada' });
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
    gap: spacing.lg,
  },
  summaryInfo: {
    flex: 1,
    gap: 4,
  },
  summaryTarget: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.glassText,
  },
  chip: {
    marginTop: 4,
  },
  summaryFooter: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,.12)',
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.glassText,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionCard: {
    flex: 1,
  },
  actionButton: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDisabled: {
    opacity: 0.5,
  },
  actionLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  opRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
  opIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.iconTileBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opInfo: {
    flex: 1,
  },
  opTitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
  opMeta: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  textButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingVertical: spacing.sm,
  },
  textButtonLabel: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
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
  headerSpacer: {
    width: spacing.sm,
  },
  cardRadius: {
    borderRadius: radius.panel,
  },
});
