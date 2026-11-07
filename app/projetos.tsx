import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ICON, ITEM_FORMS, go, goBack, kz, pct, useTheme } from "../data";

export default function Projetos() {
  const { t, s, st } = useTheme();
  const ins = useSafeAreaInsets();

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
        <Text style={s.backTxt}>Projetos</Text>
      </View>

      {!st.mod.projetos ? (
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
            {st.projetos.length === 0 && (
              <View style={s.empty}>
                <Text style={s.emptyTxt}>Ainda sem projetos.</Text>
              </View>
            )}
            {st.projetos.map((p) => (
              <View key={p.id} style={s.row}>
                <View style={s.rowH}>
                  <Text style={s.rowTxt}>{p.nome}</Text>
                  <Text style={s.rowTxt}>{pct(p.gasto, p.orcamento)}%</Text>
                </View>
                <Text style={s.rowSub}>
                  Gasto {kz(p.gasto)} de {kz(p.orcamento)}
                </Text>
                <View style={s.bar}>
                  <View
                    style={[
                      s.barFill,
                      {
                        width: `${pct(p.gasto, p.orcamento)}%`,
                        backgroundColor: t.amb,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
          <Pressable
            style={s.go}
            onPress={() => go("/novo-item?tipo=projetos")}
          >
            <Text style={s.goTxt}>{ITEM_FORMS.projetos.botao}</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}
