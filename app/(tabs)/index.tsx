import React, { useCallback, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ICON, fdl, go, kz, pct } from "../../data";
import { formatKzNumber } from "../../src/domain/money";
import { formatDayMonthPt, todayISO } from "../../src/domain/dates";
import { useTodosMovimentos } from "../../src/features/movimentos/useMovimentos";
import { useResumoMes } from "../../src/features/movimentos/useResumoMes";
import { useConfigModulos } from "../../src/features/modulos/useConfigModulos";
import { useCentroNotificacoes } from "../../src/features/notificacoes/useCentroNotificacoes";
import { useAvatarUtilizador, useNomeUtilizador } from "../../src/features/definicoes/useDefinicoes";
import { usePreferenciasApp } from "../../src/features/definicoes/usePreferenciasApp";
import { billView, listBills } from "../../src/repos/bills";
import { visualCategoria } from "../../src/ui/visuaisCategoria";
import { AvisoPush } from "../../src/ui/componentes/AvisoPush";
import { CartaoSaldo } from "../../src/ui/componentes/CartaoSaldo";
import { EntradaAnimada } from "../../src/ui/componentes/EntradaAnimada";
import { FundoEcra } from "../../src/ui/componentes/FundoEcra";
import { Painel } from "../../src/ui/componentes/Painel";
import { Pulso } from "../../src/ui/componentes/Pulso";
import {
  fonts,
  layout,
  radius,
  useEstilosTema,
  useTema,
  type Cores,
} from "../../src/ui/tema";

function billSnapshot() {
  const today = todayISO();

  return {
    today,
    views: listBills()
      .filter((bill) => bill.active === 1)
      .map((bill) => billView(bill, today)),
  };
}

/**
 * Início — a referência visual da app (`migrar-design/ab-finance.html`).
 *
 * Métricas copiadas do protótipo: `h1` 27/34, `.sub` 12, `.stack` 16 de
 * intervalo, `.sal` 100 de altura (o cartão principal sobrepõe-no 47),
 * `.main` 24 de raio, `.panel` 28 e `.notch` 128×56.
 */
export default function Inicio() {
  const { colors } = useTema();
  const styles = useEstilosTema(makeStyles);
  const ins = useSafeAreaInsets();
  const today = todayISO();
  const { summary, refresh: refreshSummary } = useResumoMes(today);
  const { movements, refresh: refreshMovements } = useTodosMovimentos();
  const { modules } = useConfigModulos();
  const { unreadCount, refresh: refreshNotifications } = useCentroNotificacoes();
  const { name } = useNomeUtilizador();
  const { avatar } = useAvatarUtilizador();
  const { hideAmounts: hidden, toggleHideAmounts } = usePreferenciasApp();
  const [bills, setBills] = useState(billSnapshot);

  useFocusEffect(
    useCallback(() => {
      refreshSummary();
      refreshMovements();
      refreshNotifications();
      setBills(billSnapshot());
    }, [refreshNotifications, refreshSummary, refreshMovements]),
  );

  const unpaidBills = bills.views.filter((view) => !view.paidThisMonth);
  const nextBill =
    unpaidBills
      .filter((view) => view.dueDate !== null)
      .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1))[0] ?? null;
  const nextBillDays = nextBill?.daysToDue ?? null;

  const avisoTexto =
    nextBillDays !== null && nextBillDays <= 7
      ? `${nextBill?.bill.name ?? ""} vence ${
          nextBillDays === 0 ? "hoje" : `em ${nextBillDays} ${nextBillDays > 1 ? "dias" : "dia"}`
        }`
      : null;

  const firstName = name.trim();
  const greeting = firstName ? `Olá, ${firstName}!` : "Olá!";
  const avatarLetter = (firstName.charAt(0) || "A").toUpperCase();
  const salaryDate = summary.nextSalary;
  const showSalary = modules.salary_income && salaryDate !== null;
  const limit = summary.limit;

  const quick: { icon: string; label: string; onPress: () => void }[] = [
    {
      icon: "plus",
      label: "Receita",
      onPress: () => go("/movement/new?type=income"),
    },
    {
      icon: "minus",
      label: "Despesa",
      onPress: () => go("/movement/new?type=expense"),
    },
    ...(modules.goals_savings
      ? [{ icon: "goal", label: "Metas", onPress: () => go("/goals") }]
      : []),
    { icon: "more", label: "Mais", onPress: () => go("/mais") },
  ];

  return (
    <View style={styles.root}>
      <FundoEcra />
      {/* Aviso push (`.npush` do protótipo) — mostra quando há fatura a vencer em ≤ 7 dias. */}
      {avisoTexto !== null && modules.fixed_expenses ? (
        <AvisoPush visível={true} onPress={() => go("/bill")}>
          <Text style={{ color: colors.text, fontFamily: fonts.medium, fontSize: 13 }}>
            {avisoTexto}
          </Text>
        </AvisoPush>
      ) : null}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: ins.top + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <EntradaAnimada variante="vista" gatilho="inicio">
          {/* barra do topo: menu, notificações e perfil */}
          <View style={styles.top}>
            <Pressable
              style={styles.circ}
              onPress={() => go("/mais")}
              accessibilityRole="button"
              accessibilityLabel="Menu"
            >
              <Feather name={ICON.menu} size={20} color={colors.text} />
            </Pressable>
            <View style={styles.rt}>
              <Pressable
                style={styles.circ}
                onPress={() => go("/notificacoes")}
                accessibilityRole="button"
                accessibilityLabel="Notificações"
              >
                <Feather name={ICON.bell} size={20} color={colors.text} />
                {unreadCount > 0 ? (
                  <Pulso style={styles.badge}>
                    <Text style={styles.badgeTxt}>{unreadCount}</Text>
                  </Pulso>
                ) : null}
              </Pressable>
              <Pressable
                style={styles.av}
                onPress={() => go("/ajustes")}
                accessibilityRole="button"
                accessibilityLabel="Perfil"
              >
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avImg} />
                ) : (
                  <Text style={styles.avTxt}>{avatarLetter}</Text>
                )}
              </Pressable>
            </View>
          </View>

          <Text style={styles.h1}>{greeting}</Text>
          <Text style={styles.sub}>Vamos organizar o teu dinheiro.</Text>

          {/* aviso de conta a vencer (`.alr`) */}
          {modules.fixed_expenses && nextBill && nextBillDays !== null && nextBillDays <= 7 ? (
            <Pressable
              style={styles.alr}
              onPress={() => go("/bill")}
              accessibilityRole="button"
              accessibilityLabel={`${nextBill.bill.name} a vencer`}
            >
              <View style={styles.alrHalo}>
                <View style={styles.alrDot} />
              </View>
              <Text style={styles.alrTxt} numberOfLines={2}>
                <Text style={styles.alrStrong}>{nextBill.bill.name}</Text>
                {nextBillDays < 0
                  ? " está atrasada"
                  : nextBillDays === 0
                    ? " vence hoje"
                    : ` vence em ${nextBillDays} ${nextBillDays > 1 ? "dias" : "dia"}`}
              </Text>
              <Text style={styles.alrChevron}>›</Text>
            </Pressable>
          ) : null}

          {/* cartões sobrepostos (`.stack`) */}
          <View style={styles.stack}>
            {showSalary && salaryDate !== null ? (
              <Pressable
                style={styles.sal}
                onPress={() => go("/salary")}
                accessibilityRole="button"
                accessibilityLabel="Salário"
              >
                <View style={styles.mc}>
                  <View style={styles.mcDot} />
                  <View style={styles.mcRing} />
                </View>
                <Text style={styles.salTxt}>
                  Salário • {formatDayMonthPt(salaryDate)}
                </Text>
              </Pressable>
            ) : null}
            <CartaoSaldo
              balance={summary.balance}
              income={summary.income}
              expenses={summary.expenses}
              hidden={hidden}
              overlapsSalary={showSalary}
              onToggleHidden={toggleHideAmounts}
              onRegister={() => go("/movement/new?type=expense")}
            />
          </View>

          {/* ações rápidas (`.panel.quick`) */}
          <Painel padded={false} style={styles.quick}>
            {quick.map((item) => (
              <Pressable
                key={item.label}
                style={styles.q}
                onPress={item.onPress}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <View style={styles.qCirc}>
                  <Feather
                    name={ICON[item.icon]}
                    size={20}
                    color={colors.text}
                  />
                </View>
                <Text style={styles.qTxt}>{item.label}</Text>
              </Pressable>
            ))}
          </Painel>

          {/* limite mensal */}
          {modules.daily_limit && limit !== null && limit > 0 ? (
            <Painel padded={false} style={styles.panel}>
              <View style={styles.eh}>
                <Text style={styles.ehTxt}>Limite mensal</Text>
                <Text style={styles.ehStrong}>{kz(limit)}</Text>
              </View>
              <View style={styles.row}>
                <View style={styles.rowH}>
                  <Text style={styles.rowTxt}>Gasto do mês</Text>
                  <Text style={styles.rowTxt}>{kz(summary.expenses)}</Text>
                </View>
                <View style={styles.bar}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${pct(summary.expenses, limit)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.small}>
                  {summary.expenses > limit
                    ? `Passaste ${kz(summary.expenses - limit)} do limite`
                    : `Restam ${kz(limit - summary.expenses)} no mês`}
                </Text>
                {Number.isFinite(summary.spendable.amount) ? (
                  <Text style={styles.small}>
                    {summary.spendable.overLimit
                      ? "Já passaste o limite"
                      : `Podes gastar ${kz(summary.spendable.amount)} por dia`}
                  </Text>
                ) : null}
              </View>
            </Painel>
          ) : null}

          {/* movimentos recentes */}
          <Painel padded={false} style={styles.panel}>
            <View style={styles.eh}>
              <Text style={styles.ehTxt}>Movimentos recentes</Text>
              <Pressable
                onPress={() => go("/movimentos")}
                accessibilityRole="button"
                accessibilityLabel="Ver todos os movimentos"
                hitSlop={8}
              >
                <Text style={styles.ehLink}>Ver tudo</Text>
              </Pressable>
            </View>

            {movements.length === 0 ? (
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
            ) : null}

            {movements.slice(0, 4).map((mv, i) => {
              const visual = visualCategoria(mv.category);
              const income = mv.type === "income";

              return (
                <EntradaAnimada variante="linha" indice={i} gatilho={movements.length}>
                  <Pressable
                    key={mv.id}
                    style={styles.item}
                    onPress={() => go(`/movement/${mv.id}`)}
                    accessibilityRole="button"
                    accessibilityLabel={mv.note?.trim() || mv.category}
                  >
                  <View style={styles.itemCirc}>
                    <Feather
                      name={visual.icon}
                      size={17}
                      color={visual.color}
                    />
                  </View>
                  <View style={styles.itemBody}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {mv.note?.trim() || mv.category}
                    </Text>
                    <Text style={styles.itemMeta} numberOfLines={1}>
                      {mv.category} • {fdl(mv.date)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.itemValue,
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

    // `.top` + `.circ` + `.rt` + `.av`
    top: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    rt: {
      flexDirection: "row",
      gap: 7,
    },
    circ: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.bgMid,
      alignItems: "center",
      justifyContent: "center",
    },
    av: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.avatarBg,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    avImg: {
      width: "100%",
      height: "100%",
    },
    avTxt: {
      fontFamily: fonts.bold,
      fontSize: 16,
      color: colors.avatarText,
    },
    badge: {
      position: "absolute",
      top: -3,
      right: -3,
      minWidth: 19,
      height: 19,
      borderRadius: 10,
      backgroundColor: colors.danger,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 5,
    },
    badgeTxt: {
      fontFamily: fonts.bold,
      fontSize: 10,
      color: colors.toastText,
    },

    // `h1` + `.sub`
    h1: {
      fontFamily: fonts.medium,
      fontSize: 27,
      lineHeight: 34,
      letterSpacing: -0.4,
      color: colors.text,
      marginTop: 16,
    },
    sub: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 3,
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
    alrHalo: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: "rgba(255, 211, 91, 0.27)",
      alignItems: "center",
      justifyContent: "center",
    },
    alrDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.warn,
    },
    alrTxt: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.text,
    },
    alrStrong: {
      fontFamily: fonts.medium,
    },
    alrChevron: {
      fontFamily: fonts.regular,
      fontSize: 14,
      color: colors.textMuted,
    },

    // `.stack` + `.sal`
    stack: {
      marginTop: 16,
    },
    sal: {
      height: 100,
      borderRadius: 24,
      backgroundColor: colors.warn,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingTop: 20,
      paddingLeft: 16,
      paddingRight: 18,
    },
    mc: {
      height: 20,
      flexDirection: "row",
      alignItems: "center",
    },
    mcDot: {
      width: 13,
      height: 13,
      borderRadius: 7,
      backgroundColor: "#111111",
    },
    mcRing: {
      width: 14.5,
      height: 14.5,
      borderRadius: 8,
      marginLeft: -5,
      borderWidth: 1.5,
      borderColor: colors.warn,
    },
    salTxt: {
      fontFamily: fonts.regular,
      fontSize: 14,
      color: "#111111",
      lineHeight: 20,
    },

    // `.panel.quick` + `.q`
    quick: {
      flexDirection: "row",
      marginTop: 16,
      paddingVertical: 18,
      paddingHorizontal: 4,
    },
    q: {
      flex: 1,
      alignItems: "center",
      gap: 8,
    },
    qCirc: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.chipNeutralBg,
      alignItems: "center",
      justifyContent: "center",
    },
    qTxt: {
      fontFamily: fonts.regular,
      fontSize: 11,
      color: colors.text,
    },

    // `.panel` + `.eh`
    panel: {
      marginTop: 16,
      paddingVertical: 18,
      paddingHorizontal: 14,
    },
    eh: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },
    ehTxt: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: colors.text,
    },
    ehStrong: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.text,
    },
    ehLink: {
      fontFamily: fonts.regular,
      fontSize: 11,
      color: colors.textMuted,
    },

    // `.row` + `.h` + `.bar` (limite mensal)
    row: {
      paddingVertical: 10,
      paddingHorizontal: 4,
    },
    rowH: {
      flexDirection: "row",
      justifyContent: "space-between",
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
      backgroundColor: colors.accent,
    },
    small: {
      fontFamily: fonts.regular,
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 6,
    },

    // `.it` (movimentos recentes)
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      minHeight: 54,
      paddingVertical: 6,
      paddingHorizontal: 4,
      borderRadius: 14,
    },
    itemCirc: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.chipNeutralBg,
      alignItems: "center",
      justifyContent: "center",
    },
    itemBody: {
      flex: 1,
    },
    itemTitle: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.text,
    },
    itemMeta: {
      fontFamily: fonts.regular,
      fontSize: 10,
      color: colors.textMuted,
    },
    itemValue: {
      fontFamily: fonts.medium,
      fontSize: 13,
    },
    pos: {
      color: colors.success,
    },
    neg: {
      color: colors.danger,
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
      color: colors.textMuted,
      textAlign: "center",
    },
    emptyBtn: {
      marginTop: 12,
      paddingVertical: 9,
      paddingHorizontal: 18,
      borderRadius: radius.pill,
      backgroundColor: colors.accent,
    },
    emptyBtnTxt: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: "#FFFFFF",
    },
  });
