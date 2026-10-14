import { useFocusEffect, useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useCallback } from 'react';
import { StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { formatKz } from '../../src/domain/money';
import { Fab } from '../../src/ui/components/Fab';
import { Screen } from '../../src/ui/components/Screen';
import { colors, fonts, gradients, radius, spacing } from '../../src/ui/theme';
import { useGoals } from '../../src/features/goals/useGoals';
import { GoalCard, GoalsEmptyState } from '../../src/features/goals/GoalCard';

export default function GoalsScreen() {
  const router = useRouter();
  const { active, completed, reserved, refresh } = useGoals();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return (
    <Screen
      title="Metas"
      right={<ReservedBadge value={reserved} />}
      floating={<Fab icon={Plus} label="Nova meta" onPress={() => router.push('/goal/new')} />}
    >
      {active.map((view) => (
        <GoalCard key={view.goal.id} view={view} onPress={() => router.push(`/goal/${view.goal.id}`)} />
      ))}

      {active.length === 0 && completed.length === 0 ? (
        <GoalsEmptyState onCreate={() => router.push('/goal/new')} />
      ) : null}

      {completed.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Concluídas ({completed.length})</Text>
          {completed.map((view) => (
            <GoalCard key={view.goal.id} view={view} onPress={() => router.push(`/goal/${view.goal.id}`)} />
          ))}
        </>
      ) : null}
    </Screen>
  );
}

function ReservedBadge({ value }: { value: number }) {
  return (
    <LinearGradient
      colors={gradients.panel.colors}
      start={gradients.panel.start}
      end={gradients.panel.end}
      style={styles.badge}
    >
      <Text style={styles.badgeText}>Reservado {formatKz(value)}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    marginTop: spacing.sm,
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  badge: {
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: colors.panelBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.text,
  },
});
