import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ICON, go, goBack, kz, useTheme } from "../data";
import { formatDayMonthPt } from "../src/domain/dates";
import { useIntelligence } from "../src/features/intelligence/useIntelligence";
import { isExpoGo } from "../src/repos/notificationRuntime";

export default function Inteligencia() {
  const { t, s } = useTheme();
  const ins = useSafeAreaInsets();
  const { result, loading, error, refresh, feedback, busyKey } =
    useIntelligence();

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const predictions = result?.predictions ?? [];
  const missing = result?.missing ?? [];
  const anomalies = result?.anomalies ?? [];
  const observations = result?.observations ?? [];
  const reminders = result?.reminders ?? [];

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={[s.content, { paddingTop: ins.top + 20 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.back}>
        <Pressable style={s.circ} onPress={goBack} accessibilityLabel="Fechar">
          <Feather name={ICON.x} size={20} color={t.text} />
        </Pressable>
        <Text style={s.backTxt}>Inteligência</Text>
        <Pressable onPress={() => void refresh()} hitSlop={8}>
          <Text style={{ color: t.acc, fontSize: 12, fontWeight: "500" }}>
            {loading ? "A analisar…" : "Atualizar"}
          </Text>
        </Pressable>
      </View>

      <View style={s.alr}>
        <View style={[s.alrDot, { backgroundColor: t.acc }]} />
        <Text style={s.alrTxt}>
          Padrões calculados no teu dispositivo. As previsões nunca criam
          movimentos sem a tua confirmação.
        </Text>
      </View>

      {isExpoGo() && (
        <View style={s.alr}>
          <View style={[s.alrDot, { backgroundColor: t.muted }]} />
          <Text style={s.alrTxt}>
            No Expo Go, os lembretes automáticos não são agendados. As
            previsões continuam disponíveis normalmente.
          </Text>
        </View>
      )}

      {error && (
        <View style={s.panel}>
          <Text style={[s.ehTxt, { color: t.neg }]}>
            Não foi possível analisar
          </Text>
          <Text style={[s.tgSub, { marginTop: 6, lineHeight: 16 }]}>
            {error}
          </Text>
          <Pressable
            style={[s.emptyBtn, { alignSelf: "flex-start" }]}
            onPress={() => void refresh()}
          >
            <Text style={s.emptyBtnTxt}>Tentar novamente</Text>
          </Pressable>
        </View>
      )}

      {loading && result === null && (
        <View style={s.empty}>
          <ActivityIndicator color={t.acc} />
          <Text style={[s.emptyTxt, { marginTop: 10 }]}>
            A procurar padrões nos teus movimentos…
          </Text>
        </View>
      )}

      {result !== null && (
        <>
          <View style={s.panel}>
            <View style={s.eh}>
              <Text style={s.ehTxt}>Previsões</Text>
              <Text style={s.link}>
                {predictions.length
                  ? `${predictions.length} ${
                      predictions.length === 1 ? "previsão" : "previsões"
                    }`
                  : "Sem previsões"}
              </Text>
            </View>

            {predictions.length === 0 && (
              <View style={s.empty}>
                <Text style={s.emptyTxt}>
                  Ainda não há padrões suficientes. Regista pelo menos 3
                  movimentos semelhantes e volta a abrir este ecrã.
                </Text>
              </View>
            )}

            {predictions.map((p) => {
              const busy = busyKey?.startsWith(`${p.key}:`);
              return (
                <View key={p.id} style={[s.row, { borderTopWidth: 1, borderTopColor: t.ring }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: p.type === "income" ? t.pos : t.neg,
                      }}
                    />
                    <Text style={[s.rowTxt, { flex: 1 }]} numberOfLines={1}>
                      {p.label}
                    </Text>
                    <Text style={s.rowSub}>{Math.round(p.confidence * 100)}%</Text>
                  </View>
                  <Text style={[s.rowSub, { marginTop: 3 }]}>
                    {p.type === "income" ? "Receita" : "Despesa"} prevista para{" "}
                    {formatDayMonthPt(p.expectedDate)} · ~{kz(p.expectedAmount)}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16,
                      marginTop: 8,
                    }}
                  >
                    <Pressable
                      onPress={() => void feedback(p.key, "confirm")}
                      disabled={busy}
                      hitSlop={6}
                    >
                      <Text style={{ color: t.acc, fontSize: 12, fontWeight: "500" }}>
                        Confirmar padrão
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => void feedback(p.key, "reject")}
                      disabled={busy}
                      hitSlop={6}
                    >
                      <Text style={{ color: t.muted, fontSize: 12 }}>
                        Ignorar
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>

          {missing.length > 0 && (
            <View style={s.panel}>
              <View style={s.eh}>
                <Text style={s.ehTxt}>Movimentos em falta</Text>
                <Text style={s.link}>{missing.length}</Text>
              </View>
              {missing.map((m) => {
                const type =
                  observations.find((o) => o.key === m.key)?.type ?? "expense";
                return (
                <Pressable
                  key={`${m.key}:${m.expectedDate}`}
                  style={s.it}
                  onPress={() => go(`/movement/new?type=${type}`)}
                >
                  <View style={[s.circSm, { backgroundColor: t.circ }]}>
                    <Feather name={ICON.warn} size={17} color={t.neg} />
                  </View>
                  <View style={s.itBody}>
                    <Text style={s.itTxt}>{m.label}</Text>
                    <Text style={[s.itSub, { lineHeight: 15, marginTop: 2 }]}>
                      Esperado em {formatDayMonthPt(m.expectedDate)} · ~
                      {kz(m.expectedAmount)}
                      {m.missedCount > 1 ? ` · ${m.missedCount} meses` : ""}
                    </Text>
                  </View>
                  <Feather name={ICON.chev} size={16} color={t.muted} />
                </Pressable>
                );
              })}
            </View>
          )}

          {anomalies.length > 0 && (
            <View style={s.panel}>
              <View style={s.eh}>
                <Text style={s.ehTxt}>Gastos fora do normal</Text>
                <Text style={s.link}>{anomalies.length}</Text>
              </View>
              {anomalies.map((a) => (
                <Pressable
                  key={a.movementId}
                  style={s.it}
                  onPress={() => go(`/movement/${a.movementId}`)}
                >
                  <View style={[s.circSm, { backgroundColor: t.neg + "22" }]}>
                    <Feather name={ICON.warn} size={17} color={t.neg} />
                  </View>
                  <View style={s.itBody}>
                    <Text style={s.itTxt}>{a.category}</Text>
                    <Text style={[s.itSub, { lineHeight: 15, marginTop: 2 }]}>
                      {kz(a.amount)} vs. mediana {kz(a.median)} da categoria
                    </Text>
                  </View>
                  <Feather name={ICON.chev} size={16} color={t.muted} />
                </Pressable>
              ))}
            </View>
          )}

          {observations.length > 0 && (
            <View style={s.panel}>
              <View style={s.eh}>
                <Text style={s.ehTxt}>Padrões detetados</Text>
                <Text style={s.link}>{observations.length}</Text>
              </View>
              {observations.map((o) => (
                <View key={o.key} style={s.row}>
                  <Text style={s.rowTxt}>{o.label}</Text>
                  <Text style={[s.rowSub, { marginTop: 2 }]}>
                    {o.cadence === "monthly" ? "Mensal" : "Semanal"} ·{" "}
                    {o.occurrences} ocorrências · ~{kz(o.medianAmount)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {reminders.length > 0 && (
            <View style={s.panel}>
              <View style={s.eh}>
                <Text style={s.ehTxt}>Lembretes previstos</Text>
                <Text style={s.link}>{reminders.length}</Text>
              </View>
              {reminders.map((r) => (
                <View key={r.id} style={s.row}>
                  <Text style={s.rowTxt}>
                    {formatDayMonthPt(r.fireOn)} · {r.title}
                  </Text>
                  <Text style={[s.rowSub, { marginTop: 2, lineHeight: 15 }]}>
                    {r.body}
                  </Text>
                </View>
              ))}
              <Text style={[s.rowSub, { marginTop: 6 }]}>
                A entrega depende da permissão de notificações do sistema.
              </Text>
            </View>
          )}

          {!loading &&
            predictions.length === 0 &&
            missing.length === 0 &&
            anomalies.length === 0 &&
            observations.length === 0 && (
              <View style={s.panel}>
                <Text style={s.emptyTxt}>
                  Sem alertas por agora. Continua a registar movimentos para a
                  app aprender os teus hábitos.
                </Text>
              </View>
            )}
        </>
      )}

      <Text style={s.note}>
        Análise local · sem envio de dados para servidores
      </Text>
    </ScrollView>
  );
}
