import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ICON, go, goBack, kz, pct } from "../data";
import { todayISO } from "../src/domain/dates";
import type { ModuleId, ModuleProfileId } from "../src/domain/modules";
import { useResumoContas } from "../src/features/contas/useContas";
import {
  useAvatarUtilizador,
  useLimiteMensal,
  useNomeUtilizador,
} from "../src/features/definicoes/useDefinicoes";
import {
  usePreferenciasApp,
  type PreferenciaTema,
} from "../src/features/definicoes/usePreferenciasApp";
import { useConfigModulos } from "../src/features/modulos/useConfigModulos";
import { useResumoMes } from "../src/features/movimentos/useResumoMes";
import { useEstadoBloqueio } from "../src/features/seguranca/useEstadoBloqueio";
import {
  getBillNotificationsStatus,
  type BillNotificationStatus,
} from "../src/repos/bills";
import { CartaoDestaque } from "../src/ui/componentes/CartaoDestaque";
import { FundoEcra } from "../src/ui/componentes/FundoEcra";
import { Interruptor } from "../src/ui/componentes/Interruptor";
import { Painel } from "../src/ui/componentes/Painel";
import {
  fonts,
  layout,
  useEstilosTema,
  useTema,
  type Cores,
} from "../src/ui/tema";

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

const TEMAS_UI: [PreferenciaTema, string][] = [
  ["light", "Claro"],
  ["dark", "Escuro"],
  ["system", "Sistema"],
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
  const { colors } = useTema();
  const styles = useEstilosTema(makeStyles);
  const ins = useSafeAreaInsets();
  const { theme, setTheme } = usePreferenciasApp();
  const { name, setName } = useNomeUtilizador();
  const { avatar, setAvatar } = useAvatarUtilizador();
  const { profile, modules, isEnabled, setEnabled, setProfile, save } =
    useConfigModulos();
  const { limit, setLimit } = useLimiteMensal();
  const { summary, refresh: refreshSummary } = useResumoMes(todayISO());
  const { openCount, refresh: refreshBills } = useResumoContas();
  const {
    hasPin,
    enabled: pinEnabled,
    setEnabled: setPinEnabled,
    setPin,
    removePin,
  } = useEstadoBloqueio();

  const [nome, setNome] = useState(name);
  const [notif, setNotif] = useState<BillNotificationStatus | null>(() =>
    getBillNotificationsStatus(),
  );
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPinValue] = useState("");
  const [pin2, setPinConfirm] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinBusy, setPinBusy] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);

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

  const chooseAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permissão necessária",
        "Permite o acesso às fotografias para escolher um avatar.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setAvatar(result.assets[0].uri);
      setAvatarOpen(false);
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

  const inicial = (nome.trim().charAt(0) || "A").toUpperCase();

  return (
    <View style={styles.root}>
      <FundoEcra />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: ins.top + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
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
          <Text style={styles.backTxt}>Ajustes</Text>
        </View>

        {/* perfil (`.pf`) */}
        <Painel padded={false} style={[styles.panel, styles.pf]}>
          <Pressable
            style={styles.avBig}
            onPress={() => setAvatarOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Adicionar avatar"
          >
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avImg} />
            ) : (
              <Text style={styles.avTxt}>{inicial}</Text>
            )}
            <View style={styles.avAdd}>
              <Feather name="plus" size={13} color={colors.glassText} />
            </View>
          </Pressable>
          <View style={styles.pn}>
            <TextInput
              style={styles.nm}
              value={nome}
              onChangeText={setNome}
              onEndEditing={() => setName(nome)}
              maxLength={24}
              accessibilityLabel="O teu nome"
              placeholder="O teu nome"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.pnHint}>Toca na foto para a alterar</Text>
          </View>
        </Painel>

        {/* perfil de utilização */}
        <Painel padded={false} style={styles.panel}>
          <Text style={styles.eh}>Perfil</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cf}
            style={styles.cfMt}
          >
            {PERFIS_UI.map((p) => {
              const on = profile === p.id;
              return (
                <Pressable
                  key={p.id}
                  style={[styles.chip, on && styles.chipOn]}
                  onPress={() => {
                    if (p.id === "custom") {
                      save(modules, "custom");
                    } else {
                      setProfile(p.id);
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={p.label}
                >
                  <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Painel>

        {/* módulos */}
        <Painel padded={false} style={styles.panel}>
          <Text style={styles.eh}>Módulos</Text>
          {MODULOS_UI.map((m) => (
            <View key={m.id} style={styles.tg}>
              <View style={styles.tgBody}>
                <Text style={styles.tgTxt}>{m.label}</Text>
                <Text style={styles.tgSub}>{m.description}</Text>
              </View>
              <Interruptor
                value={isEnabled(m.id)}
                onValueChange={(v) => setEnabled(m.id, v)}
                label={m.label}
                disabled={m.essential}
              />
            </View>
          ))}
        </Painel>

        {/* limite mensal (`.hs`) */}
        <CartaoDestaque>
          <Text style={styles.nst}>{estado}</Text>
          <Text style={styles.hsL}>Limite mensal de gastos</Text>
          <View style={styles.ns}>
            <Pressable
              style={styles.nsb}
              onPress={() => adjustLimit(-1000)}
              accessibilityRole="button"
              accessibilityLabel="Diminuir limite"
            >
              <Feather name="minus" size={20} color={colors.glassText} />
            </Pressable>
            <Text style={styles.nv}>
              {kz(L).replace(" Kz", "")}{" "}
              <Text style={styles.nvSmall}>Kz</Text>
            </Text>
            <Pressable
              style={styles.nsb}
              onPress={() => adjustLimit(1000)}
              accessibilityRole="button"
              accessibilityLabel="Aumentar limite"
            >
              <Feather name="plus" size={20} color={colors.glassText} />
            </Pressable>
          </View>
          <View style={styles.pb}>
            <View
              style={[
                styles.pbFill,
                {
                  width: `${pct(sp, L)}%`,
                  backgroundColor: lv === "danger" ? "#FF7A72" : colors.amber,
                },
              ]}
            />
          </View>
          <Text style={[styles.hsL, styles.mt6]}>
            Gasto do mês {kz(sp)} ·{" "}
            {L <= 0
              ? "define um limite"
              : sp > L
                ? `passaste ${kz(sp - L)}`
                : `restam ${kz(L - sp)}`}
          </Text>
          <Text style={[styles.hsL, styles.mt2]}>
            Hoje gastaste {kz(summary.todaySpent)}
          </Text>
        </CartaoDestaque>

        {/* lembretes de contas */}
        <Painel padded={false} style={styles.panel}>
          <Text style={styles.eh}>Lembretes de contas</Text>
          <View style={styles.tg}>
            <View style={styles.tgBody}>
              <Text style={styles.tgTxt}>
                {openCount}{" "}
                {openCount === 1 ? "conta por pagar" : "contas por pagar"}
              </Text>
              <Text style={styles.tgSub}>{notificationLabel(notif)}</Text>
            </View>
            <View style={styles.links}>
              <Pressable
                onPress={() => go("/notificacoes")}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Abrir centro de notificações"
              >
                <Text style={styles.link}>Centro</Text>
              </Pressable>
              <Pressable
                onPress={() => go("/bill")}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Ver contas fixas"
              >
                <Text style={styles.link}>Ver</Text>
              </Pressable>
            </View>
          </View>
        </Painel>

        {/* aparência */}
        <Painel padded={false} style={styles.panel}>
          <Text style={styles.eh}>Aparência</Text>
          <View style={styles.seg}>
            {TEMAS_UI.map(([k, l]) => {
              const on = theme === k;
              return (
                <Pressable
                  key={k}
                  style={[styles.segBtn, on && styles.segBtnOn]}
                  onPress={() => setTheme(k)}
                  accessibilityRole="button"
                  accessibilityLabel={l}
                >
                  <Text style={[styles.segTxt, on && styles.segTxtOn]}>
                    {l}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Painel>

        {/* segurança */}
        <Painel padded={false} style={styles.panel}>
          <Text style={styles.eh}>Segurança</Text>
          <View style={styles.tg}>
            <View style={styles.tgBody}>
              <Text style={styles.tgTxt}>PIN de acesso</Text>
              <Text style={styles.tgSub}>
                {pinEnabled
                  ? "Pede o PIN ao abrir a app"
                  : hasPin
                    ? "PIN definido, bloqueio desligado"
                    : "Sem PIN definido"}
              </Text>
            </View>
            <Interruptor
              value={pinEnabled}
              onValueChange={togglePin}
              label="PIN de acesso"
            />
          </View>
        </Painel>

        {/* dados e ferramentas */}
        <Painel padded={false} style={styles.panel}>
          <Text style={styles.eh}>Dados</Text>
          <Pressable
            style={styles.it}
            onPress={() => go("/salary")}
            accessibilityRole="button"
            accessibilityLabel="Salário"
          >
            <View style={styles.itCirc}>
              <Feather name={ICON.wallet} size={17} color={colors.text} />
            </View>
            <Text style={styles.itTxt}>Salário</Text>
            <Feather name={ICON.chev} size={16} color={colors.textMuted} />
          </Pressable>
          <Pressable
            style={styles.it}
            onPress={() => go("/backup")}
            accessibilityRole="button"
            accessibilityLabel="Backup e recuperação"
          >
            <View style={styles.itCirc}>
              <Feather name="download" size={17} color={colors.text} />
            </View>
            <Text style={styles.itTxt}>Backup e recuperação</Text>
            <Feather name={ICON.chev} size={16} color={colors.textMuted} />
          </Pressable>
        </Painel>

        <Pressable
          style={styles.goGhost}
          onPress={() => go("/onboarding")}
          accessibilityRole="button"
          accessibilityLabel="Rever introdução"
        >
          <Text style={styles.goGhostTxt}>Rever introdução</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={avatarOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAvatarOpen(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setAvatarOpen(false)}
        >
          <Pressable
            style={styles.modal}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Adicionar avatar</Text>
            <Text style={styles.modalBody}>
              Escolhe uma imagem da galeria para aparecer no teu perfil.
            </Text>
            <Pressable
              onPress={() => void chooseAvatar()}
              style={styles.modalPrimary}
              accessibilityRole="button"
              accessibilityLabel="Escolher da galeria"
            >
              <Text style={styles.modalPrimaryTxt}>Escolher da galeria</Text>
            </Pressable>
            {avatar ? (
              <Pressable
                onPress={() => {
                  setAvatar(null);
                  setAvatarOpen(false);
                }}
                style={styles.modalDanger}
                accessibilityRole="button"
                accessibilityLabel="Remover avatar"
              >
                <Text style={styles.modalDangerTxt}>Remover avatar</Text>
              </Pressable>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={pinOpen}
        transparent
        animationType="fade"
        onRequestClose={closePin}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.backdrop}
        >
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Criar PIN</Text>
            <Text style={styles.modalBody}>
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
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="PIN de 4 dígitos"
              style={styles.pinInput}
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
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Repete o PIN"
              style={styles.pinInput}
            />
            {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}
            <View style={styles.modalRow}>
              <Pressable
                onPress={closePin}
                accessibilityRole="button"
                style={styles.modalGhost}
              >
                <Text style={styles.modalGhostTxt}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  void savePin();
                }}
                disabled={pinBusy}
                accessibilityRole="button"
                style={[
                  styles.modalPrimary,
                  styles.modalPrimaryRow,
                  pinBusy && styles.busy,
                ]}
              >
                <Text style={styles.modalPrimaryTxt}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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

    // `.pf` + `.av.big` + `.pn`
    pf: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    avBig: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.avatarBg,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    avImg: {
      width: "100%",
      height: "100%",
      borderRadius: 36,
    },
    avTxt: {
      fontFamily: fonts.bold,
      fontSize: 26,
      color: colors.avatarText,
    },
    avAdd: {
      position: "absolute",
      right: 0,
      bottom: 0,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: colors.bgMid,
    },
    pn: {
      flex: 1,
      minWidth: 0,
    },
    nm: {
      fontFamily: fonts.regular,
      fontSize: 20,
      color: colors.text,
      paddingVertical: 4,
      paddingHorizontal: 0,
    },
    pnHint: {
      fontFamily: fonts.regular,
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 2,
    },

    // `.eh`
    eh: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: colors.text,
      marginBottom: 6,
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

    // `.tg`
    tg: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 4,
    },
    tgBody: {
      flex: 1,
      minWidth: 0,
    },
    tgTxt: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.text,
    },
    tgSub: {
      fontFamily: fonts.regular,
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 1,
    },

    // `.hs`
    nst: {
      alignSelf: "flex-start",
      fontFamily: fonts.medium,
      fontSize: 10,
      color: colors.glassText,
      backgroundColor: "#ffffff26",
      borderRadius: 99,
      paddingVertical: 3,
      paddingHorizontal: 11,
      marginBottom: 4,
      overflow: "hidden",
    },
    hsL: {
      fontFamily: fonts.regular,
      fontSize: 11,
      color: colors.glassText,
      opacity: 0.85,
    },
    mt6: {
      marginTop: 6,
    },
    mt2: {
      marginTop: 2,
    },
    ns: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginVertical: 2,
    },
    nsb: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: "#ffffff26",
      alignItems: "center",
      justifyContent: "center",
    },
    nv: {
      fontFamily: fonts.medium,
      fontSize: 34,
      lineHeight: 44,
      letterSpacing: -0.7,
      color: colors.glassText,
    },
    nvSmall: {
      fontFamily: fonts.regular,
      fontSize: 15,
      opacity: 0.8,
    },
    pb: {
      height: 6,
      borderRadius: 6,
      backgroundColor: "#ffffff33",
      marginTop: 2,
      overflow: "hidden",
    },
    pbFill: {
      height: "100%",
      borderRadius: 6,
    },

    // links e atalhos
    links: {
      flexDirection: "row",
      gap: 14,
    },
    link: {
      fontFamily: fonts.medium,
      fontSize: 12,
      color: colors.accent,
      paddingVertical: 4,
    },

    // `.seg`
    seg: {
      flexDirection: "row",
      backgroundColor: colors.chipNeutralBg,
      borderRadius: 99,
      padding: 3,
      gap: 3,
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
    itTxt: {
      flex: 1,
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.text,
    },

    // rodapé
    goGhost: {
      height: 48,
      borderRadius: 99,
      borderWidth: 1,
      borderColor: colors.hairline,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 16,
    },
    goGhostTxt: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.text,
    },

    // modais
    backdrop: {
      flex: 1,
      backgroundColor: colors.backdrop,
      alignItems: "center",
      justifyContent: "center",
      padding: 22,
    },
    modal: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: colors.bgMid,
      borderRadius: 24,
      padding: 20,
      gap: 10,
    },
    modalTitle: {
      fontFamily: fonts.medium,
      fontSize: 20,
      color: colors.text,
    },
    modalBody: {
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 19,
      color: colors.textMuted,
    },
    modalPrimary: {
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
    },
    modalPrimaryRow: {
      flex: 1,
      marginTop: 0,
    },
    modalPrimaryTxt: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: colors.glassText,
    },
    modalDanger: {
      alignItems: "center",
      paddingVertical: 10,
    },
    modalDangerTxt: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.danger,
    },
    modalRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 6,
    },
    modalGhost: {
      flex: 1,
      height: 48,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.hairline,
      alignItems: "center",
      justifyContent: "center",
    },
    modalGhostTxt: {
      fontFamily: fonts.regular,
      fontSize: 14,
      color: colors.text,
    },
    pinInput: {
      height: 50,
      borderRadius: 14,
      backgroundColor: colors.chipNeutralBg,
      paddingHorizontal: 14,
      fontFamily: fonts.regular,
      fontSize: 18,
      letterSpacing: 8,
      textAlign: "center",
      color: colors.text,
    },
    pinError: {
      fontFamily: fonts.regular,
      fontSize: 12.5,
      color: colors.danger,
    },
    busy: {
      opacity: 0.6,
    },
  });
