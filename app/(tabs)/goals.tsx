import { useFocusEffect, useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useCallback } from "react";
import { StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { formatKz } from "../../src/domain/money";
import { BotaoFlutuante } from "../../src/ui/componentes/BotaoFlutuante";
import { Ecra } from "../../src/ui/componentes/Ecra";
import { fonts, radius, spacing, useTema, useEstilosTema, type Cores } from "../../src/ui/tema";
import { useMetas } from "../../src/features/metas/useMetas";
import { CartaoMeta, EstadoVazioMetas } from "../../src/features/metas/CartaoMeta";

import { useAcaoProtegida } from "../../src/ui/useAcaoProtegida";

export default function GoalsScreen() {
  const styles = useEstilosTema(makeStyles);
  const router = useRouter();
  const { active, completed, reserved, refresh } = useMetas();
  const openNewGoal = useAcaoProtegida(() => router.push("/goal/new"));

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return (
    <Ecra
      title="Metas"
      right={<ReservedBadge value={reserved} />}
      floating={<BotaoFlutuante icon={Plus} label="Nova meta" onPress={openNewGoal} />}
    >
      {active.map((view) => (
        <CartaoMeta
          key={view.goal.id}
          view={view}
          onPress={() => router.push(`/goal/${view.goal.id}`)}
        />
      ))}

      {active.length === 0 && completed.length === 0 ? (
        <EstadoVazioMetas onCreate={openNewGoal} />
      ) : null}

      {completed.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>
            Concluídas ({completed.length})
          </Text>
          {completed.map((view) => (
            <CartaoMeta
              key={view.goal.id}
              view={view}
              onPress={() => router.push(`/goal/${view.goal.id}`)}
            />
          ))}
        </>
      ) : null}
    </Ecra>
  );
}

function ReservedBadge({ value }: { value: number }) {
  const { gradients } = useTema();
  const styles = useEstilosTema(makeStyles);

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

const makeStyles = (colors: Cores) =>
  StyleSheet.create({
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
