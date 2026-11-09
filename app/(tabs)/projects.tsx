import { useFocusEffect, useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";

import { formatKz } from "../../src/domain/money";
import { Fab } from "../../src/ui/components/Fab";
import { GlassCard } from "../../src/ui/components/GlassCard";
import { Screen } from "../../src/ui/components/Screen";
import {
  fonts,
  spacing,
  useThemedStyles,
  type Colors,
} from "../../src/ui/theme";
import { useProjects } from "../../src/features/projects/useProjects";
import {
  ProjectCard,
  ProjectsEmptyState,
} from "../../src/features/projects/ProjectCard";
import { useGuardedAction } from "../../src/ui/useGuardedAction";

export default function ProjectsScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { active, settled, outstanding, refresh } = useProjects();
  const openNewProject = useGuardedAction(() => router.push("/project/new"));

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const contracted = active.reduce((sum, view) => sum + view.project.total, 0);
  const subtitle =
    active.length === 0
      ? "Sem projetos ativos"
      : `${active.length} ${active.length === 1 ? "projeto ativo" : "projetos ativos"}`;

  return (
    <Screen
      title="Projetos"
      subtitle={subtitle}
      floating={
        <Fab icon={Plus} label="Novo projeto" onPress={openNewProject} />
      }
    >
      <GlassCard>
        <Text style={styles.cardLabel}>Por receber</Text>
        <Text style={styles.totalValue}>{formatKz(outstanding)}</Text>
        <View style={styles.contractedRow}>
          <Text style={styles.cardLabel}>Contratado nos ativos</Text>
          <Text style={styles.contractedValue}>{formatKz(contracted)}</Text>
        </View>
      </GlassCard>

      {active.length === 0 && settled.length === 0 ? (
        <ProjectsEmptyState onCreate={openNewProject} />
      ) : null}

      {active.map((view) => (
        <ProjectCard
          key={view.project.id}
          view={view}
          onPress={() => router.push(`/project/${view.project.id}`)}
        />
      ))}

      {settled.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>
            Liquidados ({settled.length})
          </Text>
          {settled.map((view) => (
            <ProjectCard
              key={view.project.id}
              view={view}
              onPress={() => router.push(`/project/${view.project.id}`)}
            />
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    cardLabel: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.glassText,
    },
    totalValue: {
      marginTop: 2,
      fontFamily: fonts.bold,
      fontSize: 32,
      color: colors.glassText,
      fontVariant: ["tabular-nums"],
    },
    contractedRow: {
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: "rgba(255,255,255,.18)",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.sm,
    },
    contractedValue: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: colors.glassText,
      fontVariant: ["tabular-nums"],
    },
    sectionTitle: {
      marginTop: spacing.sm,
      fontFamily: fonts.bold,
      fontSize: 16,
      color: colors.text,
    },
  });
