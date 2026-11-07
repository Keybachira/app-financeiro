import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  A,
  CAT,
  ICON,
  ago,
  balance,
  fdl,
  go,
  kz,
  nextDue,
  pct,
  spentToday,
  sumMovs,
  unreadCount,
  useTheme,
} from "../../data";

export default function Inicio() {
  const { t, s, st } = useTheme();
  const ins = useSafeAreaInsets();
  const m = st.mod;
  const due = m.fixas ? nextDue(st) : null;
  const gasto = spentToday(st);
  const hid = st.hid;
  const u = unreadCount(st);

  const quick: { icon: string; label: string; onPress: () => void }[] = [
    {
      icon: "plus",
      label: "Receita",
      onPress: () => go("/novo-movimento?tipo=r"),
    },
    {
      icon: "minus",
      label: "Despesa",
      onPress: () => go("/novo-movimento?tipo=d"),
    },
    ...(m.metas
      ? [{ icon: "goal", label: "Metas", onPress: () => go("/metas") }]
      : []),
    { icon: "more", label: "Mais", onPress: () => go("/mais") },
  ];

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={[s.content, { paddingTop: ins.top + 20 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* topo */}
      <View style={s.top}>
        <Pressable
          style={s.circ}
          onPress={() => go("/mais")}
          accessibilityLabel="Menu"
        >
          <Feather name={ICON.menu} size={20} color={t.text} />
        </Pressable>
        <View style={s.rt}>
          <Pressable
            style={s.circ}
            onPress={() => go("/notificacoes")}
            accessibilityLabel="Notificações"
          >
            <Feather name={ICON.bell} size={20} color={t.text} />
            {u > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeTxt}>{u}</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            style={s.av}
            onPress={() => go("/ajustes")}
            accessibilityLabel="Perfil"
          >
            <Text style={s.avTxt}>
              {(st.name.trim().charAt(0) || "A").toUpperCase()}
            </Text>
          </Pressable>
        </View>
      </View>

      <Text style={s.h1}>Olá, {st.name}!</Text>
      <Text style={s.sub}>Vamos organizar o teu dinheiro.</Text>

      {/* aviso de conta a vencer */}
      {due && due.dias <= 7 && st.fix && (
        <Pressable style={s.alr} onPress={() => go("/fixas")}>
          <View style={s.alrDot} />
          <Text style={s.alrTxt}>
            <Text style={{ fontWeight: "500" }}>{due.nome}</Text> vence{" "}
            {due.dias
              ? `em ${due.dias} ${due.dias > 1 ? "dias" : "dia"}`
              : "hoje"}
          </Text>
          <Text style={s.link}>›</Text>
        </Pressable>
      )}

      {/* cartões sobrepostos */}
      <View style={{ marginTop: 16 }}>
        {m.salario && (
          <Pressable style={s.sal} onPress={() => go("/movimentos")}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 13,
                  height: 13,
                  borderRadius: 7,
                  backgroundColor: t.av,
                }}
              />
              <View
                style={{
                  width: 14.5,
                  height: 14.5,
                  borderRadius: 8,
                  marginLeft: -5,
                  borderWidth: 1.5,
                  borderColor: t.amb,
                }}
              />
            </View>
            <Text style={s.salTxt}>Salário • 25 Nov</Text>
          </Pressable>
        )}
        <View style={[s.main, m.salario && { marginTop: -47 }]}>
          <Text style={s.mainL}>Saldo disponível</Text>
          <Pressable onPress={A.toggleHid}>
            <Text style={s.big}>{hid ? "••••••" : kz(balance(st))}</Text>
          </Pressable>
          <View style={s.io}>
            <View style={s.ioBox}>
              <Text style={s.ioL}>Receitas</Text>
              <Text style={s.ioB}>
                {hid ? "••••" : kz(sumMovs(st, (x) => x.v > 0))}
              </Text>
            </View>
            <View style={s.ioBox}>
              <Text style={s.ioL}>Despesas</Text>
              <Text style={s.ioB}>
                {hid ? "••••" : kz(-sumMovs(st, (x) => x.v < 0))}
              </Text>
            </View>
          </View>
          {/* recorte do botão */}
          <View style={s.notch} pointerEvents="none">
            <View style={[s.fillet, { left: -24, bottom: 0 }]}>
              <View style={s.filletDisc} />
            </View>
            <View style={[s.fillet, { right: 0, top: -24 }]}>
              <View style={s.filletDisc} />
            </View>
          </View>
        </View>
        <Pressable style={s.add} onPress={() => go("/novo-movimento?tipo=d")}>
          <View style={s.addPlus}>
            <Feather name="plus" size={20} color={t.addp} />
          </View>
          <Text style={s.addTxt}>Registar</Text>
        </Pressable>
      </View>

      {/* ações rápidas */}
      <View style={[s.panel, s.quick, { paddingVertical: 18 }]}>
        {quick.map((q) => (
          <Pressable key={q.label} style={s.q} onPress={q.onPress}>
            <View style={s.circQ}>
              <Feather name={ICON[q.icon]} size={20} color={t.text} />
            </View>
            <Text style={s.qTxt}>{q.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* limite diário */}
      {m.limite && (
        <View style={s.panel}>
          <View style={s.eh}>
            <Text style={s.ehTxt}>Limite diário</Text>
            <Text style={s.pTxt}>{kz(st.lim)}</Text>
          </View>
          <View style={[s.rowH, { marginTop: 4 }]}>
            <Text style={s.rowTxt}>Hoje</Text>
            <Text style={s.rowTxt}>{kz(gasto)}</Text>
          </View>
          <View style={s.bar}>
            <View style={[s.barFill, { width: `${pct(gasto, st.lim)}%` }]} />
          </View>
          <Text style={[s.rowSub, { marginTop: 4 }]}>
            Restam {kz(Math.max(0, st.lim - gasto))}
          </Text>
        </View>
      )}

      {/* movimentos recentes */}
      <View style={s.panel}>
        <View style={s.eh}>
          <Text style={s.ehTxt}>Movimentos recentes</Text>
          <Pressable onPress={() => go("/movimentos")}>
            <Text style={s.link}>Ver tudo</Text>
          </Pressable>
        </View>
        {st.movs.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyTxt}>Ainda sem movimentos.</Text>
            <Pressable
              style={s.emptyBtn}
              onPress={() => go("/novo-movimento?tipo=d")}
            >
              <Text style={s.emptyBtnTxt}>Registar despesa</Text>
            </Pressable>
          </View>
        )}
        {st.movs.slice(0, 4).map((mv) => {
          const c = CAT[mv.c] || CAT.Outros;
          return (
            <Pressable
              key={mv.id}
              style={s.it}
              onPress={() => go(`/novo-movimento?id=${mv.id}`)}
            >
              <View style={[s.circSm, { backgroundColor: c.color + "22" }]}>
                <Feather name={ICON[c.icon]} size={17} color={c.color} />
              </View>
              <View style={s.itBody}>
                <Text style={s.itTxt}>{mv.t}</Text>
                <Text style={s.itSub}>
                  {mv.c} • {fdl(mv.dt)}
                </Text>
              </View>
              <Text style={[s.pTxt, mv.v > 0 ? s.pos : s.neg]}>
                {mv.v > 0 ? "+" : "−"}
                {kz(Math.abs(mv.v))}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
