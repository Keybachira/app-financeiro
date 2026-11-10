import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ICON, go, goBack, useTemaBase } from "../data";
import type { ModuleId } from "../src/domain/modules";
import { useConfigModulos } from "../src/features/modulos/useConfigModulos";

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
  const { t, s } = useTemaBase();
  const ins = useSafeAreaInsets();
  const { isEnabled } = useConfigModulos();
  const lista = ITENS.filter((x) => isEnabled(x.id));

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={[s.content, { paddingTop: ins.top + 20 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.back}>
        <Pressable style={s.circ} onPress={goBack} accessibilityLabel="Voltar">
          <Feather name={ICON.back} size={20} color={t.text} />
        </Pressable>
        <Text style={s.backTxt}>Mais</Text>
      </View>

      <View style={s.panel}>
        <Pressable
          style={s.it}
          onPress={() => go("/inteligencia")}
          accessibilityLabel="Inteligência financeira"
        >
          <View style={[s.circSm, { backgroundColor: t.acc + "22" }]}>
            <Feather name={ICON.stat} size={17} color={t.acc} />
          </View>
          <View style={s.itBody}>
            <Text style={s.itTxt}>Inteligência financeira</Text>
            <Text style={[s.itSub, { marginTop: 2 }]}>
              Previsões, padrões e gastos fora do normal
            </Text>
          </View>
          <Feather name={ICON.chev} size={16} color={t.muted} />
        </Pressable>

        {lista.length ? (
          lista.map((x) => (
            <Pressable key={x.id} style={s.it} onPress={() => go(x.route)}>
              <View style={[s.circSm, { backgroundColor: t.circ }]}>
                <Feather name={ICON[x.icon]} size={17} color={t.text} />
              </View>
              <Text style={[s.itTxt, s.itBody]}>{x.label}</Text>
              <Feather name={ICON.chev} size={16} color={t.muted} />
            </Pressable>
          ))
        ) : (
          <View style={s.empty}>
            <Text style={s.emptyTxt}>Nenhum módulo ativo.</Text>
            <Pressable style={s.emptyBtn} onPress={() => go("/ajustes")}>
              <Text style={s.emptyBtnTxt}>Gerir módulos</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
