import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Painel } from "./Painel";
import { fonts, spacing, useEstilosTema, type Cores } from "../tema";
import { useConfigModulos } from "../../features/modulos/useConfigModulos";
import type { ModuleId } from "../../domain/modules";

const makeStyles = (colors: Cores) =>
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

/**
 * Ecrã de substituição quando o utilizador desliga um módulo nas definições.
 *
 * Não apaga dados: só explica que o módulo está desativado e que os registos
 * voltam a aparecer quando for reativado.
 */
export function ModuloDesativado({ moduleId }: { moduleId: ModuleId }) {
  const styles = useEstilosTema(makeStyles);

  return (
    <View style={styles.wrap}>
      <Painel>
        <Text style={styles.title}>M�dulo desativado</Text>
        <Text style={styles.text}>
          {LABELS[moduleId]} est� desativado. Os dados existentes foram
          preservados e podem ser recuperados ao reativar o m�dulo nas
          Defini��es.
        </Text>
      </Painel>
    </View>
  );
}

/** Atalho: lê do repositório de módulos se um módulo está ligado. */
export function useModuloAtivo(moduleId: ModuleId): boolean {
  const { modules } = useConfigModulos();
  return modules[moduleId];
}

/** Nomes visíveis de cada módulo, usados nos ecrãs de configuração. */
export function useRotulosModulo() {
  return useMemo(() => LABELS, []);
}
