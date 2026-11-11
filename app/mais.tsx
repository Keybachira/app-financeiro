import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ICON, go, goBack } from "../data";
import type { ModuleId } from "../src/domain/modules";
import { useConfigModulos } from "../src/features/modulos/useConfigModulos";
import { FundoEcra } from "../src/ui/componentes/FundoEcra";
import { Painel } from "../src/ui/componentes/Painel";
import {
  fonts,
  layout,
  useEstilosTema,
  useTema,
  type Cores,
} from "../src/ui/tema";

const ITENS: {
  id: ModuleId;
  icon: string;
  label: string;
  route: string;
}[] = [
  {
    id: "goals_savings",
    icon: "goal",
    label: "Metas e poupanças",
    route: "/goals",
  },
  { id: "debts", icon: "debt", label: "Dívidas", route: "/debts" },
  { id: "projects", icon: "proj", label: "Projetos", route: "/projects" },
  {
    id: "fixed_expenses",
    icon: "fix",
    label: "Contas fixas",
    route: "/bill",
  },
];

export default function Mais() {
  const { colors } = useTema();
  const styles = useEstilosTema(makeStyles);
  const ins = useSafeAreaInsets();
  const { isEnabled } = useConfigModulos();
  const lista = ITENS.filter((x) => isEnabled(x.id));

  return (
    <View style={styles.root}>
      <FundoEcra />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: ins.top + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* cabeçalho (`.back`) */}
        <View style={styles.back}>
          <Pressable
            style={styles.backCirc}
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Feather name={ICON.back} size={20} color={colors.text} />
          </Pressable>
          <Text style={styles.backTxt}>Mais</Text>
        </View>

        <Painel padded={false} style={styles.panel}>
          <Pressable
            style={styles.it}
            onPress={() => go("/inteligencia")}
            accessibilityRole="button"
            accessibilityLabel="Inteligência financeira"
          >
            <View
              style={[
                styles.itCirc,
                { backgroundColor: colors.accentSoft + "22" },
              ]}
            >
              <Feather name={ICON.stat} size={17} color={colors.accent} />
            </View>
            <View style={styles.itBody}>
              <Text style={styles.itTxt}>Inteligência financeira</Text>
              <Text style={styles.itSub}>
                Previsões, padrões e gastos fora do normal
              </Text>
            </View>
            <Feather name={ICON.chev} size={16} color={colors.textMuted} />
          </Pressable>

          {lista.length ? (
            lista.map((x) => (
              <Pressable
                key={x.id}
                style={styles.it}
                onPress={() => go(x.route)}
                accessibilityRole="button"
                accessibilityLabel={x.label}
              >
                <View style={styles.itCirc}>
                  <Feather
                    name={ICON[x.icon]}
                    size={17}
                    color={colors.text}
                  />
                </View>
                <Text style={styles.itTxt}>{x.label}</Text>
                <Feather name={ICON.chev} size={16} color={colors.textMuted} />
              </Pressable>
            ))
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTxt}>Nenhum módulo ativo.</Text>
              <Pressable
                style={styles.emptyBtn}
                onPress={() => go("/ajustes")}
                accessibilityRole="button"
                accessibilityLabel="Gerir módulos"
              >
                <Text style={styles.emptyBtnTxt}>Gerir módulos</Text>
              </Pressable>
            </View>
          )}
        </Painel>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: Cores) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: layout.screenBottom,
    },

    // `.back`
    back: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 4,
    },
    backCirc: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.bgMid,
      alignItems: "center",
      justifyContent: "center",
    },
    backTxt: {
      fontFamily: fonts.medium,
      fontSize: 20,
      color: colors.text,
    },

    // `.panel`
    panel: {
      marginTop: 16,
      paddingVertical: 18,
      paddingHorizontal: 14,
    },

    // `.it`
    it: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      minHeight: 54,
      paddingVertical: 6,
      paddingHorizontal: 4,
      borderRadius: 14,
    },
    itCirc: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.chipNeutralBg,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    itBody: {
      flex: 1,
      minWidth: 0,
    },
    itTxt: {
      flex: 1,
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.text,
    },
    itSub: {
      fontFamily: fonts.regular,
      fontSize: 10,
      lineHeight: 15,
      color: colors.textMuted,
      marginTop: 2,
    },

    // `.empty`
    empty: {
      alignItems: "center",
      paddingVertical: 26,
      paddingHorizontal: 10,
    },
    emptyTxt: {
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 18,
      color: colors.textMuted,
      textAlign: "center",
    },
    emptyBtn: {
      marginTop: 12,
      paddingVertical: 9,
      paddingHorizontal: 18,
      borderRadius: 99,
      backgroundColor: colors.accent,
    },
    emptyBtnTxt: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.glassText,
    },
  });
