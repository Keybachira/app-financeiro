import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ICON, ITEM_FORMS, go, goBack, kz, pct, useTemaBase } from "../data";

export default function Metas() {
  const { t, s, st } = useTemaBase();
  const ins = useSafeAreaInsets();
  const ativo = st.mod.metas;

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
        <Text style={s.backTxt}>{ativo ? "Metas e poupanças" : "Metas"}</Text>
      </View>

      {!ativo ? (
        <View style={s.panel}>
          <View style={s.empty}>
            <Text style={s.emptyTxt}>O módulo está desativado.</Text>
            <Pressable style={s.emptyBtn} onPress={() => go("/ajustes")}>
              <Text style={s.emptyBtnTxt}>Gerir módulos</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <>
          <View style={s.panel}>
            {st.metas.length === 0 && (
              <View style={s.empty}>
                <Text style={s.emptyTxt}>Ainda sem metas.</Text>
              </View>
            )}
            {st.metas.map((g) => (
              <View key={g.id} style={s.row}>
                <View style={s.rowH}>
                  <Text style={s.rowTxt}>{g.nome}</Text>
                  <Text style={s.rowTxt}>{pct(g.atual, g.alvo)}%</Text>
                </View>
                <Text style={s.rowSub}>
                  {kz(g.atual)} de {kz(g.alvo)}
                </Text>
                <View style={s.bar}>
                  <View
                    style={[s.barFill, { width: `${pct(g.atual, g.alvo)}%` }]}
                  />
                </View>
              </View>
            ))}
          </View>
          <Pressable style={s.go} onPress={() => go("/novo-item?tipo=metas")}>
            <Text style={s.goTxt}>{ITEM_FORMS.metas.botao}</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}
