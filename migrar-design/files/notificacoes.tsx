import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { A, ICON, NK, go, goBack, ntT, unreadCount, useTemaBase } from "../data";

export default function Notificacoes() {
  const { t, s, st } = useTemaBase();
  const ins = useSafeAreaInsets();
  const u = unreadCount(st);
  const lista = [...st.notifs].sort((a, b) => b.ts - a.ts);

  const fechar = () => {
    A.markAllRead(); // como no protótipo: ao fechar, tudo fica lido
    goBack();
  };

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={[s.content, { paddingTop: ins.top + 20 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.back}>
        <Pressable style={s.circ} onPress={fechar} accessibilityLabel="Fechar">
          <Feather name={ICON.x} size={20} color={t.text} />
        </Pressable>
        <Text style={s.backTxt}>Notificações</Text>
        <Pressable onPress={A.markAllRead}>
          <Text style={{ color: t.acc, fontSize: 12, fontWeight: "500" }}>
            Marcar lidas
          </Text>
        </Pressable>
      </View>

      <Pressable style={s.alr} onPress={() => go("/ajustes")}>
        <View style={[s.alrDot, { backgroundColor: t.acc }]} />
        <Text style={s.alrTxt}>
          <Text style={{ fontWeight: "500" }}>Definições de alertas</Text> ·
          limite e gatilhos
        </Text>
        <Text style={s.link}>›</Text>
      </Pressable>

      <View style={s.panel}>
        <View style={s.eh}>
          <Text style={s.ehTxt}>Recentes</Text>
          <Text style={s.link}>
            {u ? `${u} ${u === 1 ? "nova" : "novas"}` : "Tudo lido"}
          </Text>
        </View>
        {lista.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyTxt}>Sem notificações.</Text>
          </View>
        )}
        {lista.map((n) => {
          const c = NK[n.k].color;
          return (
            <Pressable
              key={n.id}
              style={[s.ni, !n.read && s.niUn]}
              onPress={() => A.toggleRead(n.id)}
            >
              <View
                style={[
                  s.circSm,
                  {
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: c + "22",
                  },
                ]}
              >
                <Feather name={ICON[n.i] ?? ICON.bell} size={18} color={c} />
              </View>
              <View style={s.itBody}>
                <Text style={s.itTxt}>{n.t}</Text>
                <Text style={[s.itSub, { marginTop: 2, lineHeight: 15 }]}>
                  {n.b}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingTop: 2,
                }}
              >
                {!n.read && (
                  <View
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 4,
                      backgroundColor: t.acc,
                      marginRight: 6,
                    }}
                  />
                )}
                <Text style={s.itSub}>{ntT(n.ts)}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
