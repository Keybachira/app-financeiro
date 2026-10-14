import { useFocusEffect, useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatKz } from '../../src/domain/money';
import { Fab } from '../../src/ui/components/Fab';
import { GlassCard } from '../../src/ui/components/GlassCard';
import { MoneyText } from '../../src/ui/components/MoneyText';
import { Panel } from '../../src/ui/components/Panel';
import { ProgressBar } from '../../src/ui/components/ProgressBar';
import { Screen } from '../../src/ui/components/Screen';
import { colors, fonts } from '../../src/ui/theme';
import { ProjectCard, ProjectsEmptyState } from '../../src/features/projects/ProjectCard';
import { useProjects } from '../../src/features/projects/useProjects';

export default function ProjectsScreen() {
  const router = useRouter();
  const { active, settled, outstanding, refresh } = useProjects();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const receivedTotal = active.reduce((sum, view) => sum + view.received, 0) + settled.reduce((sum, view) => sum + view.received, 0);
  const totalValue = active.reduce((sum, view) => sum + view.project.total, 0) + settled.reduce((sum, view) => sum + view.project.total, 0);
  const overallPercent = totalValue > 0 ? Math.round((receivedTotal / totalValue) * 100) : 0;

  return (
    <Screen title="Projetos" floating={<Fab icon={Plus} label="Novo projeto" onPress={() => router.push('/project/new')} />}>
      <GlassCard>
        <Text style={styles.cardLabel}>A receber</Text>
        <MoneyText value={outstanding} size="balance" />
        <View style={styles.progressBlock}>
          <View style={styles.progressMeta}>
            <Text style={styles.cardLabel}>Já recebido · {overallPercent}%</Text>
            <Text style={styles.cardLabel}>
              {formatKz(receivedTotal)} / {formatKz(totalValue)}
            </Text>
          </View>
          <ProgressBar value={totalValue > 0 ? receivedTotal / totalValue : 0} tone="white" />
        </View>
      </GlassCard>

      {active.map((view) => (
        <ProjectCard key={view.project.id} view={view} onPress={() => router.push(`/project/${view.project.id}`)} />
      ))}

      {active.length === 0 && settled.length === 0 ? (
        <ProjectsEmptyState onCreate={() => router.push('/project/new')} />
      ) : null}

      {settled.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Concluídos ({settled.length})</Text>
          {settled.map((view) => (
            <ProjectCard key={view.project.id} view={view} onPress={() => router.push(`/project/${view.project.id}`)} />
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.glassText,
  },
  progressBlock: {
    marginTop: 14,
    gap: 8,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
});
