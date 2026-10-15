import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Briefcase } from 'lucide-react-native';

import { formatKz } from '../../domain/money';
import { formatDayMonthPt } from '../../domain/dates';
import { IconTile } from '../../ui/components/IconTile';
import { Panel } from '../../ui/components/Panel';
import { ProgressBar } from '../../ui/components/ProgressBar';
import { StatusChip } from '../../ui/components/StatusChip';
import { colors, fonts } from '../../ui/theme';
import { projectChipLabel, type useProjects } from './useProjects';

type ProjectViewType = ReturnType<typeof useProjects>['active'][number];

export function ProjectCard({ view, onPress }: { view: ProjectViewType; onPress: () => void }) {
  const due = view.project.due_date;

  // Sem label, o TalkBack lia os textos filhos soltos, sem dizer que é um item
  // navegável nem o estado do projeto.
  const accessibilityLabel = [
    view.project.name,
    view.project.client,
    projectChipLabel(view),
    view.settled
      ? `Recebido ${formatKz(view.received)} de ${formatKz(view.project.total)}${
          view.project.delivered_at ? `, entregue a ${formatDayMonthPt(view.project.delivered_at)}` : ''
        }`
      : `Recebido ${formatKz(view.received)} de ${formatKz(view.project.total)}, falta ${formatKz(
          view.remaining
        )}${due ? `, entrega a ${formatDayMonthPt(due)}` : ''}`,
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress}>
      <Panel>
        <View style={styles.row}>
          <IconTile icon={Briefcase} size={44} />
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>
              {view.project.name}
            </Text>
            {view.project.client ? <Text style={styles.client}>{view.project.client}</Text> : null}
          </View>
          {/* Os dois ramos eram 'accent': o chip nunca distinguia liquidado de
              em curso, apesar de haver dois estados. */}
          <StatusChip label={projectChipLabel(view)} tone={view.settled ? 'accent' : 'neutral'} />
        </View>

        <View style={styles.numbers}>
          <Text style={styles.received}>
            Recebido <Text style={styles.receivedStrong}>{formatKz(view.received)}</Text>
          </Text>
          <Text style={styles.target}>de {formatKz(view.project.total)}</Text>
        </View>

        <ProgressBar value={view.progress} tone="gradient" />

        <Text style={styles.meta}>
          {view.settled
            ? view.project.delivered_at
              ? `Entregue a ${formatDayMonthPt(view.project.delivered_at)}`
              : 'Pago'
            : `Falta ${formatKz(view.remaining)}${due ? ` · entrega a ${formatDayMonthPt(due)}` : ''}`}
        </Text>
      </Panel>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  client: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  numbers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 14,
    marginBottom: 8,
  },
  received: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
  receivedStrong: {
    fontFamily: fonts.bold,
    color: colors.text,
  },
  target: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  meta: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
});

export function ProjectsEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Sem projetos. Toca para criar o primeiro."
      onPress={onCreate}
    >
      <Panel>
        <Text style={styles.target}>Sem projetos. Toca para criar o primeiro.</Text>
      </Panel>
    </Pressable>
  );
}
