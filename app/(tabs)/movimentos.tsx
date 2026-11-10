import React, { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  DIA,
  ICON,
  ago,
  fdl,
  go,
  goBack,
  isoValid,
  kz,
  nz,
  parseISO,
  useTemaBase,
} from "../../data";
import { monthKey, todayISO } from "../../src/domain/dates";
import { useTodosMovimentos } from "../../src/features/movimentos/useMovimentos";
import type { MovementRow } from "../../src/repos/movements";
import { visualCategoria } from "../../src/ui/visuaisCategoria";
import { EntradaAnimada } from "../../src/ui/componentes/EntradaAnimada";

const PERIODOS = [
  { k: "", l: "Tudo" },
  { k: "h", l: "Hoje" },
  { k: "7", l: "7 dias" },
  { k: "m", l: "Este mês" },
];

export default function Movimentos() {
  const { t, s } = useTemaBase();
  const ins = useSafeAreaInsets();
  const { movements, refresh } = useTodosMovimentos();
  const [q, setQ] = useState("");
  const [pr, setPr] = useState("");
  const [dt, setDt] = useState("");
  const [cat, setCat] = useState("");
  const [tp, setTp] = useState<"" | "r" | "d">("");
  const [gr, setGr] = useState<"d" | "c">("d");
  const [fo, setFo] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const today = todayISO();
  const cats = useMemo(
    () =>
      Array.from(new Set(movements.map((m) => m.category))).sort((a, b) =>
        a.localeCompare(b, "pt"),
      ),
    [movements],
  );
  const nFiltros =
    (dt ? 1 : 0) + (cat ? 1 : 0) + (tp ? 1 : 0) + (gr === "c" ? 1 : 0);

  const lista = useMemo(() => {
    const nq = nz(q.trim());
    const mesAtual = monthKey(today);
    const seteDias = ago(6);

    return movements
      .filter(
        (m) =>
          (!dt || m.date === dt) &&
          (!pr ||
            (pr === "h"
              ? m.date === today
              : pr === "7"
                ? m.date >= seteDias
                : monthKey(m.date) === mesAtual)) &&
          (!cat || m.category === cat) &&
          (!tp || (tp === "r" ? m.type === "income" : m.type === "expense")) &&
          (!nq || nz(`${m.note ?? ""} ${m.category}`).includes(nq)),
      )
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [movements, q, pr, dt, cat, tp, today]);

  let rec = 0,
    des = 0;
  lista.forEach((m) => {
    if (m.type === "income") rec += m.amount;
    else des += m.amount;
  });
  const net = rec - des;
  const sp = rec > 0 ? Math.min(100, Math.round((des / rec) * 100)) : 0;
  const label = [
    pr === "h"
      ? "hoje"
      : pr === "7"
        ? "últimos 7 dias"
        : pr === "m"
          ? "este mês"
          : "",
    dt ? fdl(dt) : "",
    cat,
    tp === "r" ? "receitas" : tp === "d" ? "despesas" : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const grupos = useMemo(() => {
    const G: Record<string, MovementRow[]> = {};
    const ordem: string[] = [];
    lista.forEach((m) => {
      const k = gr === "c" ? m.category : m.date;
      if (!G[k]) {
        G[k] = [];
        ordem.push(k);
      }
      G[k].push(m);
    });
    const tot = (g: MovementRow[]) =>
      g.reduce((a, m) => a + (m.type === "income" ? m.amount : -m.amount), 0);
    if (gr === "c")
      ordem.sort((a, b) => Math.abs(tot(G[b])) - Math.abs(tot(G[a])));
    return ordem.map((k) => ({
      k,
      itens: G[k],
      total: tot(G[k]),
      desp: G[k].reduce(
        (a, m) => a + (m.type === "expense" ? m.amount : 0),
        0,
      ),
    }));
  }, [lista, gr]);

  const limpar = () => {
    setQ("");
    setDt("");
    setCat("");
    setTp("");
    setPr("");
  };

  const Chip = ({
    on,
    label: l,
    onPress,
  }: {
    on: boolean;
    label: string;
    onPress: () => void;
  }) => (
    <Pressable style={[s.chip, on && s.chipOn]} onPress={onPress}>
      <Text style={[s.chipTxt, on && s.chipTxtOn]}>{l}</Text>
    </Pressable>
  );
  const Seg = ({
    opts,
    val,
    onSel,
  }: {
    opts: [string, string][];
    val: string;
    onSel: (v: string) => void;
  }) => (
    <View style={[s.seg, { marginTop: 10 }]}>
      {opts.map(([k, l]) => (
        <Pressable
          key={k}
          style={[s.segBtn, val === k && s.segBtnOn]}
          onPress={() => onSel(k)}
        >
          <Text style={[s.segTxt, val === k && s.segTxtOn]}>{l}</Text>
        </Pressable>
      ))}
    </View>
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
        <Text style={s.backTxt}>Movimentos</Text>
      </View>

      {/* filtros */}
      <View style={s.panel}>
        <View style={s.srch}>
          <Feather name={ICON.search} size={20} color={t.muted} />
          <TextInput
            style={s.srchIn}
            value={q}
            onChangeText={setQ}
            placeholder="Pesquisar descrição ou categoria"
            placeholderTextColor={t.muted}
            returnKeyType="search"
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chips}
          style={{ marginTop: 10 }}
        >
          {PERIODOS.map((p) => (
            <Chip
              key={p.k}
              on={pr === p.k}
              label={p.l}
              onPress={() => {
                setPr(p.k);
                setDt("");
              }}
            />
          ))}
        </ScrollView>
        <Pressable style={s.ftg} onPress={() => setFo(!fo)}>
          <Feather name={ICON.list} size={16} color={t.text} />
          <Text style={{ fontSize: 12, color: t.text }}>Mais filtros</Text>
          {nFiltros > 0 && (
            <View style={s.ftgB}>
              <Text style={s.badgeTxt}>{nFiltros}</Text>
            </View>
          )}
          <Feather
            name={fo ? "chevron-down" : "chevron-right"}
            size={16}
            color={t.muted}
            style={{ marginLeft: "auto" }}
          />
        </Pressable>
        {fo && (
          <View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginTop: 10,
              }}
            >
              <Text style={{ fontSize: 12, color: t.muted }}>Dia</Text>
              <TextInput
                style={{
                  flex: 1,
                  backgroundColor: t.circ,
                  color: t.text,
                  borderRadius: 99,
                  height: 40,
                  paddingHorizontal: 14,
                  fontSize: 13,
                }}
                value={dt}
                onChangeText={(v) => {
                  setDt(v);
                  if (isoValid(v)) setPr("");
                }}
                placeholder="AAAA-MM-DD"
                placeholderTextColor={t.muted}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
              />
              {!!dt && (
                <Pressable onPress={() => setDt("")}>
                  <Text
                    style={{ color: t.acc, fontSize: 12, fontWeight: "500" }}
                  >
                    Limpar
                  </Text>
                </Pressable>
              )}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.chips}
              style={{ marginTop: 10 }}
            >
              <Chip on={!cat} label="Todas" onPress={() => setCat("")} />
              {cats.map((c) => (
                <Chip
                  key={c}
                  on={cat === c}
                  label={c}
                  onPress={() => setCat(c)}
                />
              ))}
            </ScrollView>
            <Seg
              opts={[
                ["", "Todos"],
                ["r", "Receitas"],
                ["d", "Despesas"],
              ]}
              val={tp}
              onSel={(v) => setTp(v as "" | "r" | "d")}
            />
            <Seg
              opts={[
                ["d", "Por data"],
                ["c", "Por categoria"],
              ]}
              val={gr}
              onSel={(v) => setGr(v as "d" | "c")}
            />
          </View>
        )}
      </View>

      {movements.length === 0 ? (
        <View style={s.panel}>
          <View style={s.empty}>
            <Text style={s.emptyTxt}>Ainda sem movimentos.</Text>
            <Pressable
              style={s.emptyBtn}
              onPress={() => go("/movement/new?type=expense")}
            >
              <Text style={s.emptyBtnTxt}>Registar despesa</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <>
          {/* resumo do período */}
          <View style={s.hs}>
            <Text style={s.hsL}>Saldo do período</Text>
            <Text style={s.hsR}>
              {net < 0 ? "−" : "+"}
              {kz(Math.abs(net))}
            </Text>
            <Text style={s.hsL}>
              {lista.length} {lista.length === 1 ? "movimento" : "movimentos"}
              {label ? ` · ${label}` : ""}
            </Text>
            {rec > 0 && (
              <>
                <View style={s.hsPb}>
                  <View style={[s.hsPbI, { width: `${sp}%` }]} />
                </View>
                <Text style={[s.hsL, { marginTop: 6 }]}>
                  Gastaste {sp}% do que recebeste
                </Text>
              </>
            )}
            <View style={s.io}>
              <View style={s.ioBox}>
                <Text style={s.ioL}>Entradas</Text>
                <Text style={s.ioB}>+{kz(rec)}</Text>
              </View>
              <View style={s.ioBox}>
                <Text style={s.ioL}>Saídas</Text>
                <Text style={s.ioB}>−{kz(des)}</Text>
              </View>
            </View>
          </View>

          {lista.length === 0 && (
            <View style={s.panel}>
              <View style={s.empty}>
                <Text style={s.emptyTxt}>
                  Nenhum movimento encontrado.{"\n"}Tenta outra pesquisa ou
                  outro período.
                </Text>
                <Pressable style={s.emptyBtn} onPress={limpar}>
                  <Text style={s.emptyBtnTxt}>Limpar filtros</Text>
                </Pressable>
              </View>
            </View>
          )}

          {grupos.map((g, gi) => {
            const isC = gr === "c";
            const cn = `${g.itens.length} ${g.itens.length === 1 ? "movimento" : "movimentos"}`;
            const sub = isC ? cn : `${DIA[parseISO(g.k).getDay()]} · ${cn}`;
            const share = isC && des > 0 ? Math.round((g.desp / des) * 100) : 0;
            const gc = visualCategoria(g.k);
            return (
              <EntradaAnimada
                key={g.k}
                variante="revelacao"
                indice={gi}
                gatilho={grupos.length}
              >
                <View style={s.panel}>
                <View style={s.eh}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    {isC && (
                      <View
                        style={[s.circSm, { backgroundColor: gc.color + "22" }]}
                      >
                        <Feather name={gc.icon} size={17} color={gc.color} />
                      </View>
                    )}
                    <View>
                      <Text style={s.ehTxt}>{isC ? g.k : fdl(g.k)}</Text>
                      <Text style={s.gs}>{sub}</Text>
                    </View>
                  </View>
                  <Text style={[s.pTxt, g.total < 0 ? s.neg : s.pos]}>
                    {g.total < 0 ? "−" : "+"}
                    {kz(Math.abs(g.total))}
                  </Text>
                </View>
                {share > 0 && (
                  <>
                    <View style={s.bar}>
                      <View style={[s.barFill, { width: `${share}%` }]} />
                    </View>
                    <Text
                      style={[
                        s.rowSub,
                        { marginVertical: 5, marginHorizontal: 4 },
                      ]}
                    >
                      {share}% das despesas do período
                    </Text>
                  </>
                )}
                {g.itens.map((mv, mi) => {
                  const c = visualCategoria(mv.category);
                  const income = mv.type === "income";
                  return (
                    <EntradaAnimada
                      key={mv.id}
                      variante="linha"
                      indice={mi}
                      gatilho={g.itens.length}
                    >
                      <Pressable
                        style={s.it}
                      onPress={() => go(`/movement/${mv.id}`)}
                    >
                      <View
                        style={[s.circSm, { backgroundColor: c.color + "22" }]}
                      >
                        <Feather name={c.icon} size={17} color={c.color} />
                      </View>
                      <View style={s.itBody}>
                        <Text style={s.itTxt} numberOfLines={1}>
                          {mv.note?.trim() || mv.category}
                        </Text>
                        <Text style={s.itSub}>
                          {mv.category} • {fdl(mv.date)}
                        </Text>
                      </View>
                      <Text style={[s.pTxt, income ? s.pos : s.neg]}>
                        {income ? "+" : "−"}
                        {kz(mv.amount)}
                      </Text>
                    </Pressable>
                    </EntradaAnimada>
                  );
                })}
              </View>
                </EntradaAnimada>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

