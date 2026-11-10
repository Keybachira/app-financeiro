import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  A,
  ALERTAS,
  ICON,
  MODULOS,
  Perfil,
  ThemePref,
  go,
  goBack,
  kz,
  pct,
  spentToday,
  useTemaBase,
} from "../data";

const PERFIS_UI: Perfil[] = [
  "Estudante",
  "Trabalhador",
  "Freelancer",
  "Personalizado",
];

export default function Ajustes() {
  const { t, s, st } = useTemaBase();
  const ins = useSafeAreaInsets();
  const [nome, setNome] = useState(st.name);

  const sp = spentToday(st);
  const L = st.lim;
  const lv = sp >= L ? "danger" : sp >= L * 0.8 ? "warn" : "ok";
  const estado =
    lv === "danger"
      ? "Limite ultrapassado"
      : lv === "warn"
        ? "Quase no limite"
        : "Dentro do limite";
  const sw = (v: boolean, on: () => void, label: string) => (
    <Switch
      value={v}
      onValueChange={on}
      accessibilityLabel={label}
      trackColor={{ false: t.ring, true: t.acc }}
      thumbColor="#fff"
    />
  );

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={[s.content, { paddingTop: ins.top + 20 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={s.back}>
        <Pressable style={s.circ} onPress={goBack} accessibilityLabel="Voltar">
          <Feather name={ICON.back} size={20} color={t.text} />
        </Pressable>
        <Text style={s.backTxt}>Ajustes</Text>
      </View>

      {/* perfil */}
      <View
        style={[
          s.panel,
          { flexDirection: "row", alignItems: "center", gap: 16 },
        ]}
      >
        <View style={[s.av, s.avBig]}>
          <Text style={[s.avTxt, { fontSize: 26 }]}>
            {(st.name.trim().charAt(0) || "A").toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <TextInput
            style={{
              fontSize: 20,
              color: t.text,
              paddingVertical: 4,
              padding: 0,
            }}
            value={nome}
            onChangeText={setNome}
            onEndEditing={() => A.setName(nome)}
            maxLength={24}
            accessibilityLabel="O teu nome"
          />
        </View>
      </View>

      {/* perfil de utilização */}
      <View style={s.panel}>
        <Text style={s.ehTxt}>Perfil</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chips}
          style={{ marginTop: 10 }}
        >
          {PERFIS_UI.map((p) => (
            <Pressable
              key={p}
              style={[s.chip, st.prof === p && s.chipOn]}
              onPress={() => A.applyPerfil(p)}
            >
              <Text style={[s.chipTxt, st.prof === p && s.chipTxtOn]}>{p}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* módulos */}
      <View style={s.panel}>
        <Text style={s.ehTxt}>Módulos</Text>
        {MODULOS.map((m) => (
          <View key={m.k} style={s.tg}>
            <View style={{ flex: 1 }}>
              <Text style={s.tgTxt}>{m.t}</Text>
              <Text style={s.tgSub}>{m.d}</Text>
            </View>
            {sw(st.mod[m.k], () => A.toggleMod(m.k), m.t)}
          </View>
        ))}
      </View>

      {/* limite diário e alertas */}
      <View style={s.hs}>
        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: "#ffffff26",
            borderRadius: 99,
            paddingVertical: 3,
            paddingHorizontal: 11,
            marginBottom: 4,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: "500", color: "#fff" }}>
            {estado}
          </Text>
        </View>
        <Text style={s.hsL}>Limite diário de gastos</Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginVertical: 2,
          }}
        >
          <Pressable
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: "#ffffff26",
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={() => A.setLimite(-1000)}
            accessibilityLabel="Diminuir limite"
          >
            <Feather name="minus" size={20} color="#fff" />
          </Pressable>
          <Text
            style={{
              fontSize: 34,
              fontWeight: "500",
              color: "#fff",
              letterSpacing: -0.7,
            }}
          >
            {kz(L).replace(" Kz", "")}{" "}
            <Text style={{ fontSize: 15, opacity: 0.8 }}>Kz</Text>
          </Text>
          <Pressable
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: "#ffffff26",
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={() => A.setLimite(1000)}
            accessibilityLabel="Aumentar limite"
          >
            <Feather name="plus" size={20} color="#fff" />
          </Pressable>
        </View>
        <View style={s.hsPb}>
          <View
            style={[
              s.hsPbI,
              {
                width: `${pct(sp, L)}%`,
                backgroundColor: lv === "danger" ? "#ff7a72" : t.amb,
              },
            ]}
          />
        </View>
        <Text style={[s.hsL, { marginTop: 6 }]}>
          Hoje gastaste {kz(sp)} ·{" "}
          {sp > L ? `passaste ${kz(sp - L)}` : `restam ${kz(L - sp)}`}
        </Text>
      </View>

      <View style={s.panel}>
        <Text style={s.ehTxt}>Alertas de gastos</Text>
        {ALERTAS.map((a) => (
          <View key={a.k} style={s.tg}>
            <View style={{ flex: 1 }}>
              <Text style={s.tgTxt}>{a.t}</Text>
              <Text style={s.tgSub}>{a.d(st)}</Text>
            </View>
            {sw(st[a.k], () => A.toggleFlag(a.k), a.t)}
          </View>
        ))}
        <Pressable
          style={[s.it, { marginTop: 4 }]}
          onPress={() => go("/notificacoes")}
        >
          <View style={[s.circSm, { backgroundColor: t.circ }]}>
            <Feather name={ICON.bell} size={17} color={t.text} />
          </View>
          <Text style={[s.itTxt, s.itBody]}>Ver notificações</Text>
          <Feather name={ICON.chev} size={16} color={t.muted} />
        </Pressable>
      </View>

      {/* aparência */}
      <View style={s.panel}>
        <Text style={[s.ehTxt, { marginBottom: 10 }]}>Aparência</Text>
        <View style={s.seg}>
          {(
            [
              ["light", "Claro"],
              ["dark", "Escuro"],
              ["system", "Sistema"],
            ] as [ThemePref, string][]
          ).map(([k, l]) => {
            const on = st.theme === k;
            return (
              <Pressable
                key={k}
                style={[s.segBtn, on && s.segBtnOn]}
                onPress={() => A.setTheme(k)}
              >
                <Text style={[s.segTxt, on && s.segTxtOn]}>{l}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* segurança */}
      <View style={s.panel}>
        <Text style={s.ehTxt}>Segurança</Text>
        <View style={s.tg}>
          <View style={{ flex: 1 }}>
            <Text style={s.tgTxt}>PIN de acesso</Text>
            <Text style={s.tgSub}>Pede o PIN ao abrir a app</Text>
          </View>
          {/* liga aqui ao teu fluxo real de criação/validação do PIN */}
          {sw(st.pin, () => A.toggleFlag("pin"), "PIN")}
        </View>
      </View>

      <Pressable style={[s.go, s.goGhost]} onPress={() => go("/onboarding")}>
        <Text style={[s.goTxt, { color: t.text }]}>Rever introdução</Text>
      </Pressable>
    </ScrollView>
  );
}
