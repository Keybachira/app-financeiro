import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { A, ICON, fdl, go, kz, pct, useTheme } from "../../data";
import { formatDayMonthPt, todayISO } from "../../src/domain/dates";
import { useAllMovements } from "../../src/features/movements/useMovements";
import { useMonthSummary } from "../../src/features/movements/useMonthSummary";
import { useModuleConfig } from "../../src/features/modules/useModuleConfig";
import { useNotificationCenter } from "../../src/features/notifications/useNotificationCenter";
import { useUserName } from "../../src/features/settings/useSettings";
import { billView, listBills } from "../../src/repos/bills";
import { categoryVisual } from "../../src/ui/categoryVisuals";

function billSnapshot() {
  const today = todayISO();

  return {
    today,
    views: listBills()
      .filter((bill) => bill.active === 1)
      .map((bill) => billView(bill, today)),
  };
}

export default function Inicio() {
  const { t, s, st } = useTheme();
  const ins = useSafeAreaInsets();
  const today = todayISO();
  const { summary, refresh: refreshSummary } = useMonthSummary(today);
  const { movements, refresh: refreshMovements } = useAllMovements();
  const { modules } = useModuleConfig();
  const { unreadCount, refresh: refreshNotifications } = useNotificationCenter();
  const { name } = useUserName();
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

  const hidden = st.hid;
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
            {unreadCount > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeTxt}>{unreadCount}</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            style={s.av}
            onPress={() => go("/ajustes")}
            accessibilityLabel="Perfil"
          >
            <Text style={s.avTxt}>{avatarLetter}</Text>
          </Pressable>
        </View>
      </View>

      <Text style={s.h1}>{greeting}</Text>
      <Text style={s.sub}>Vamos organizar o teu dinheiro.</Text>

      {/* aviso de conta a vencer */}
      {modules.fixed_expenses && nextBill && nextBillDays !== null && nextBillDays <= 7 && (
        <Pressable style={s.alr} onPress={() => go("/bill")}>
          <View style={s.alrDot} />
          <Text style={s.alrTxt}>
            <Text style={{ fontWeight: "500" }}>{nextBill.bill.name}</Text>{" "}
            {nextBillDays < 0
              ? "está atrasada"
              : nextBillDays === 0
                ? "vence hoje"
                : `vence em ${nextBillDays} ${nextBillDays > 1 ? "dias" : "dia"}`}
          </Text>
          <Text style={s.link}>›</Text>
        </Pressable>
      )}

      {/* cartões sobrepostos */}
      <View style={{ marginTop: 16 }}>
        {modules.salary_income && salaryDate !== null && (
          <Pressable style={s.sal} onPress={() => go("/salary")}>
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
            <Text style={s.salTxt}>
              Salário • {formatDayMonthPt(salaryDate)}
            </Text>
          </Pressable>
        )}
        <View style={[s.main, showSalary && { marginTop: -47 }]}>
          <Text style={s.mainL}>Saldo disponível</Text>
          <Pressable onPress={A.toggleHid}>
            <Text style={s.big}>
              {hidden ? "••••••" : kz(summary.balance)}
            </Text>
          </Pressable>
          <View style={s.io}>
            <View style={s.ioBox}>
              <Text style={s.ioL}>Receitas</Text>
              <Text style={s.ioB}>
                {hidden ? "••••" : kz(summary.income)}
              </Text>
            </View>
            <View style={s.ioBox}>
              <Text style={s.ioL}>Despesas</Text>
              <Text style={s.ioB}>
                {hidden ? "••••" : kz(summary.expenses)}
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
        <Pressable
          style={s.add}
          onPress={() => go("/movement/new?type=expense")}
        >
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

      {/* limite mensal */}
      {modules.daily_limit && limit !== null && limit > 0 && (
        <View style={s.panel}>
          <View style={s.eh}>
            <Text style={s.ehTxt}>Limite mensal</Text>
            <Text style={s.pTxt}>{kz(limit)}</Text>
          </View>
          <View style={[s.rowH, { marginTop: 4 }]}>
            <Text style={s.rowTxt}>Gasto do mês</Text>
            <Text style={s.rowTxt}>{kz(summary.expenses)}</Text>
          </View>
          <View style={s.bar}>
            <View
              style={[
                s.barFill,
                { width: `${pct(summary.expenses, limit)}%` },
              ]}
            />
          </View>
          <Text style={[s.rowSub, { marginTop: 4 }]}>
            {summary.expenses > limit
              ? `Passaste ${kz(summary.expenses - limit)} do limite`
              : `Restam ${kz(limit - summary.expenses)} no mês`}
          </Text>
          {Number.isFinite(summary.spendable.amount) && (
            <Text style={[s.rowSub, { marginTop: 2 }]}>
              {summary.spendable.overLimit
                ? "Já passaste o limite"
                : `Podes gastar ${kz(summary.spendable.amount)} por dia`}
            </Text>
          )}
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
        {movements.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyTxt}>Ainda sem movimentos.</Text>
            <Pressable
              style={s.emptyBtn}
              onPress={() => go("/movement/new?type=expense")}
            >
              <Text style={s.emptyBtnTxt}>Registar despesa</Text>
            </Pressable>
          </View>
        )}
        {movements.slice(0, 4).map((mv) => {
          const visual = categoryVisual(mv.category);
          const income = mv.type === "income";
          return (
            <Pressable
              key={mv.id}
              style={s.it}
              onPress={() => go(`/movement/${mv.id}`)}
            >
              <View
                style={[s.circSm, { backgroundColor: visual.color + "22" }]}
              >
                <Feather
                  name={visual.icon}
                  size={17}
                  color={visual.color}
                />
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
          );
        })}
      </View>
    </ScrollView>
  );
}
