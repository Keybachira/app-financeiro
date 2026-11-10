import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ICON, ITEM_FORMS, go, goBack, kz, nextDue, useTemaBase } from "../data";

export default function Fixas() {
  const { t, s, st } = useTemaBase();
  const ins = useSafeAreaInsets();
  const total = st.fixas.reduce((a, f) => a + f.valor, 0);
  const due = nextDue(st);

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
        <Text style={s.backTxt}>Despesas fixas</Text>
      </View>

      {!st.mod.fixas ? (
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
          {due && due.dias <= 7 && (
            <View style={s.alr}>
              <View style={s.alrDot} />
              <Text style={s.alrTxt}>
                <Text style={{ fontWeight: "500" }}>{due.nome}</Text> vence{" "}
                {due.dias
                  ? `em ${due.dias} ${due.dias > 1 ? "dias" : "dia"}`
                  : "hoje"}
              </Text>
            </View>
          )}
          <View style={s.panel}>
            {st.fixas.length === 0 && (
              <View style={s.empty}>
                <Text style={s.emptyTxt}>Sem despesas fixas.</Text>
              </View>
            )}
            {st.fixas.map((f) => (
              <View key={f.id} style={s.it}>
                <View style={[s.circSm, { backgroundColor: t.circ }]}>
                  <Feather name={ICON.fix} size={17} color={t.text} />
                </View>
                <View style={s.itBody}>
                  <Text style={s.itTxt}>{f.nome}</Text>
                  <Text style={s.itSub}>Todo o dia {f.dia}</Text>
                </View>
                <Text style={s.pTxt}>{kz(f.valor)}</Text>
              </View>
            ))}
            <View style={s.row}>
              <View style={s.rowH}>
                <Text style={s.rowTxt}>Total mensal</Text>
                <Text style={s.rowTxt}>{kz(total)}</Text>
              </View>
            </View>
          </View>
          <Pressable style={s.go} onPress={() => go("/novo-item?tipo=fixas")}>
            <Text style={s.goTxt}>{ITEM_FORMS.fixas.botao}</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}
