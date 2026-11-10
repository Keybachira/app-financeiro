import { useFocusEffect, useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";

import { formatKz } from "../../src/domain/money";
import { BotaoFlutuante } from "../../src/ui/componentes/BotaoFlutuante";
import { CartaoDestaque } from "../../src/ui/componentes/CartaoDestaque";
import { Ecra } from "../../src/ui/componentes/Ecra";
import {
  fonts,
  spacing,
  useEstilosTema,
  type Cores,
} from "../../src/ui/tema";
import { useProjetos } from "../../src/features/projetos/useProjetos";
import {
  CartaoProjeto,
  EstadoVazioProjetos,
} from "../../src/features/projetos/CartaoProjeto";
import { useAcaoProtegida } from "../../src/ui/useAcaoProtegida";

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
  const subtitle =
    active.length === 0
      ? "Sem projetos ativos"
      : `${active.length} ${active.length === 1 ? "projeto ativo" : "projetos ativos"}`;

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
        <View style={styles.contractedRow}>
          <Text style={styles.cardLabel}>Contratado nos ativos</Text>
          <Text style={styles.contractedValue}>{formatKz(contracted)}</Text>
        </View>
      </CartaoDestaque>

      {active.length === 0 && settled.length === 0 ? (
        <EstadoVazioProjetos onCreate={openNewProject} />
      ) : null}

      {active.map((view) => (
        <CartaoProjeto
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
            <CartaoProjeto
              key={view.project.id}
              view={view}
              onPress={() => router.push(`/project/${view.project.id}`)}
            />
          ))}
        </>
      ) : null}
    </Ecra>
  );
}

const makeStyles = (colors: Cores) =>
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
