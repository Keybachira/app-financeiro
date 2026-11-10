import React, { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  DIA,
  ago,
  goBack,
  kmt,
  kz,
  parseISO,
  pct,
  stLbl,
  useTemaBase,
} from "../../data";
import { useTodosMovimentos } from "../../src/features/movimentos/useMovimentos";
import type { MovementRow } from "../../src/repos/movements";
import { visualCategoria } from "../../src/ui/visuaisCategoria";

export default function Estatisticas() {
  const { t, s } = useTemaBase();
  const ins = useSafeAreaInsets();
  const { movements, refresh } = useTodosMovimentos();
  const [n, setN] = useState<7 | 30>(7);
  const [k, setK] = useState<"e" | "g">("e");
  const [sel, setSel] = useState<number | null>(null);

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
  const cor = k === "g" ? t.pos : t.neg;
  const ativo = sel ?? (d.tot ? pk : null);
  const leitura =
    sel !== null
      ? `${stLbl(d.days[sel])} · ${kz(d.vals[sel])}`
      : `Total ${kz(d.tot)}`;
  const H = 118;

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={[s.content, { paddingTop: ins.top + 20 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.back}>
        <Pressable style={s.circ} onPress={goBack} accessibilityLabel="Voltar">
          <Feather name="chevron-left" size={20} color={t.text} />
        </Pressable>
        <Text style={s.backTxt}>Estatísticas</Text>
      </View>

      <View style={[s.seg, { marginTop: 14 }]}>
        {([7, 30] as const).map((x) => (
          <Pressable
            key={x}
            style={[s.segBtn, n === x && s.segBtnOn]}
            onPress={() => {
              setN(x);
              setSel(null);
            }}
          >
            <Text style={[s.segTxt, n === x && s.segTxtOn]}>{x} dias</Text>
          </Pressable>
        ))}
      </View>

      <View style={s.hs}>
        <Text style={s.hsL}>Balanço · últimos {n} dias</Text>
        <Text style={s.hsR}>
          {net < 0 ? "−" : "+"}
          {kz(Math.abs(net))}
        </Text>
        <View style={s.io}>
          <View style={s.ioBox}>
            <Text style={s.ioL}>Ganhos</Text>
            <Text style={s.ioB}>+{kz(d.tg)}</Text>
          </View>
          <View style={s.ioBox}>
            <Text style={s.ioL}>Gastos</Text>
            <Text style={s.ioB}>−{kz(d.te)}</Text>
          </View>
        </View>
      </View>

      <View style={s.panel}>
        <View style={s.seg}>
          {(
            [
              ["e", "Gastos"],
              ["g", "Ganhos"],
            ] as const
          ).map(([key, l]) => (
            <Pressable
              key={key}
              style={[s.segBtn, k === key && { backgroundColor: cor }]}
              onPress={() => {
                setK(key);
                setSel(null);
              }}
            >
              <Text style={[s.segTxt, k === key && s.segTxtOn]}>{l}</Text>
            </Pressable>
          ))}
        </View>

        {d.tot > 0 ? (
          <>
            <View style={[s.eh, { marginTop: 14 }]}>
              <Text style={s.ehTxt}>Pico por dia</Text>
              <Text
                style={{
                  fontSize: 12,
                  color: sel !== null ? cor : t.muted,
                  fontWeight: sel !== null ? "500" : "400",
                }}
              >
                {leitura}
              </Text>
            </View>

            {/* barras */}
            <View
              style={{
                height: H,
                flexDirection: "row",
                alignItems: "flex-end",
                gap: n > 7 ? 2 : 8,
                marginTop: 8,
              }}
            >
              {d.vals.map((v, i) => (
                <Pressable
                  key={d.days[i]}
                  onPress={() => setSel(sel === i ? null : i)}
                  style={{ flex: 1, height: H, justifyContent: "flex-end" }}
                >
                  <View
                    style={{
                      height: v ? Math.max(4, (v / d.mx) * (H - 4)) : 3,
                      borderRadius: n > 7 ? 3 : 6,
                      backgroundColor: v ? cor : t.ring,
                      opacity: v && i !== ativo ? 0.3 : 1,
                    }}
                  />
                </Pressable>
              ))}
            </View>
            <View
              style={{ flexDirection: "row", gap: n > 7 ? 2 : 8, marginTop: 6 }}
            >
              {d.days.map((x, i) => {
                const show = n <= 7 || (n - 1 - i) % 6 === 0;
                const hoje = x === ago(0);
                return (
                  <Text
                    key={x}
                    numberOfLines={1}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      fontSize: 9.5,
                      color: hoje ? t.text : t.muted,
                      fontWeight: hoje ? "600" : "400",
                    }}
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

            <View style={s.stg}>
              <View style={s.stgBox}>
                <Text style={s.itSub}>Pico</Text>
                <Text
                  style={[s.rowTxt, { fontSize: 12.5, marginVertical: 2 }]}
                  numberOfLines={1}
                >
                  {kz(d.mx)}
                </Text>
                <Text style={s.itSub}>{stLbl(d.days[pk])}</Text>
              </View>
              <View style={s.stgBox}>
                <Text style={s.itSub}>Média diária</Text>
                <Text
                  style={[s.rowTxt, { fontSize: 12.5, marginVertical: 2 }]}
                  numberOfLines={1}
                >
                  {kz(d.tot / n)}
                </Text>
                <Text style={s.itSub}>
                  {d.act} {d.act === 1 ? "dia ativo" : "dias ativos"}
                </Text>
              </View>
              <View style={s.stgBox}>
                <Text style={s.itSub}>Maior movimento</Text>
                <Text
                  style={[s.rowTxt, { fontSize: 12.5, marginVertical: 2 }]}
                  numberOfLines={1}
                >
                  {d.best ? d.best.note?.trim() || d.best.category : "—"}
                </Text>
                <Text style={s.itSub}>
                  {d.best ? kz(d.best.amount) : ""}
                </Text>
              </View>
            </View>
            <Text style={[s.rowSub, { marginTop: 8, textAlign: "right" }]}>
              Máx. {kmt(d.mx)}
            </Text>
          </>
        ) : (
          <View style={s.empty}>
            <Text style={s.emptyTxt}>
              Sem {k === "g" ? "ganhos" : "gastos"} neste período.
            </Text>
          </View>
        )}
      </View>

      <View style={s.panel}>
        <Text style={s.ehTxt}>Despesas por categoria</Text>
        {d.te > 0 ? (
          d.cats.map((c) => {
            const x = visualCategoria(c);
            return (
              <View
                key={c}
                style={[
                  s.row,
                  { flexDirection: "row", alignItems: "center", gap: 11 },
                ]}
              >
                <View
                  style={[
                    s.circSm,
                    {
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: x.color + "22",
                    },
                  ]}
                >
                  <Feather name={x.icon} size={15} color={x.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.rowH}>
                    <Text style={s.rowTxt}>{c}</Text>
                    <Text style={s.rowTxt}>{kz(d.c[c])}</Text>
                  </View>
                  <View style={s.bar}>
                    <View
                      style={[
                        s.barFill,
                        {
                          width: `${pct(d.c[c], d.te)}%`,
                          backgroundColor: x.color,
                        },
                      ]}
                    />
                  </View>
                </View>
                <Text
                  style={{
                    fontSize: 11,
                    color: t.muted,
                    width: 34,
                    textAlign: "right",
                  }}
                >
                  {pct(d.c[c], d.te)}%
                </Text>
              </View>
            );
          })
        ) : (
          <View style={s.empty}>
            <Text style={s.emptyTxt}>Sem despesas para analisar.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
