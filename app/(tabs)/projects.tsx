import { useFocusEffect, useRouter } from "expo-router";
import { Layers, Plus } from "lucide-react-native";
import { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { formatKz } from "../../src/domain/money";
import { formatDayMonthPt } from "../../src/domain/dates";
import { BotaoFlutuante } from "../../src/ui/componentes/BotaoFlutuante";
import { CartaoDestaque } from "../../src/ui/componentes/CartaoDestaque";
import { Painel } from "../../src/ui/componentes/Painel";
import { Ecra } from "../../src/ui/componentes/Ecra";
import {
  fonts,
  spacing,
  useTema,
  useEstilosTema,
  type Cores,
} from "../../src/ui/tema";
import { useProjetos } from "../../src/features/projetos/useProjetos";
import { EstadoVazioProjetos } from "../../src/features/projetos/CartaoProjeto";
import { useAcaoProtegida } from "../../src/ui/useAcaoProtegida";

const AMBAR = "#ffd35b";

type Vista = ReturnType<typeof useProjetos>["active"][number];

function LinhaProjeto({
  view,
  onPress,
}: {
  view: Vista;
  onPress: () => void;
}) {
  const { colors } = useTema();
  const styles = useEstilosTema(makeStyles);
  const { project } = view;
  const total = project.total > 0 ? project.total : 1;
  const pct = Math.min(100, Math.round((view.received / total) * 100));

  const meta = [
    project.client ? project.client : null,
    project.due_date
      ? `entrega a ${formatDayMonthPt(project.due_date)}`
      : "sem data",
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={project.name}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.rowTop}>
        <View style={styles.tile}>
          <Layers color={colors.accent} size={17} strokeWidth={1.6} />
        </View>
        <View style={styles.rowInfo}>
          <Text style={styles.rowName} numberOfLines={1}>
            {project.name}
          </Text>
          <Text style={styles.rowMeta} numberOfLines={1}>
            {meta}
          </Text>
        </View>
        <Text style={styles.rowPct}>{pct}%</Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.rowSmall}>
        {view.settled
          ? `Recebido ${formatKz(view.received)}`
          : `Recebido ${formatKz(view.received)} de ${formatKz(project.total)}`}
      </Text>
    </Pressable>
  );
}

export default function ProjectsScreen() {
  const styles = useEstilosTema(makeStyles);
  const router = useRouter();
  const { active, settled, outstanding, refresh } = useProjetos();
  const openNewProject = useAcaoProtegida(() => router.push("/project/new"));

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const contracted = active.reduce((sum, view) => sum + view.project.total, 0);
  const received = active.reduce((sum, view) => sum + view.received, 0);
  const subtitle =
    active.length === 0
      ? "Sem projetos ativos"
      : `${active.length} ${active.length === 1 ? "projeto ativo" : "projetos ativos"}`;

  const abrir = (id: string) => router.push(`/project/${id}`);

  return (
    <Ecra
      title="Projetos"
      subtitle={subtitle}
      floating={
        <BotaoFlutuante icon={Plus} label="Novo projeto" onPress={openNewProject} />
      }
    >
      <CartaoDestaque>
        <Text style={styles.cardLabel}>Por receber</Text>
        <Text style={styles.totalValue}>{formatKz(outstanding)}</Text>
        <View style={styles.io}>
          <View style={styles.ioBox}>
            <Text style={styles.ioLabel}>Contratado</Text>
            <Text style={styles.ioValue}>{formatKz(contracted)}</Text>
          </View>
          <View style={styles.ioBox}>
            <Text style={styles.ioLabel}>Recebido</Text>
            <Text style={styles.ioValue}>{formatKz(received)}</Text>
          </View>
        </View>
      </CartaoDestaque>

      {active.length === 0 && settled.length === 0 ? (
        <EstadoVazioProjetos onCreate={openNewProject} />
      ) : null}

      {active.length > 0 ? (
        <Painel>
          <Text style={styles.panelTitle}>Em curso</Text>
          {active.map((view) => (
            <LinhaProjeto
              key={view.project.id}
              view={view}
              onPress={() => abrir(view.project.id)}
            />
          ))}
        </Painel>
      ) : null}

      {settled.length > 0 ? (
        <Painel>
          <Text style={styles.panelTitle}>Liquidados ({settled.length})</Text>
          {settled.map((view) => (
            <LinhaProjeto
              key={view.project.id}
              view={view}
              onPress={() => abrir(view.project.id)}
            />
          ))}
        </Painel>
      ) : null}
    </Ecra>
  );
}

const makeStyles = (colors: Cores) =>
  StyleSheet.create({
    cardLabel: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.glassText,
      opacity: 0.85,
    },
    totalValue: {
      marginTop: 2,
      fontFamily: fonts.medium,
      fontSize: 33,
      letterSpacing: -0.6,
      color: colors.glassText,
      fontVariant: ["tabular-nums"],
    },
    io: {
      flexDirection: "row",
      gap: 10,
      marginTop: 12,
    },
    ioBox: {
      flex: 1,
      backgroundColor: "rgba(255,255,255,.14)",
      borderRadius: 16,
      paddingVertical: 9,
      paddingHorizontal: 12,
    },
    ioLabel: {
      fontFamily: fonts.regular,
      fontSize: 11,
      color: colors.glassText,
    },
    ioValue: {
      marginTop: 2,
      fontFamily: fonts.medium,
      fontSize: 14,
      color: colors.glassText,
      fontVariant: ["tabular-nums"],
    },
    panelTitle: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: colors.text,
      marginBottom: 6,
    },
    row: {
      paddingVertical: 10,
      paddingHorizontal: 4,
      borderRadius: 14,
    },
    rowPressed: {
      opacity: 0.7,
    },
    rowTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
    },
    tile: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.iconTileBg,
      alignItems: "center",
      justifyContent: "center",
    },
    rowInfo: {
      flex: 1,
      minWidth: 0,
    },
    rowName: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.text,
    },
    rowMeta: {
      fontFamily: fonts.regular,
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 1,
    },
    rowPct: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.text,
    },
    track: {
      height: 8,
      borderRadius: 8,
      backgroundColor: colors.iconTileBg,
      marginTop: 10,
      overflow: "hidden",
    },
    fill: {
      height: "100%",
      borderRadius: 8,
      backgroundColor: AMBAR,
    },
    rowSmall: {
      fontFamily: fonts.regular,
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 6,
      fontVariant: ["tabular-nums"],
    },
  });
