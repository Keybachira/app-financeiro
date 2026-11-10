import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  A,
  CAT,
  CK,
  ICON,
  checkGuard,
  goBack,
  iso,
  isoValid,
  kz,
  num,
  useTemaBase,
} from "../data";

// Params: ?tipo=r|d  (novo)   ·   ?id=<id>  (editar / eliminar)
export default function NovoMovimento() {
  const { t, s, st } = useTemaBase();
  const ins = useSafeAreaInsets();
  const { tipo, id } = useLocalSearchParams<{ tipo?: string; id?: string }>();
  const existente = useMemo(
    () => st.movs.find((m) => m.id === id),
    [st.movs, id],
  );

  const [kind, setKind] = useState<"r" | "d">(
    existente ? (existente.v > 0 ? "r" : "d") : tipo === "r" ? "r" : "d",
  );
  const [valor, setValor] = useState(
    existente ? String(Math.abs(existente.v)).replace(".", ",") : "",
  );
  const [desc, setDesc] = useState(existente?.t ?? "");
  const [cat, setCat] = useState(existente?.c ?? "Outros");
  const [data, setData] = useState(existente?.dt ?? iso(new Date()));
  const [erro, setErro] = useState("");

  const lista = CK[kind];
  const catAtual = lista.includes(cat) ? cat : "Outros";

  const guardar = (confirmado = false) => {
    const v = num(valor);
    if (!(v > 0)) return setErro("Indica um valor");
    if (!isoValid(data)) return setErro("Data inválida (AAAA-MM-DD)");
    const titulo = desc.trim() || (kind === "r" ? "Receita" : "Despesa");

    if (existente) {
      A.updateMov(existente.id, {
        t: titulo,
        c: catAtual,
        v: kind === "r" ? v : -v,
        dt: data,
      });
      return goBack();
    }
    // travão de segurança do limite diário
    const g =
      kind === "d" && data === iso(new Date()) && !confirmado
        ? checkGuard(v)
        : null;
    if (g) {
      return Alert.alert(
        "Vais passar o limite de hoje",
        `Já gastaste ${kz(g.pre)}. Este gasto de ${kz(v)} deixa-te ${kz(g.excede)} acima do limite.`,
        [
          { text: "Não gastar agora", style: "cancel", onPress: goBack },
          {
            text: "Guardar mesmo assim",
            style: "destructive",
            onPress: () => guardar(true),
          },
        ],
      );
    }
    A.addMov({ t: titulo, c: catAtual, v: kind === "r" ? v : -v, dt: data });
    goBack();
  };

  const eliminar = () =>
    Alert.alert("Eliminar movimento", "Esta ação não pode ser desfeita.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => {
          A.removeMov(existente!.id);
          goBack();
        },
      },
    ]);

  return (
    <KeyboardAvoidingView
      style={s.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[s.content, { paddingTop: ins.top + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.back}>
          <Pressable
            style={s.circ}
            onPress={goBack}
            accessibilityLabel="Fechar"
          >
            <Feather name={ICON.x} size={20} color={t.text} />
          </Pressable>
          <Text style={s.backTxt}>
            {existente ? "Editar movimento" : "Novo movimento"}
          </Text>
        </View>

        {id && !existente ? (
          <View style={s.panel}>
            <View style={s.empty}>
              <Text style={s.emptyTxt}>Movimento não encontrado.</Text>
            </View>
          </View>
        ) : (
          <View style={s.panel}>
            <View style={s.seg}>
              {(
                [
                  ["r", "Receita"],
                  ["d", "Despesa"],
                ] as const
              ).map(([k, l]) => (
                <Pressable
                  key={k}
                  style={[s.segBtn, kind === k && s.segBtnOn]}
                  onPress={() => setKind(k)}
                >
                  <Text style={[s.segTxt, kind === k && s.segTxtOn]}>{l}</Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={[s.input, { fontSize: 30 }]}
              value={valor}
              onChangeText={setValor}
              keyboardType="decimal-pad"
              placeholder="0 Kz"
              placeholderTextColor={t.muted}
              autoFocus={!existente}
              accessibilityLabel="Valor em Kz"
            />
            <TextInput
              style={s.input}
              value={desc}
              onChangeText={setDesc}
              placeholder="Descrição (ex.: Supermercado)"
              placeholderTextColor={t.muted}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[s.chips, { marginTop: 12 }]}
            >
              {lista.map((c) => {
                const x = CAT[c] || CAT.Outros;
                const on = catAtual === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setCat(c)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      height: 32,
                      paddingLeft: 10,
                      paddingRight: 12,
                      borderRadius: 99,
                      borderWidth: 1.5,
                      borderColor: on ? x.color : "transparent",
                      backgroundColor: on ? x.color + "1f" : t.circ,
                    }}
                  >
                    <Feather name={ICON[x.icon]} size={14} color={x.color} />
                    <Text
                      style={{ fontSize: 12, fontWeight: "500", color: t.text }}
                    >
                      {c}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <TextInput
              style={s.input}
              value={data}
              onChangeText={setData}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={t.muted}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />

            {!!erro && (
              <Text style={{ color: t.neg, fontSize: 12, marginTop: 10 }}>
                {erro}
              </Text>
            )}

            <Pressable style={s.go} onPress={() => guardar()}>
              <Text style={s.goTxt}>
                {existente ? "Guardar alterações" : "Guardar movimento"}
              </Text>
            </Pressable>
            {existente && (
              <Pressable style={[s.go, s.goGhost]} onPress={eliminar}>
                <Text style={[s.goTxt, { color: t.neg }]}>Eliminar</Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
