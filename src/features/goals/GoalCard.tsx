import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Target } from 'lucide-react-native';

import { formatKz } from '../../domain/money';
import { monthShort } from '../../domain/dates';
import { IconTile } from '../../ui/components/IconTile';
import { MoneyText } from '../../ui/components/MoneyText';
import { Panel } from '../../ui/components/Panel';
import { ProgressRing } from '../../ui/components/ProgressRing';
import { StatusChip } from '../../ui/components/StatusChip';
import { colors, fonts, radius, spacing } from '../../ui/theme';
import type { GoalView } from './useGoals';

function paceChip(view: GoalView) {
  if (view.completed) {
    return { tone: 'accent' as const, label: 'Concluída' };
  }

  if (view.goal.deadline === null) {
    return { tone: 'neutral' as const, label: 'Sem prazo' };
  }

  if (view.pace === 'ahead') {
    return { tone: 'accent' as const, label: `Adiantado ${formatKz(Math.round(view.paceDelta))}` };
  }

  if (view.pace === 'behind') {
    return { tone: 'warn' as const, label: `Atrasado ${formatKz(Math.round(view.paceDelta))}` };
  }

  return { tone: 'neutral' as const, label: 'No ritmo' };
}

function footerText(view: GoalView): string {
  if (view.completed) {
    return 'Valor reservado disponível para levantar';
  }

  if (view.goal.deadline === null) {
    return 'Sem prazo definido';
  }

  return `Poupar ${formatKz(view.monthlyNeeded)}/mês · até ${monthShort(view.goal.deadline)}`;
}

export function GoalCard({ view, onPress }: { view: GoalView; onPress: () => void }) {
  const chip = paceChip(view);

  // Sem label, o TalkBack lia o anel de progresso e os textos soltos sem dizer
  // que o cartão é navegável.
  const accessibilityLabel = [
    view.goal.name,
    `Guardado ${formatKz(view.saved)} de ${formatKz(view.goal.target)}, ${Math.round(view.progress * 100)}%`,
    chip.label,
    footerText(view),
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress}>
      <Panel>
        <View style={styles.row}>
          <ProgressRing value={view.progress} />
          <View style={styles.info}>
            <View style={styles.titleRow}>
              <IconTile icon={Target} size={28} iconSize={16} tone="accent" />
              <Text style={styles.title} numberOfLines={1}>
                {view.goal.name}
              </Text>
            </View>
            <Text style={styles.saved}>
              {formatKz(view.saved)} / {formatKz(view.goal.target)}
            </Text>
            <View style={styles.chip}>
              <StatusChip label={chip.label} tone={chip.tone} />
            </View>
          </View>
        </View>
        <Text style={styles.footer}>{footerText(view)}</Text>
      </Panel>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  saved: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  chip: {
    marginTop: 2,
  },
  footer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,.08)',
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  empty: {
    borderRadius: radius.panel,
    borderWidth: 1,
    borderColor: colors.panelBorder,
    backgroundColor: colors.bgMid,
    padding: spacing.lg,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
});

export function GoalsEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Sem metas. Toca para criar a primeira."
      onPress={onCreate}
    >
      <Text style={styles.empty}>
        Ainda não tens metas. Toca para criar a primeira e começar a poupar.
      </Text>
    </Pressable>
  );
}
