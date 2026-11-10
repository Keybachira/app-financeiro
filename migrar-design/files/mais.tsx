import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ICON, ModKey, go, goBack, useTemaBase } from "../data";

const ITENS: {
  k: Exclude<ModKey, "salario" | "limite">;
  icon: string;
  label: string;
}[] = [
  { k: "metas", icon: "goal", label: "Metas e poupanças" },
  { k: "dividas", icon: "debt", label: "Dívidas" },
  { k: "projetos", icon: "proj", label: "Projetos" },
  { k: "fixas", icon: "fix", label: "Despesas fixas" },
];

export default function Mais() {
  const { t, s, st } = useTemaBase();
  const ins = useSafeAreaInsets();
  const lista = ITENS.filter((x) => st.mod[x.k]);

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
        {lista.length ? (
          lista.map((x) => (
            <Pressable key={x.k} style={s.it} onPress={() => go(`/${x.k}`)}>
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
