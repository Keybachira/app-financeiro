import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ICON, go, goBack, kz } from "../data";
import { formatDayMonthPt } from "../src/domain/dates";
import { useInteligencia } from "../src/features/inteligencia/useInteligencia";
import { isExpoGo } from "../src/repos/notificationRuntime";
import { FundoEcra } from "../src/ui/componentes/FundoEcra";
import { Painel } from "../src/ui/componentes/Painel";
import {
  fonts,
  layout,
  useEstilosTema,
  useTema,
  type Cores,
} from "../src/ui/tema";

export default function Inteligencia() {
  const { colors } = useTema();
  const styles = useEstilosTema(makeStyles);
  const ins = useSafeAreaInsets();
  const { result, loading, error, refresh, feedback, busyKey } =
    useInteligencia();

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
            accessibilityLabel="Fechar"
          >
            <Feather name={ICON.x} size={20} color={colors.text} />
          </Pressable>
          <Text style={styles.backTxt}>Inteligência</Text>
          <Pressable
            onPress={() => void refresh()}
            hitSlop={8}
            style={styles.clrBtn}
            accessibilityRole="button"
            accessibilityLabel="Atualizar análise"
          >
            <Text style={styles.clr}>
              {loading ? "A analisar…" : "Atualizar"}
            </Text>
          </Pressable>
        </View>

        {/* avisos (`.alr`) */}
        <View style={styles.alr}>
          <View style={styles.alrDot} />
          <Text style={styles.alrTxt}>
            Padrões calculados no teu dispositivo. As previsões nunca criam
            movimentos sem a tua confirmação.
          </Text>
        </View>

        {isExpoGo() ? (
          <View style={styles.alr}>
            <View style={[styles.alrDot, styles.alrDotMuted]} />
            <Text style={styles.alrTxt}>
              No Expo Go, os lembretes automáticos não são agendados. As
              previsões continuam disponíveis normalmente.
            </Text>
          </View>
        ) : null}

        {error ? (
          <Painel padded={false} style={styles.panel}>
            <Text style={styles.errorTitle}>Não foi possível analisar</Text>
            <Text style={styles.body}>{error}</Text>
            <Pressable
              style={styles.btn}
              onPress={() => void refresh()}
              accessibilityRole="button"
              accessibilityLabel="Tentar novamente"
            >
              <Text style={styles.btnTxt}>Tentar novamente</Text>
            </Pressable>
          </Painel>
        ) : null}

        {loading && result === null ? (
          <View style={styles.empty}>
            <ActivityIndicator color={colors.accent} />
            <Text style={[styles.emptyTxt, styles.mt10]}>
              A procurar padrões nos teus movimentos…
            </Text>
          </View>
        ) : null}

        {result !== null ? (
          <>
            <Painel padded={false} style={styles.panel}>
              <View style={styles.eh}>
                <Text style={styles.ehTxt}>Previsões</Text>
                <Text style={styles.ehSide}>
                  {predictions.length
                    ? `${predictions.length} ${
                        predictions.length === 1 ? "previsão" : "previsões"
                      }`
                    : "Sem previsões"}
                </Text>
              </View>

              {predictions.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyTxt}>
                    Ainda não há padrões suficientes. Regista pelo menos 3
                    movimentos semelhantes e volta a abrir este ecrã.
                  </Text>
                </View>
              ) : null}

              {predictions.map((p) => {
                const busy = busyKey?.startsWith(`${p.key}:`);
                return (
                  <View key={p.id} style={styles.row}>
                    <View style={styles.rowHead}>
                      <View
                        style={[
                          styles.rowDot,
                          {
                            backgroundColor:
                              p.type === "income"
                                ? colors.success
                                : colors.danger,
                          },
                        ]}
                      />
                      <Text style={[styles.rowTxt, styles.rowTxtFlex]} numberOfLines={1}>
                        {p.label}
                      </Text>
                      <Text style={styles.rowSub}>
                        {Math.round(p.confidence * 100)}%
                      </Text>
                    </View>
                    <Text style={[styles.rowSub, styles.mt3]}>
                      {p.type === "income" ? "Receita" : "Despesa"} prevista
                      para {formatDayMonthPt(p.expectedDate)} · ~
                      {kz(p.expectedAmount)}
                    </Text>
                    <View style={styles.rowActions}>
                      <Pressable
                        onPress={() => void feedback(p.key, "confirm")}
                        disabled={busy}
                        hitSlop={6}
                        accessibilityRole="button"
                        accessibilityLabel="Confirmar padrão"
                      >
                        <Text style={styles.link}>Confirmar padrão</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => void feedback(p.key, "reject")}
                        disabled={busy}
                        hitSlop={6}
                        accessibilityRole="button"
                        accessibilityLabel="Ignorar padrão"
                      >
                        <Text style={styles.linkMuted}>Ignorar</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </Painel>

            {missing.length > 0 ? (
              <Painel padded={false} style={styles.panel}>
                <View style={styles.eh}>
                  <Text style={styles.ehTxt}>Movimentos em falta</Text>
                  <Text style={styles.ehSide}>{missing.length}</Text>
                </View>
                {missing.map((m) => {
                  const type =
                    observations.find((o) => o.key === m.key)?.type ??
                    "expense";
                  return (
                    <Pressable
                      key={`${m.key}:${m.expectedDate}`}
                      style={styles.it}
                      onPress={() => go(`/movement/new?type=${type}`)}
                      accessibilityRole="button"
                      accessibilityLabel={m.label}
                    >
                      <View style={styles.itCirc}>
                        <Feather
                          name={ICON.warn}
                          size={17}
                          color={colors.danger}
                        />
                      </View>
                      <View style={styles.itBody}>
                        <Text style={styles.itTxt}>{m.label}</Text>
                        <Text style={styles.itSub}>
                          Esperado em {formatDayMonthPt(m.expectedDate)} · ~
                          {kz(m.expectedAmount)}
                          {m.missedCount > 1
                            ? ` · ${m.missedCount} meses`
                            : ""}
                        </Text>
                      </View>
                      <Feather
                        name={ICON.chev}
                        size={16}
                        color={colors.textMuted}
                      />
                    </Pressable>
                  );
                })}
              </Painel>
            ) : null}

            {anomalies.length > 0 ? (
              <Painel padded={false} style={styles.panel}>
                <View style={styles.eh}>
                  <Text style={styles.ehTxt}>Gastos fora do normal</Text>
                  <Text style={styles.ehSide}>{anomalies.length}</Text>
                </View>
                {anomalies.map((a) => (
                  <Pressable
                    key={a.movementId}
                    style={styles.it}
                    onPress={() => go(`/movement/${a.movementId}`)}
                    accessibilityRole="button"
                    accessibilityLabel={`Ver movimento de ${a.category}`}
                  >
                    <View
                      style={[
                        styles.itCirc,
                        { backgroundColor: colors.danger + "22" },
                      ]}
                    >
                      <Feather
                        name={ICON.warn}
                        size={17}
                        color={colors.danger}
                      />
                    </View>
                    <View style={styles.itBody}>
                      <Text style={styles.itTxt}>{a.category}</Text>
                      <Text style={styles.itSub}>
                        {kz(a.amount)} vs. mediana {kz(a.median)} da categoria
                      </Text>
                    </View>
                    <Feather
                      name={ICON.chev}
                      size={16}
                      color={colors.textMuted}
                    />
                  </Pressable>
                ))}
              </Painel>
            ) : null}

            {observations.length > 0 ? (
              <Painel padded={false} style={styles.panel}>
                <View style={styles.eh}>
                  <Text style={styles.ehTxt}>Padrões detetados</Text>
                  <Text style={styles.ehSide}>{observations.length}</Text>
                </View>
                {observations.map((o) => (
                  <View key={o.key} style={styles.row}>
                    <Text style={styles.rowTxt}>{o.label}</Text>
                    <Text style={[styles.rowSub, styles.mt2]}>
                      {o.cadence === "monthly" ? "Mensal" : "Semanal"} ·{" "}
                      {o.occurrences} ocorrências · ~{kz(o.medianAmount)}
                    </Text>
                  </View>
                ))}
              </Painel>
            ) : null}

            {reminders.length > 0 ? (
              <Painel padded={false} style={styles.panel}>
                <View style={styles.eh}>
                  <Text style={styles.ehTxt}>Lembretes previstos</Text>
                  <Text style={styles.ehSide}>{reminders.length}</Text>
                </View>
                {reminders.map((r) => (
                  <View key={r.id} style={styles.row}>
                    <Text style={styles.rowTxt}>
                      {formatDayMonthPt(r.fireOn)} · {r.title}
                    </Text>
                    <Text style={[styles.rowSub, styles.mt2]}>{r.body}</Text>
                  </View>
                ))}
                <Text style={[styles.rowSub, styles.mt6]}>
                  A entrega depende da permissão de notificações do sistema.
                </Text>
              </Painel>
            ) : null}

            {!loading &&
            predictions.length === 0 &&
            missing.length === 0 &&
            anomalies.length === 0 &&
            observations.length === 0 ? (
              <Painel padded={false} style={styles.panel}>
                <View style={styles.empty}>
                  <Text style={styles.emptyTxt}>
                    Sem alertas por agora. Continua a registar movimentos para a
                    app aprender os teus hábitos.
                  </Text>
                </View>
              </Painel>
            ) : null}
          </>
        ) : null}

        <Text style={styles.note}>
          Análise local · sem envio de dados para servidores
        </Text>
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
    clrBtn: {
      marginLeft: "auto",
    },
    clr: {
      fontFamily: fonts.medium,
      fontSize: 12,
      color: colors.accent,
      padding: 6,
    },

    // `.alr`
    alr: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 14,
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderRadius: 18,
      backgroundColor: colors.bgMid,
    },
    alrDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.accent,
      flexShrink: 0,
    },
    alrDotMuted: {
      backgroundColor: colors.textMuted,
    },
    alrTxt: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 18,
      color: colors.text,
    },

    // `.panel`
    panel: {
      marginTop: 16,
      paddingVertical: 18,
      paddingHorizontal: 14,
    },

    // `.eh`
    eh: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      marginBottom: 6,
    },
    ehTxt: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: colors.text,
    },
    ehSide: {
      fontFamily: fonts.regular,
      fontSize: 11,
      color: colors.textMuted,
    },

    // linhas de texto
    row: {
      paddingVertical: 10,
      paddingHorizontal: 4,
    },
    rowHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    rowDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    rowTxt: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.text,
    },
    rowTxtFlex: {
      flex: 1,
    },
    rowSub: {
      fontFamily: fonts.regular,
      fontSize: 10,
      lineHeight: 15,
      color: colors.textMuted,
    },
    rowActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      marginTop: 8,
    },
    link: {
      fontFamily: fonts.medium,
      fontSize: 12,
      color: colors.accent,
    },
    linkMuted: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
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
      backgroundColor: colors.chipNeutralBg,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    itBody: {
      flex: 1,
      minWidth: 0,
    },
    itTxt: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.text,
    },
    itSub: {
      fontFamily: fonts.regular,
      fontSize: 10,
      lineHeight: 15,
      color: colors.textMuted,
      marginTop: 2,
    },

    // erro + botões
    errorTitle: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: colors.danger,
      marginBottom: 6,
    },
    body: {
      fontFamily: fonts.regular,
      fontSize: 10,
      lineHeight: 15,
      color: colors.textMuted,
    },
    btn: {
      alignSelf: "flex-start",
      marginTop: 12,
      paddingVertical: 9,
      paddingHorizontal: 18,
      borderRadius: 99,
      backgroundColor: colors.accent,
    },
    btnTxt: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.glassText,
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

    note: {
      fontFamily: fonts.regular,
      fontSize: 10,
      color: colors.textMuted,
      textAlign: "center",
      marginTop: 16,
    },

    mt2: { marginTop: 2 },
    mt3: { marginTop: 3 },
    mt6: { marginTop: 6 },
    mt10: { marginTop: 10 },
  });
