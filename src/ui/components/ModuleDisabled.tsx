import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Panel } from "./Panel";
import { fonts, spacing, useThemedStyles, type Colors } from "../theme";
import { useModuleConfig } from "../../features/modules/useModuleConfig";
import type { ModuleId } from "../../domain/modules";

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    wrap: { flex: 1, justifyContent: "center", paddingHorizontal: spacing.lg },
    title: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
    text: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
      marginTop: spacing.xs,
    },
  });

const LABELS: Record<ModuleId, string> = {
  movements: "Movimentos",
  salary_income: "Sal�rio e rendimentos",
  goals_savings: "Metas e poupan�as",
  debts: "D�vidas",
  projects: "Projetos",
  fixed_expenses: "Despesas fixas",
  daily_limit: "Limite di�rio",
};

export function ModuleDisabled({ moduleId }: { moduleId: ModuleId }) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.wrap}>
      <Panel>
        <Text style={styles.title}>M�dulo desativado</Text>
        <Text style={styles.text}>
          {LABELS[moduleId]} est� desativado. Os dados existentes foram
          preservados e podem ser recuperados ao reativar o m�dulo nas
          Defini��es.
        </Text>
      </Panel>
    </View>
  );
}

export function useIsModuleEnabled(moduleId: ModuleId): boolean {
  const { modules } = useModuleConfig();
  return modules[moduleId];
}

export function useModuleLabels() {
  return useMemo(() => LABELS, []);
}
