import React, { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DIA, ICON, ago, goBack, kmt, kz, parseISO, pct, stLbl } from "../../data";
import { useTodosMovimentos } from "../../src/features/movimentos/useMovimentos";
import type { MovementRow } from "../../src/repos/movements";
import { visualCategoria } from "../../src/ui/visuaisCategoria";
import { CartaoDestaque } from "../../src/ui/componentes/CartaoDestaque";
import { FundoEcra } from "../../src/ui/componentes/FundoEcra";
import { Painel } from "../../src/ui/componentes/Painel";
import {
  fonts,
  layout,
  useEstilosTema,
  useTema,
  type Cores,
} from "../../src/ui/tema";

// Métricas do gráfico (`.sc svg`, viewBox 340×182).
const CHART_H = 182;
const PLOT_TOP = 44;
const PLOT_BOTTOM = 22;
const PLOT_H = CHART_H - PLOT_TOP - PLOT_BOTTOM; // 116
const BASE = PLOT_TOP + PLOT_H; // 160
const PAD_X = 8;

/** Controlo segmentado (`.seg`). */
function Seg({
  opts,
  val,
  onSel,
  style,
}: {
  opts: [string, string][];
  val: string;
  onSel: (v: string) => void;
  style?: object;
}) {
  const styles = useEstilosTema(makeStyles);

  return (
    <View style={[styles.seg, style]}>
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

export default function Estatisticas() {
  const { colors } = useTema();
  const styles = useEstilosTema(makeStyles);
  const ins = useSafeAreaInsets();
  const { movements, refresh } = useTodosMovimentos();
  const [n, setN] = useState<7 | 30>(7);
  const [k, setK] = useState<"e" | "g">("e");
  const [sel, setSel] = useState<number | null>(null);
  const [w, setW] = useState(340);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const d = useMemo(() => {
    const days = Array.from({ length: n }, (_, i) => ago(n - 1 - i));
    const daySet = new Set(days);
    const E: Record<string, number> = {},
      G: Record<string, number> = {},
      c: Record<string, number> = {};
    days.forEach((x) => {
      E[x] = 0;
      G[x] = 0;
    });
    let best: MovementRow | null = null;
    for (const m of movements) {
      if (!daySet.has(m.date)) continue;
      if (m.type === "expense") {
        E[m.date] += m.amount;
        c[m.category] = (c[m.category] || 0) + m.amount;
      } else {
        G[m.date] += m.amount;
      }
      if (
        (k === "e" ? m.type === "expense" : m.type === "income") &&
        (!best || m.amount > best.amount)
      )
        best = m;
    }
    const ev = days.map((x) => E[x]);
    const gv = days.map((x) => G[x]);
    const te = ev.reduce((a, b) => a + b, 0);
    const tg = gv.reduce((a, b) => a + b, 0);
    const cats = Object.keys(c).sort((a, b) => c[b] - c[a]);
    const vals = k === "g" ? gv : ev;
    const tot = k === "g" ? tg : te;
    const mx = Math.max(...vals, 0);
    return {
      days,
      c,
      cats,
      te,
      tg,
      vals,
      tot,
      mx,
      best,
      act: vals.filter(Boolean).length,
    };
  }, [movements, n, k]);

  const net = d.tg - d.te;
  const pk = d.vals.indexOf(d.mx);
  const cor = k === "g" ? colors.success : colors.danger;
  const ativo = sel ?? (d.tot ? pk : null);
  const leitura =
    sel !== null
      ? `${stLbl(d.days[sel])} · ${kz(d.vals[sel])}`
      : `Total ${kz(d.tot)}`;

  // Geometria do gráfico, calculada a partir da largura real do cartão.
  const slot = (w - PAD_X * 2) / n;
  const bw = Math.max(4, slot * (n <= 7 ? 0.52 : 0.62));
  const barR = Math.min(6, bw / 2);
  const cx = PAD_X + pk * slot + slot / 2;
  const avgY = BASE - (d.tot / n / (d.mx || 1)) * PLOT_H;
  const bubbleTxt = `${stLbl(d.days[pk])} · ${kz(d.mx)}`;
  const bubbleW = Math.max(48, bubbleTxt.length * 5.9 + 22);
  const bubbleX = Math.max(
    4,
    Math.min(w - 4 - bubbleW, cx - bubbleW / 2),
  );
  const peakTop = Math.min(
    BASE - 4,
    BASE - (d.mx / (d.mx || 1)) * PLOT_H,
  );

  return (
    <View style={styles.root}>
      <FundoEcra />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: ins.top + 20 },
        ]}
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
          <Text style={styles.backTxt}>Estatísticas</Text>
        </View>

        <Seg
          opts={[
            ["7", "7 dias"],
            ["30", "30 dias"],
          ]}
          val={String(n)}
          onSel={(v) => {
            setN(v === "30" ? 30 : 7);
            setSel(null);
          }}
          style={styles.segTop}
        />

        {/* balanço (`.hs`) */}
        <CartaoDestaque>
          <Text style={styles.hsL}>Balanço · últimos {n} dias</Text>
          <Text style={styles.hsR}>
            {net < 0 ? "−" : "+"}
            {kz(Math.abs(net))}
          </Text>
          <View style={styles.hsIo}>
            <View style={styles.hsIoBox}>
              <Text style={styles.hsIoLabel}>Ganhos</Text>
              <Text style={styles.hsIoVal}>+{kz(d.tg)}</Text>
            </View>
            <View style={styles.hsIoBox}>
              <Text style={styles.hsIoLabel}>Gastos</Text>
              <Text style={styles.hsIoVal}>−{kz(d.te)}</Text>
            </View>
          </View>
        </CartaoDestaque>

        {/* picos por dia (`.panel.sc`) */}
        <Painel padded={false} style={styles.panel}>
          <Seg
            opts={[
              ["e", "Gastos"],
              ["g", "Ganhos"],
            ]}
            val={k}
            onSel={(v) => {
              setK(v === "g" ? "g" : "e");
              setSel(null);
            }}
            style={styles.segInner}
          />

          {d.tot > 0 ? (
            <>
              <View style={styles.eh}>
                <Text style={styles.ehTitle}>Pico por dia</Text>
                <Text
                  style={[
                    styles.rd,
                    sel !== null && { color: cor, fontFamily: fonts.medium },
                  ]}
                >
                  {leitura}
                </Text>
              </View>

              <View
                style={styles.chart}
                onLayout={(e) => {
                  const next = e.nativeEvent.layout.width;
                  if (next > 0 && Math.abs(next - w) > 0.5) setW(next);
                }}
              >
                {/* etiqueta do máximo */}
                <Text style={[styles.axisTxt, { top: PLOT_TOP - 14, left: PAD_X }]}>
                  {kmt(d.mx)}
                </Text>

                {/* linhas de grelha */}
                <View style={[styles.grid, { top: PLOT_TOP, left: PAD_X }]} />
                <View
                  style={[styles.grid, { top: PLOT_TOP + PLOT_H / 2, left: PAD_X }]}
                />
                <View style={[styles.grid, { top: BASE, left: PAD_X }]} />
                <View style={styles.gridEnd} />

                {/* linha da média */}
                <View style={[styles.avg, { top: avgY, left: PAD_X }]} />
                <Text style={[styles.axisTxt, { top: avgY - 14, right: PAD_X }]}>
                  média {kmt(d.tot / n)}
                </Text>

                {/* barras */}
                <View
                  style={[
                    styles.bars,
                    { top: PLOT_TOP, left: PAD_X, right: PAD_X },
                  ]}
                >
                  {d.vals.map((v, i) => {
                    const h = v
                      ? Math.min(PLOT_H, Math.max(4, (v / d.mx) * PLOT_H))
                      : 3;
                    return (
                      <Pressable
                        key={d.days[i]}
                        style={styles.slot}
                        onPress={() => setSel(sel === i ? null : i)}
                        accessibilityRole="button"
                        accessibilityLabel={`${stLbl(d.days[i])}: ${kz(v)}`}
                      >
                        <View
                          style={{
                            width: v ? bw : Math.max(4, bw),
                            height: h,
                            borderTopLeftRadius: v ? barR : 1.5,
                            borderTopRightRadius: v ? barR : 1.5,
                            backgroundColor: v ? cor : colors.hairline,
                            opacity: v && i !== ativo ? 0.3 : 1,
                          }}
                        />
                      </Pressable>
                    );
                  })}
                </View>

                {/* balão do pico (`.sbb`) */}
                <View
                  pointerEvents="none"
                  style={[
                    styles.bubble,
                    { left: bubbleX, width: bubbleW, backgroundColor: cor },
                  ]}
                >
                  <Text style={styles.bubbleTxt} numberOfLines={1}>
                    {bubbleTxt}
                  </Text>
                </View>
                {/* guia do pico (`.sst`) */}
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: cx - 0.6,
                    top: 26,
                    width: 1.2,
                    height: Math.max(0, peakTop - 30),
                    backgroundColor: cor,
                    opacity: 0.5,
                  }}
                />

                {/* rótulos do eixo */}
                <View
                  style={[
                    styles.xrow,
                    { top: CHART_H - 16, left: PAD_X, right: PAD_X },
                  ]}
                >
                  {d.days.map((x, i) => {
                    const show = n <= 7 || (n - 1 - i) % 6 === 0;
                    const hoje = x === ago(0);
                    return (
                      <Text
                        key={x}
                        numberOfLines={1}
                        style={[
                          styles.xTxt,
                          hoje && styles.xTxtToday,
                        ]}
                      >
                        {show
                          ? n <= 7
                            ? hoje
                              ? "Hoje"
                              : DIA[parseISO(x).getDay()]
                            : parseISO(x).getDate()
                          : ""}
                      </Text>
                    );
                  })}
                </View>
              </View>

              {/* estatísticas (`.stg`) */}
              <View style={styles.stg}>
                <View style={styles.stgBox}>
                  <Text style={styles.stgSmall}>Pico</Text>
                  <Text style={styles.stgVal} numberOfLines={1}>
                    {kz(d.mx)}
                  </Text>
                  <Text style={styles.stgSmall} numberOfLines={1}>
                    {stLbl(d.days[pk])}
                  </Text>
                </View>
                <View style={styles.stgBox}>
                  <Text style={styles.stgSmall}>Média diária</Text>
                  <Text style={styles.stgVal} numberOfLines={1}>
                    {kz(d.tot / n)}
                  </Text>
                  <Text style={styles.stgSmall} numberOfLines={1}>
                    {d.act} {d.act === 1 ? "dia ativo" : "dias ativos"}
                  </Text>
                </View>
                <View style={styles.stgBox}>
                  <Text style={styles.stgSmall}>Maior movimento</Text>
                  <Text style={styles.stgVal} numberOfLines={1}>
                    {d.best ? d.best.note?.trim() || d.best.category : "—"}
                  </Text>
                  <Text style={styles.stgSmall} numberOfLines={1}>
                    {d.best ? kz(d.best.amount) : ""}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTxt}>
                Sem {k === "g" ? "ganhos" : "gastos"} neste período.
              </Text>
            </View>
          )}
        </Painel>

        {/* despesas por categoria */}
        <Painel padded={false} style={styles.panel}>
          <View style={styles.eh}>
            <Text style={styles.ehTitle}>Despesas por categoria</Text>
          </View>
          {d.te > 0 ? (
            d.cats.map((c) => {
              const x = visualCategoria(c);
              return (
                <View key={c} style={styles.cr}>
                  <View
                    style={[
                      styles.crCirc,
                      { backgroundColor: x.color + "22" },
                    ]}
                  >
                    <Feather name={x.icon} size={15} color={x.color} />
                  </View>
                  <View style={styles.crBody}>
                    <View style={styles.rowH}>
                      <Text style={styles.rowTxt}>{c}</Text>
                      <Text style={styles.rowTxt}>{kz(d.c[c])}</Text>
                    </View>
                    <View style={styles.bar}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${pct(d.c[c], d.te)}%`,
                            backgroundColor: x.color,
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={styles.crPct}>{pct(d.c[c], d.te)}%</Text>
                </View>
              );
            })
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTxt}>Sem despesas para analisar.</Text>
            </View>
          )}
        </Painel>
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

    // `.seg`
    seg: {
      flexDirection: "row",
      backgroundColor: colors.chipNeutralBg,
      borderRadius: 99,
      padding: 3,
      gap: 3,
    },
    segTop: {
      marginTop: 14,
    },
    segInner: {
      marginTop: 2,
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

    // `.eh` + `.rd`
    eh: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
      marginTop: 14,
      marginBottom: 6,
    },
    ehTitle: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: colors.text,
    },
    rd: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
    },

    // gráfico
    chart: {
      height: CHART_H,
      marginTop: 8,
    },
    axisTxt: {
      position: "absolute",
      fontFamily: fonts.regular,
      fontSize: 9.5,
      color: colors.textMuted,
    },
    grid: {
      position: "absolute",
      right: PAD_X,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.hairline,
    },
    gridEnd: {
      position: "absolute",
      left: 0,
      right: 0,
      top: BASE,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.hairline,
    },
    avg: {
      position: "absolute",
      right: PAD_X,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.text,
      opacity: 0.45,
    },
    bars: {
      position: "absolute",
      height: PLOT_H,
      flexDirection: "row",
      alignItems: "flex-end",
    },
    slot: {
      flex: 1,
      height: PLOT_H,
      alignItems: "center",
      justifyContent: "flex-end",
    },
    bubble: {
      position: "absolute",
      top: 4,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
    },
    bubbleTxt: {
      fontFamily: fonts.medium,
      fontSize: 10.5,
      color: colors.glassText,
    },
    xrow: {
      position: "absolute",
      flexDirection: "row",
    },
    xTxt: {
      flex: 1,
      textAlign: "center",
      fontFamily: fonts.regular,
      fontSize: 9.5,
      color: colors.textMuted,
    },
    xTxtToday: {
      fontFamily: fonts.bold,
      color: colors.text,
    },

    // `.stg`
    stg: {
      flexDirection: "row",
      gap: 8,
      marginTop: 12,
    },
    stgBox: {
      flex: 1,
      minWidth: 0,
      backgroundColor: colors.chipNeutralBg,
      borderRadius: 16,
      paddingVertical: 9,
      paddingHorizontal: 10,
    },
    stgSmall: {
      fontFamily: fonts.regular,
      fontSize: 10,
      color: colors.textMuted,
    },
    stgVal: {
      fontFamily: fonts.medium,
      fontSize: 12.5,
      color: colors.text,
      marginVertical: 2,
    },

    // `.cr` (linha de categoria)
    cr: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      paddingVertical: 10,
      paddingHorizontal: 4,
    },
    crCirc: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    crBody: {
      flex: 1,
      minWidth: 0,
    },
    crPct: {
      width: 34,
      textAlign: "right",
      fontFamily: fonts.regular,
      fontSize: 11,
      color: colors.textMuted,
    },
    rowH: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
    },
    rowTxt: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.text,
    },
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
  });
