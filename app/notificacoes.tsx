import React, { useCallback, useState, type ComponentProps } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ICON, go, goBack } from "../data";
import { addDays, formatDayMonthPt, todayISO } from "../src/domain/dates";
import { EntradaAnimada } from "../src/ui/componentes/EntradaAnimada";
import { FundoEcra } from "../src/ui/componentes/FundoEcra";
import { Painel } from "../src/ui/componentes/Painel";
import {
  getBillNotificationsStatus,
  type BillNotificationStatus,
} from "../src/repos/bills";
import { isExpoGo } from "../src/repos/notificationRuntime";
import { enviarNotificacaoTeste } from "../src/features/notificacoes/acoesNotificacao";
import {
  useCentroNotificacoes,
  type NotificacaoApp,
  type TipoNotificacaoApp,
} from "../src/features/notificacoes/useCentroNotificacoes";
import { usePermissaoNotificacoes } from "../src/features/notificacoes/usePermissaoNotificacoes";
import {
  fonts,
  layout,
  useEstilosTema,
  useTema,
  type Cores,
} from "../src/ui/tema";

type FeatherName = ComponentProps<typeof Feather>["name"];

const KIND_ICON: Record<TipoNotificacaoApp, FeatherName> = {
  bill: ICON.fix,
  debt: ICON.debt,
  project: ICON.proj,
  goal: ICON.goal,
};

function relativeTime(iso: string): string {
  const day = iso.slice(0, 10);
  const today = todayISO();
  if (day === today) return "Hoje";
  if (day === addDays(today, -1)) return "Ontem";
  return formatDayMonthPt(day);
}

function permissionLabel(
  state: "granted" | "denied" | "unavailable" | null,
): string {
  if (state === "granted") return "Ativas";
  if (state === "denied") return "Desativadas";
  if (state === "unavailable") return "Indisponível";
  return "A verificar";
}

function billStatusLabel(status: BillNotificationStatus | null): string {
  if (!status) return "A preparar lembretes de contas.";
  switch (status.state) {
    case "scheduled":
      return "Lembretes de contas agendados.";
    case "permission_denied":
      return "Falta permissão para agendar os lembretes.";
    case "not_scheduled":
      return "Sem contas ativas para lembrar.";
    case "error":
      return "Não foi possível agendar os lembretes.";
    default:
      return "Notificações do sistema indisponíveis.";
  }
}

function NotificationRow({
  item,
  onPress,
}: {
  item: NotificacaoApp;
  onPress: () => void;
}) {
  const { colors } = useTema();
  const styles = useEstilosTema(makeStyles);
  const color =
    item.kind === "debt"
      ? colors.danger
      : item.kind === "bill"
        ? colors.amber
        : colors.accent;

  return (
    <Pressable
      style={[styles.ni, !item.read && styles.niUnread]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${item.body}`}
    >
      <View style={[styles.niCirc, { backgroundColor: color + "22" }]}>
        <Feather name={KIND_ICON[item.kind]} size={18} color={color} />
      </View>
      <View style={styles.niBody}>
        <Text style={styles.niTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.niText}>{item.body}</Text>
      </View>
      <View style={styles.ntmRow}>
        {!item.read ? <View style={styles.ntmDot} /> : null}
        <Text style={styles.ntm}>{relativeTime(item.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

export default function Notificacoes() {
  const { colors } = useTema();
  const styles = useEstilosTema(makeStyles);
  const ins = useSafeAreaInsets();
  const { items, unreadCount, markRead, markAllRead, refresh } =
    useCentroNotificacoes();
  const {
    state: permission,
    refresh: refreshPermission,
    request,
  } = usePermissaoNotificacoes();
  const [billStatus, setBillStatus] = useState(getBillNotificationsStatus);
  const [testBusy, setTestBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refresh();
      void refreshPermission();
      setBillStatus(getBillNotificationsStatus());
    }, [refresh, refreshPermission]),
  );

  const handleEnable = async () => {
    setFeedback(null);
    const next = await request();
    setBillStatus(getBillNotificationsStatus());
    if (next === "granted") {
      setFeedback("Notificações ativadas.");
    } else if (next === "denied") {
      setFeedback("Permissão recusada. Podes ativá-la nas definições do sistema.");
    } else {
      setFeedback("Notificações indisponíveis neste ambiente.");
    }
  };

  const handleTest = async () => {
    setTestBusy(true);
    setFeedback(null);
    const result = await enviarNotificacaoTeste();
    setTestBusy(false);
    setBillStatus(getBillNotificationsStatus());
    setFeedback(result.message);
  };

  const expoGo = isExpoGo();
  const description = expoGo
    ? "No Expo Go os lembretes automáticos (contas e previsões) não são agendados. Podes continuar a usar a app normalmente."
    : permission === "granted"
      ? billStatusLabel(billStatus)
      : permission === "denied"
        ? "Ativa as notificações para receberes os lembretes de contas e vencimentos."
        : permission === "unavailable"
          ? "Este ambiente não suporta notificações do sistema."
          : "A verificar a permissão de notificações.";

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
          <Text style={styles.backTxt}>Notificações</Text>
          {unreadCount > 0 ? (
            <Pressable
              onPress={markAllRead}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Marcar todas como lidas"
              style={styles.clrBtn}
            >
              <Text style={styles.clr}>Marcar lidas</Text>
            </Pressable>
          ) : null}
        </View>

        {/* atalho de definições (`.alr`) */}
        <Pressable
          style={styles.alr}
          onPress={() => go("/ajustes")}
          accessibilityRole="button"
          accessibilityLabel="Definições de alertas"
        >
          <View style={styles.alrDot} />
          <Text style={styles.alrTxt}>
            <Text style={styles.alrBold}>Definições de alertas</Text> · contas,
            dívidas e prazos
          </Text>
          <Text style={styles.alrEm}>›</Text>
        </Pressable>

        {/* estado do sistema */}
        <Painel padded={false} style={styles.panel}>
          <View style={styles.eh}>
            <Text style={styles.ehTxt}>Notificações do sistema</Text>
            <Text
              style={[
                styles.ehSide,
                permission === "granted" && { color: colors.success },
              ]}
            >
              {permissionLabel(permission)}
            </Text>
          </View>
          <Text style={styles.sysBody}>{description}</Text>

          <View style={styles.actions}>
            {permission === "granted" ? (
              <Pressable
                style={[styles.btn, testBusy && styles.busy]}
                onPress={handleTest}
                disabled={testBusy}
                accessibilityRole="button"
                accessibilityLabel="Enviar notificação de teste"
              >
                <Text style={styles.btnTxt}>
                  {testBusy ? "A enviar…" : "Enviar teste"}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                style={styles.btn}
                onPress={handleEnable}
                accessibilityRole="button"
                accessibilityLabel="Ativar notificações"
              >
                <Text style={styles.btnTxt}>Ativar notificações</Text>
              </Pressable>
            )}

            {permission === "denied" ? (
              <Pressable
                style={[styles.btn, styles.btnGhost]}
                onPress={() => void Linking.openSettings()}
                accessibilityRole="button"
                accessibilityLabel="Abrir definições do sistema"
              >
                <Text style={[styles.btnTxt, styles.btnGhostTxt]}>
                  Abrir definições
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              style={[styles.btn, styles.btnGhost]}
              onPress={() => go("/bill")}
              accessibilityRole="button"
              accessibilityLabel="Contas fixas"
            >
              <Text style={[styles.btnTxt, styles.btnGhostTxt]}>
                Contas fixas
              </Text>
            </Pressable>

            <Pressable
              style={[styles.btn, styles.btnGhost]}
              onPress={() => go("/inteligencia")}
              accessibilityRole="button"
              accessibilityLabel="Previsões"
            >
              <Text style={[styles.btnTxt, styles.btnGhostTxt]}>Previsões</Text>
            </Pressable>
          </View>

          {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
        </Painel>

        {/* recentes */}
        <Painel padded={false} style={styles.panel}>
          <View style={styles.eh}>
            <Text style={styles.ehTxt}>Recentes</Text>
            <Text style={styles.ehSide}>
              {unreadCount
                ? `${unreadCount} ${unreadCount === 1 ? "nova" : "novas"}`
                : "Tudo lido"}
            </Text>
          </View>

          {items.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTxt}>
                Sem notificações por agora. Os lembretes de contas, dívidas,
                projetos e metas aparecem aqui.
              </Text>
            </View>
          ) : null}

          {items.map((item, i) => (
            <EntradaAnimada
              key={item.id}
              variante="revelacao"
              indice={i}
              gatilho={items.length}
            >
              <NotificationRow
                item={item}
                onPress={() => {
                  markRead(item.id);
                  go(item.href);
                }}
              />
            </EntradaAnimada>
          ))}
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
    alrTxt: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.text,
    },
    alrBold: {
      fontFamily: fonts.medium,
    },
    alrEm: {
      marginLeft: "auto",
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
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

    // estado do sistema
    sysBody: {
      fontFamily: fonts.regular,
      fontSize: 10,
      lineHeight: 15,
      color: colors.textMuted,
      marginTop: 2,
    },
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 12,
    },
    btn: {
      paddingVertical: 9,
      paddingHorizontal: 18,
      borderRadius: 99,
      backgroundColor: colors.accent,
    },
    btnGhost: {
      backgroundColor: colors.chipNeutralBg,
    },
    btnTxt: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.glassText,
    },
    btnGhostTxt: {
      color: colors.text,
    },
    busy: {
      opacity: 0.6,
    },
    feedback: {
      fontFamily: fonts.regular,
      fontSize: 10,
      lineHeight: 15,
      color: colors.textMuted,
      marginTop: 8,
    },

    // `.ni`
    ni: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 11,
      width: "100%",
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRadius: 18,
      marginTop: 4,
      backgroundColor: "transparent",
    },
    niUnread: {
      backgroundColor: colors.chipNeutralBg,
    },
    niCirc: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    niBody: {
      flex: 1,
      minWidth: 0,
    },
    niTitle: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.text,
    },
    niText: {
      fontFamily: fonts.regular,
      fontSize: 10,
      lineHeight: 14.5,
      color: colors.textMuted,
      marginTop: 2,
    },
    ntmRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingTop: 2,
    },
    ntmDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.accent,
      marginRight: 6,
    },
    ntm: {
      fontFamily: fonts.regular,
      fontSize: 10,
      color: colors.textMuted,
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
