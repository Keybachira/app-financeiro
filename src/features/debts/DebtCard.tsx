import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatKz } from '../../domain/money';
import { Panel } from '../../ui/components/Panel';
import { ProgressBar } from '../../ui/components/ProgressBar';
import { StatusChip } from '../../ui/components/StatusChip';
import { colors, fonts, spacing } from '../../ui/theme';
import { debtStatusLabel, type useDebts } from './useDebts';

type DebtViewType = ReturnType<typeof useDebts>['views'][number];

export function DebtCard({ view, onPress }: { view: DebtViewType; onPress: () => void }) {
  const tone = view.status === 'paid' ? 'accent' : view.status === 'overdue' ? 'warn' : 'neutral';

  // Sem label, o TalkBack agrupava os textos filhos e lia "botão, J, 1 500 Kz,
  // Pago 0 de 5 000 Kz" — sem dizer o que o botão faz.
  const accessibilityLabel = [
    view.debt.party,
    view.debt.kind === 'owe' ? 'Devo' : 'Devem-me',
    debtStatusLabel(view),
    view.status === 'paid'
      ? `Liquidada, pago ${formatKz(view.paid)} de ${formatKz(view.debt.total)}`
      : `Falta ${formatKz(view.remaining)}, pago ${formatKz(view.paid)} de ${formatKz(view.debt.total)}`,
  ].join('. ');

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress}>
      <Panel>
        <View style={styles.row}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{view.debt.party.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.info}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>
                {view.debt.party}
              </Text>
              <Text style={styles.kind}>{view.debt.kind === 'owe' ? 'Devo' : 'Devem-me'}</Text>
            </View>
            <Text style={styles.amount}>{formatKz(view.remaining)}</Text>
          </View>
          <StatusChip label={debtStatusLabel(view)} tone={tone} />
        </View>

        <View style={styles.progressBlock}>
          <ProgressBar value={view.progress} tone="gradient" />
          <Text style={styles.meta}>Pago {formatKz(view.paid)} de {formatKz(view.debt.total)}</Text>
        </View>
      </Panel>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.iconTileBg,
    alignItems: 'center',
    justifyContent: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
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
    fontVariant: ['tabular-nums'],
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

export function DebtEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Sem dívidas registadas. Toca para criar a primeira."
      onPress={onCreate}
    >
      <Panel>
        <Text style={styles.meta}>Sem dívidas registadas. Toca para criar a primeira.</Text>
      </Panel>
    </Pressable>
  );
}
