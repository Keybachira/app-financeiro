import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { A, ICON, ThemePref, go, goBack, kz, pct, useTheme } from "../data";
import { todayISO } from "../src/domain/dates";
import type { ModuleId, ModuleProfileId } from "../src/domain/modules";
import { useBillsSummary } from "../src/features/bills/useBills";
import { useModuleConfig } from "../src/features/modules/useModuleConfig";
import { useMonthSummary } from "../src/features/movements/useMonthSummary";
import { useLockState } from "../src/features/security/useLockState";
import {
  useMonthlyLimit,
  useUserName,
} from "../src/features/settings/useSettings";
import {
  getBillNotificationsStatus,
  type BillNotificationStatus,
} from "../src/repos/bills";

const PERFIS_UI: { id: ModuleProfileId; label: string }[] = [
  { id: "student", label: "Estudante" },
  { id: "worker", label: "Trabalhador" },
  { id: "freelancer", label: "Freelancer" },
  { id: "custom", label: "Personalizado" },
];

const MODULOS_UI: {
  id: ModuleId;
  label: string;
  description: string;
  essential?: boolean;
}[] = [
  {
    id: "movements",
    label: "Movimentos",
    description: "Registo essencial de receitas e despesas.",
    essential: true,
  },
  {
    id: "salary_income",
    label: "Salário e rendimentos",
    description: "Valor, dia e lançamento automático.",
  },
  {
    id: "goals_savings",
    label: "Metas e poupanças",
    description: "Objetivos, depósitos e levantamentos.",
  },
  {
    id: "debts",
    label: "Dívidas",
    description: "Valores a pagar e a receber.",
  },
  {
    id: "projects",
    label: "Projetos",
    description: "Trabalhos e recebimentos.",
  },
  {
    id: "fixed_expenses",
    label: "Despesas fixas",
    description: "Contas mensais e lembretes.",
  },
  {
    id: "daily_limit",
    label: "Limite mensal",
    description: "Controlo do gasto e valor diário.",
  },
];

function notificationLabel(status: BillNotificationStatus | null): string {
  if (!status) {
    return "Ainda sem estado de lembretes";
  }

  switch (status.state) {
    case "scheduled":
      return "Lembretes agendados";
    case "permission_denied":
      return "Permissão de notificações recusada";
    case "unavailable":
      return "Notificações indisponíveis neste build";
    case "error":
      return status.message ?? "Falha ao agendar lembretes";
    default:
      return status.message ?? "Sem lembretes agendados";
  }
}

export default function Ajustes() {
  const { t, s, st } = useTheme();
  const ins = useSafeAreaInsets();
  const { name, setName } = useUserName();
  const { profile, modules, isEnabled, setEnabled, setProfile, save } =
    useModuleConfig();
  const { limit, setLimit } = useMonthlyLimit();
  const { summary, refresh: refreshSummary } = useMonthSummary(todayISO());
  const { openCount, refresh: refreshBills } = useBillsSummary();
  const {
    hasPin,
    enabled: pinEnabled,
    setEnabled: setPinEnabled,
    setPin,
    removePin,
  } = useLockState();

  const [nome, setNome] = useState(name);
  const [notif, setNotif] = useState<BillNotificationStatus | null>(() =>
    getBillNotificationsStatus(),
  );
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPinValue] = useState("");
  const [pin2, setPinConfirm] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinBusy, setPinBusy] = useState(false);

  useEffect(() => {
    setNome(name);
  }, [name]);

  useFocusEffect(
    useCallback(() => {
      refreshSummary();
      refreshBills();
      setNotif(getBillNotificationsStatus());
    }, [refreshSummary, refreshBills]),
  );

  const sp = summary.expenses;
  const L = limit ?? 0;
  const lv = L <= 0 ? "none" : sp >= L ? "danger" : sp >= L * 0.8 ? "warn" : "ok";
  const estado =
    lv === "none"
      ? "Sem limite definido"
      : lv === "danger"
        ? "Limite ultrapassado"
        : lv === "warn"
          ? "Quase no limite"
          : "Dentro do limite";

  const sw = (v: boolean, on: () => void, label: string, disabled = false) => (
    <Switch
      value={v}
      onValueChange={on}
      disabled={disabled}
      accessibilityLabel={label}
      trackColor={{ false: t.ring, true: t.acc }}
      thumbColor="#fff"
    />
  );

  const adjustLimit = (delta: number) => {
    if (limit === null) {
      if (delta > 0) setLimit(2000);
      return;
    }

    setLimit(Math.max(2000, Math.min(500000, limit + delta)));
  };

  const openPin = () => {
    setPinValue("");
    setPinConfirm("");
    setPinError("");
    setPinOpen(true);
  };

  const closePin = () => {
    if (!pinBusy) {
      setPinOpen(false);
    }
  };

  const savePin = async () => {
    if (pinBusy) return;

    if (!/^\d{4}$/.test(pin)) {
      setPinError("O PIN tem de ter 4 dígitos.");
      return;
    }

    if (pin !== pin2) {
      setPinError("Os PIN não coincidem.");
      return;
    }

    setPinBusy(true);
    try {
      await setPin(pin);
      setPinOpen(false);
    } catch {
      setPinError("Não foi possível guardar o PIN.");
    } finally {
      setPinBusy(false);
    }
  };

  const togglePin = (value: boolean) => {
    if (value) {
      if (hasPin) {
        setPinEnabled(true);
      } else {
        openPin();
      }
      return;
    }

    Alert.alert(
      "Desativar PIN",
      "A app deixa de pedir o PIN ao abrir. O PIN guardado é removido.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desativar",
          style: "destructive",
          onPress: () => {
            void removePin();
          },
        },
      ],
    );
  };

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
            {(nome.trim().charAt(0) || "A").toUpperCase()}
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
            onEndEditing={() => setName(nome)}
            maxLength={24}
            accessibilityLabel="O teu nome"
            placeholder="O teu nome"
            placeholderTextColor={t.muted}
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
              key={p.id}
              style={[s.chip, profile === p.id && s.chipOn]}
              onPress={() => {
                if (p.id === "custom") {
                  save(modules, "custom");
                } else {
                  setProfile(p.id);
                }
              }}
            >
              <Text style={[s.chipTxt, profile === p.id && s.chipTxtOn]}>
                {p.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* módulos */}
      <View style={s.panel}>
        <Text style={s.ehTxt}>Módulos</Text>
        {MODULOS_UI.map((m) => {
          const active = isEnabled(m.id);
          return (
            <View key={m.id} style={s.tg}>
              <View style={{ flex: 1 }}>
                <Text style={s.tgTxt}>{m.label}</Text>
                <Text style={s.tgSub}>{m.description}</Text>
              </View>
              {sw(
                active,
                () => setEnabled(m.id, !active),
                m.label,
                m.essential,
              )}
            </View>
          );
        })}
      </View>

      {/* limite mensal */}
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
        <Text style={s.hsL}>Limite mensal de gastos</Text>
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
            onPress={() => adjustLimit(-1000)}
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
            {kz(L).replace(" Kz", "")} {" "}
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
            onPress={() => adjustLimit(1000)}
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
          Gasto do mês {kz(sp)} ·{" "}
          {L <= 0
            ? "define um limite"
            : sp > L
              ? `passaste ${kz(sp - L)}`
              : `restam ${kz(L - sp)}`}
        </Text>
        <Text style={[s.hsL, { marginTop: 2 }]}>
          Hoje gastaste {kz(summary.todaySpent)}
        </Text>
      </View>

      {/* lembretes de contas */}
      <View style={s.panel}>
        <Text style={s.ehTxt}>Lembretes de contas</Text>
        <View style={s.tg}>
          <View style={{ flex: 1 }}>
            <Text style={s.tgTxt}>
              {openCount} {openCount === 1 ? "conta por pagar" : "contas por pagar"}
            </Text>
            <Text style={s.tgSub}>{notificationLabel(notif)}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 14 }}>
            <Pressable
              onPress={() => go("/notificacoes")}
              hitSlop={8}
              accessibilityLabel="Abrir centro de notificações"
            >
              <Text style={[s.link, { color: t.acc }]}>Centro</Text>
            </Pressable>
            <Pressable
              onPress={() => go("/bill")}
              hitSlop={8}
              accessibilityLabel="Ver contas fixas"
            >
              <Text style={[s.link, { color: t.acc }]}>Ver</Text>
            </Pressable>
          </View>
        </View>
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
            <Text style={s.tgSub}>
              {pinEnabled
                ? "Pede o PIN ao abrir a app"
                : hasPin
                  ? "PIN definido, bloqueio desligado"
                  : "Sem PIN definido"}
            </Text>
          </View>
          {sw(pinEnabled, () => togglePin(!pinEnabled), "PIN de acesso")}
        </View>
      </View>

      {/* dados e ferramentas */}
      <View style={s.panel}>
        <Text style={s.ehTxt}>Dados</Text>
        <Pressable style={s.it} onPress={() => go("/salary")}>
          <View style={[s.circSm, { backgroundColor: t.circ }]}>
            <Feather name={ICON.wallet} size={17} color={t.text} />
          </View>
          <Text style={[s.itTxt, s.itBody]}>Salário</Text>
          <Feather name={ICON.chev} size={16} color={t.muted} />
        </Pressable>
        <Pressable style={s.it} onPress={() => go("/backup")}>
          <View style={[s.circSm, { backgroundColor: t.circ }]}>
            <Feather name="download" size={17} color={t.text} />
          </View>
          <Text style={[s.itTxt, s.itBody]}>Backup e recuperação</Text>
          <Feather name={ICON.chev} size={16} color={t.muted} />
        </Pressable>
      </View>

      <Pressable style={[s.go, s.goGhost]} onPress={() => go("/onboarding")}>
        <Text style={[s.goTxt, { color: t.text }]}>Rever introdução</Text>
      </Pressable>

      <Modal
        visible={pinOpen}
        transparent
        animationType="fade"
        onRequestClose={closePin}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,.55)",
            alignItems: "center",
            justifyContent: "center",
            padding: 22,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 420,
              backgroundColor: t.panel,
              borderRadius: 24,
              padding: 20,
              gap: 10,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "600", color: t.text }}>
              Criar PIN
            </Text>
            <Text style={{ fontSize: 13, color: t.muted }}>
              Escolhe 4 dígitos. Vão ser pedidos sempre que abrires a app.
            </Text>
            <TextInput
              value={pin}
              onChangeText={(value) =>
                setPinValue(value.replace(/\D/g, "").slice(0, 4))
              }
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              placeholder="PIN"
              placeholderTextColor={t.muted}
              accessibilityLabel="PIN de 4 dígitos"
              style={{
                backgroundColor: t.circ,
                color: t.text,
                borderRadius: 14,
                height: 50,
                paddingHorizontal: 14,
                fontSize: 18,
                letterSpacing: 8,
                textAlign: "center",
                marginTop: 4,
              }}
            />
            <TextInput
              value={pin2}
              onChangeText={(value) =>
                setPinConfirm(value.replace(/\D/g, "").slice(0, 4))
              }
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              placeholder="Repete o PIN"
              placeholderTextColor={t.muted}
              accessibilityLabel="Repete o PIN"
              style={{
                backgroundColor: t.circ,
                color: t.text,
                borderRadius: 14,
                height: 50,
                paddingHorizontal: 14,
                fontSize: 18,
                letterSpacing: 8,
                textAlign: "center",
              }}
            />
            {pinError ? (
              <Text style={{ fontSize: 12.5, color: t.neg }}>
                {pinError}
              </Text>
            ) : null}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
              <Pressable
                onPress={closePin}
                accessibilityRole="button"
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: t.ring,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 14, color: t.text }}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  void savePin();
                }}
                disabled={pinBusy}
                accessibilityRole="button"
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: t.acc,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pinBusy ? 0.6 : 1,
                }}
              >
                <Text
                  style={{ fontSize: 14, fontWeight: "500", color: "#fff" }}
                >
                  Guardar
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}
