import React, { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
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
} from "../../data";
import { monthKey, todayISO } from "../../src/domain/dates";
import { useTodosMovimentos } from "../../src/features/movimentos/useMovimentos";
import type { MovementRow } from "../../src/repos/movements";
import { visualCategoria } from "../../src/ui/visuaisCategoria";
import { CartaoDestaque } from "../../src/ui/componentes/CartaoDestaque";
import { EntradaAnimada } from "../../src/ui/componentes/EntradaAnimada";
import { FundoEcra } from "../../src/ui/componentes/FundoEcra";
import { Painel } from "../../src/ui/componentes/Painel";
import {
  fonts,
  layout,
  useEstilosTema,
  useTema,
  type Cores,
} from "../../src/ui/tema";

const PERIODOS = [
  { k: "", l: "Tudo" },
  { k: "h", l: "Hoje" },
  { k: "7", l: "7 dias" },
  { k: "m", l: "Este mês" },
];

/** Pastilha de filtro (`.cf button`). */
function Chip({
  on,
  label,
  onPress,
}: {
  on: boolean;
  label: string;
  onPress: () => void;
}) {
  const styles = useEstilosTema(makeStyles);

  return (
    <Pressable
      style={[styles.chip, on && styles.chipOn]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>{label}</Text>
    </Pressable>
  );
}

/** Controlo segmentado (`.seg`). */
function Seg({
  opts,
  val,
  onSel,
}: {
  opts: [string, string][];
  val: string;
  onSel: (v: string) => void;
}) {
  const styles = useEstilosTema(makeStyles);

  return (
    <View style={styles.seg}>
      {opts.map(([k, l]) => (
        <Pressable
          key={k}
          style={[styles.segBtn, val === k && styles.segBtnOn]}
          onPress={() => onSel(k)}
          accessibilityRole="button"
          accessibilityLabel={l}
        >
          <Text style={[styles.segTxt, val === k && styles.segTxtOn]}>
            {l}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function Movimentos() {
  const { colors } = useTema();
  const styles = useEstilosTema(makeStyles);
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

  return (
    <View style={styles.root}>
      <FundoEcra />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: ins.top + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* cabeçalho (`.back`) */}
        <View style={styles.back}>
          <Pressable
            style={styles.backCirc}
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Feather name={ICON.back} size={20} color={colors.text} />
          </Pressable>
          <Text style={styles.backTxt}>Movimentos</Text>
        </View>

        {/* filtros (`.panel` #mf) */}
        <Painel padded={false} style={styles.panel}>
          <View style={styles.srch}>
            <Feather name={ICON.search} size={20} color={colors.textMuted} />
            <TextInput
              style={styles.srchIn}
              value={q}
              onChangeText={setQ}
              placeholder="Pesquisar descrição ou categoria"
              placeholderTextColor={colors.textMuted}
              returnKeyType="search"
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.cfMt}
            contentContainerStyle={styles.cf}
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

          <Pressable
            style={styles.ftg}
            onPress={() => setFo(!fo)}
            accessibilityRole="button"
            accessibilityLabel="Mais filtros"
            accessibilityState={{ expanded: fo }}
          >
            <Feather name={ICON.list} size={16} color={colors.text} />
            <Text style={styles.ftgTxt}>Mais filtros</Text>
            {nFiltros > 0 && (
              <View style={styles.ftgBadge}>
                <Text style={styles.ftgBadgeTxt}>{nFiltros}</Text>
              </View>
            )}
            <Text style={[styles.ftgCh, fo && styles.ftgChOpen]}>›</Text>
          </Pressable>

          {fo && (
            <View>
              <View style={styles.dtr}>
                <Text style={styles.dtrLabel}>Dia</Text>
                <TextInput
                  style={styles.dti}
                  value={dt}
                  onChangeText={(v) => {
                    setDt(v);
                    if (isoValid(v)) setPr("");
                  }}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                />
                {!!dt && (
                  <Pressable
                    onPress={() => setDt("")}
                    accessibilityRole="button"
                    accessibilityLabel="Limpar dia"
                  >
                    <Text style={styles.clr}>Limpar</Text>
                  </Pressable>
                )}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.cfMt}
                contentContainerStyle={styles.cf}
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
        </Painel>

        {movements.length === 0 ? (
          <Painel padded={false} style={styles.panel}>
            <View style={styles.empty}>
              <Text style={styles.emptyTxt}>Ainda sem movimentos.</Text>
              <Pressable
                style={styles.emptyBtn}
                onPress={() => go("/movement/new?type=expense")}
                accessibilityRole="button"
                accessibilityLabel="Registar despesa"
              >
                <Text style={styles.emptyBtnTxt}>Registar despesa</Text>
              </Pressable>
            </View>
          </Painel>
        ) : (
          <>
            {/* resumo do período (`.hs`) */}
            <CartaoDestaque>
              <Text style={styles.hsL}>Saldo do período</Text>
              <Text style={styles.hsR}>
                {net < 0 ? "−" : "+"}
                {kz(Math.abs(net))}
              </Text>
              <Text style={styles.hsL}>
                {lista.length}{" "}
                {lista.length === 1 ? "movimento" : "movimentos"}
                {label ? ` · ${label}` : ""}
              </Text>
              {rec > 0 && (
                <>
                  <View style={styles.hsPb}>
                    <View style={[styles.hsPbFill, { width: `${sp}%` }]} />
                  </View>
                  <Text style={[styles.hsL, styles.hsPbTxt]}>
                    Gastaste {sp}% do que recebeste
                  </Text>
                </>
              )}
              <View style={styles.hsIo}>
                <View style={styles.hsIoBox}>
                  <Text style={styles.hsIoLabel}>Entradas</Text>
                  <Text style={styles.hsIoVal}>+{kz(rec)}</Text>
                </View>
                <View style={styles.hsIoBox}>
                  <Text style={styles.hsIoLabel}>Saídas</Text>
                  <Text style={styles.hsIoVal}>−{kz(des)}</Text>
                </View>
              </View>
            </CartaoDestaque>

            {lista.length === 0 && (
              <Painel padded={false} style={styles.panel}>
                <View style={styles.empty}>
                  <Text style={styles.emptyTxt}>
                    Nenhum movimento encontrado.{"\n"}Tenta outra pesquisa ou
                    outro período.
                  </Text>
                  <Pressable
                    style={styles.emptyBtn}
                    onPress={limpar}
                    accessibilityRole="button"
                    accessibilityLabel="Limpar filtros"
                  >
                    <Text style={styles.emptyBtnTxt}>Limpar filtros</Text>
                  </Pressable>
                </View>
              </Painel>
            )}

            {grupos.map((g, gi) => {
              const isC = gr === "c";
              const cn = `${g.itens.length} ${g.itens.length === 1 ? "movimento" : "movimentos"}`;
              const sub = isC
                ? cn
                : `${DIA[parseISO(g.k).getDay()]} · ${cn}`;
              const share =
                isC && des > 0 ? Math.round((g.desp / des) * 100) : 0;
              const gc = visualCategoria(g.k);

              return (
                <EntradaAnimada
                  key={g.k}
                  variante="revelacao"
                  indice={gi}
                  gatilho={grupos.length}
                >
                  <Painel padded={false} style={styles.panel}>
                    <View style={styles.eh}>
                      <View style={styles.ehLeft}>
                        {isC && (
                          <View
                            style={[
                              styles.groupCirc,
                              { backgroundColor: gc.color + "22" },
                            ]}
                          >
                            <Feather
                              name={gc.icon}
                              size={16}
                              color={gc.color}
                            />
                          </View>
                        )}
                        <View style={styles.ehCol}>
                          <Text style={styles.ehTitle} numberOfLines={1}>
                            {isC ? g.k : fdl(g.k)}
                          </Text>
                          <Text style={styles.ehSub}>{sub}</Text>
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.p,
                          g.total < 0 ? styles.neg : styles.pos,
                        ]}
                      >
                        {g.total < 0 ? "−" : "+"}
                        {kz(Math.abs(g.total))}
                      </Text>
                    </View>

                    {share > 0 && (
                      <>
                        <View style={styles.bar}>
                          <View
                            style={[styles.barFill, { width: `${share}%` }]}
                          />
                        </View>
                        <Text style={styles.gs2}>
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
                            style={styles.it}
                            onPress={() => go(`/movement/${mv.id}`)}
                            accessibilityRole="button"
                            accessibilityLabel={
                              mv.note?.trim() || mv.category
                            }
                          >
                            <View
                              style={[
                                styles.itCirc,
                                { backgroundColor: c.color + "22" },
                              ]}
                            >
                              <Feather
                                name={c.icon}
                                size={17}
                                color={c.color}
                              />
                            </View>
                            <View style={styles.itBody}>
                              <Text style={styles.itTxt} numberOfLines={1}>
                                {mv.note?.trim() || mv.category}
                              </Text>
                              <Text style={styles.itSub} numberOfLines={1}>
                                {mv.category} • {fdl(mv.date)}
                              </Text>
                            </View>
                            <Text
                              style={[
                                styles.p,
                                income ? styles.pos : styles.neg,
                              ]}
                            >
                              {income ? "+" : "−"}
                              {kz(mv.amount)}
                            </Text>
                          </Pressable>
                        </EntradaAnimada>
                      );
                    })}
                  </Painel>
                </EntradaAnimada>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: Cores) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: layout.screenBottom,
    },

    // `.back`
    back: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 4,
    },
    backCirc: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.bgMid,
      alignItems: "center",
      justifyContent: "center",
    },
    backTxt: {
      fontFamily: fonts.medium,
      fontSize: 20,
      color: colors.text,
    },

    // `.panel`
    panel: {
      marginTop: 16,
      paddingVertical: 18,
      paddingHorizontal: 14,
    },

    // `.srch` + `.sin`
    srch: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.chipNeutralBg,
      borderRadius: 99,
      paddingHorizontal: 14,
      height: 46,
    },
    srchIn: {
      flex: 1,
      padding: 0,
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.text,
    },

    // `.cf`
    cf: {
      flexDirection: "row",
      gap: 6,
    },
    cfMt: {
      marginTop: 10,
    },
    chip: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 99,
      backgroundColor: colors.chipNeutralBg,
    },
    chipOn: {
      backgroundColor: colors.accent,
    },
    chipTxt: {
      fontFamily: fonts.regular,
      fontSize: 11,
      color: colors.textMuted,
    },
    chipTxtOn: {
      color: colors.glassText,
    },

    // `.ftg`
    ftg: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 10,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 99,
      backgroundColor: colors.chipNeutralBg,
    },
    ftgTxt: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.text,
    },
    ftgBadge: {
      minWidth: 18,
      height: 18,
      borderRadius: 99,
      paddingHorizontal: 5,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    ftgBadgeTxt: {
      fontFamily: fonts.medium,
      fontSize: 10,
      color: colors.glassText,
    },
    ftgCh: {
      marginLeft: "auto",
      fontFamily: fonts.regular,
      fontSize: 16,
      lineHeight: 16,
      color: colors.textMuted,
    },
    ftgChOpen: {
      transform: [{ rotate: "90deg" }],
    },

    // `.dtr` + `.dti` + `.clr`
    dtr: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 10,
    },
    dtrLabel: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
    },
    dti: {
      flex: 1,
      height: 40,
      borderRadius: 99,
      backgroundColor: colors.chipNeutralBg,
      paddingHorizontal: 14,
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.text,
    },
    clr: {
      fontFamily: fonts.medium,
      fontSize: 12,
      color: colors.accent,
      padding: 6,
    },

    // `.seg`
    seg: {
      flexDirection: "row",
      backgroundColor: colors.chipNeutralBg,
      borderRadius: 99,
      padding: 3,
      gap: 3,
      marginTop: 10,
    },
    segBtn: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 99,
      alignItems: "center",
    },
    segBtnOn: {
      backgroundColor: colors.accent,
    },
    segTxt: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
    },
    segTxtOn: {
      color: colors.glassText,
    },

    // `.hs`
    hsL: {
      fontFamily: fonts.regular,
      fontSize: 11,
      color: colors.glassText,
      opacity: 0.85,
    },
    hsR: {
      fontFamily: fonts.medium,
      fontSize: 30,
      lineHeight: 42,
      letterSpacing: -0.6,
      color: colors.glassText,
    },
    hsPb: {
      height: 6,
      borderRadius: 6,
      backgroundColor: "#ffffff33",
      marginTop: 12,
      overflow: "hidden",
    },
    hsPbFill: {
      height: "100%",
      borderRadius: 6,
      backgroundColor: colors.amber,
    },
    hsPbTxt: {
      marginTop: 6,
    },
    hsIo: {
      flexDirection: "row",
      gap: 10,
      marginTop: 12,
    },
    hsIoBox: {
      flex: 1,
      backgroundColor: "#ffffff22",
      borderRadius: 16,
      paddingVertical: 9,
      paddingHorizontal: 12,
    },
    hsIoLabel: {
      fontFamily: fonts.regular,
      fontSize: 11,
      color: colors.glassText,
    },
    hsIoVal: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: colors.glassText,
      marginTop: 2,
    },

    // `.eh`
    eh: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
      marginBottom: 6,
    },
    ehLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },
    ehCol: {
      flexShrink: 1,
    },
    groupCirc: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    ehTitle: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: colors.text,
    },
    ehSub: {
      fontFamily: fonts.regular,
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 1,
    },

    // `.p`
    p: {
      fontFamily: fonts.medium,
      fontSize: 13,
    },
    neg: {
      color: colors.danger,
    },
    pos: {
      color: colors.success,
    },

    // `.bar` + `.gs2`
    bar: {
      height: 8,
      borderRadius: 8,
      backgroundColor: colors.chipNeutralBg,
      marginTop: 6,
      overflow: "hidden",
    },
    barFill: {
      height: "100%",
      borderRadius: 8,
      backgroundColor: colors.accent,
    },
    gs2: {
      fontFamily: fonts.regular,
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 5,
      marginBottom: 6,
      marginHorizontal: 4,
    },

    // `.it`
    it: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      minHeight: 54,
      paddingVertical: 6,
      paddingHorizontal: 4,
      borderRadius: 14,
    },
    itCirc: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    itBody: {
      flex: 1,
    },
    itTxt: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.text,
    },
    itSub: {
      fontFamily: fonts.regular,
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 1,
    },

    // `.empty`
    empty: {
      alignItems: "center",
      paddingVertical: 26,
      paddingHorizontal: 10,
    },
    emptyTxt: {
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 18,
      color: colors.textMuted,
      textAlign: "center",
    },
    emptyBtn: {
      marginTop: 12,
      paddingVertical: 9,
      paddingHorizontal: 18,
      borderRadius: 99,
      backgroundColor: colors.accent,
    },
    emptyBtnTxt: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.glassText,
    },
  });
