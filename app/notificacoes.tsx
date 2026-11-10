import React, { useCallback, useState, type ComponentProps } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ICON, go, goBack, useTemaBase } from "../data";
import { addDays, formatDayMonthPt, todayISO } from "../src/domain/dates";
import { EntradaAnimada } from "../src/ui/componentes/EntradaAnimada";
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
  const { t, s } = useTemaBase();
  const color =
    item.kind === "debt" ? t.neg : item.kind === "bill" ? t.amb : t.acc;

  return (
    <Pressable
      style={[s.ni, !item.read && s.niUn]}
      onPress={onPress}
      accessibilityLabel={`${item.title}. ${item.body}`}
    >
      <View
        style={[
          s.circSm,
          {
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: color + "22",
          },
        ]}
      >
        <Feather name={KIND_ICON[item.kind]} size={18} color={color} />
      </View>
      <View style={s.itBody}>
        <Text style={s.itTxt} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[s.itSub, { marginTop: 2, lineHeight: 15 }]}>
          {item.body}
        </Text>
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingTop: 2,
        }}
      >
        {!item.read && (
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: t.acc,
              marginRight: 6,
            }}
          />
        )}
        <Text style={s.itSub}>{relativeTime(item.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

export default function Notificacoes() {
  const { t, s } = useTemaBase();
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
    <ScrollView
      style={s.screen}
      contentContainerStyle={[s.content, { paddingTop: ins.top + 20 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.back}>
        <Pressable style={s.circ} onPress={goBack} accessibilityLabel="Fechar">
          <Feather name={ICON.x} size={20} color={t.text} />
        </Pressable>
        <Text style={s.backTxt}>Notificações</Text>
        {unreadCount > 0 && (
          <Pressable onPress={markAllRead} hitSlop={8}>
            <Text style={{ color: t.acc, fontSize: 12, fontWeight: "500" }}>
              Marcar lidas
            </Text>
          </Pressable>
        )}
      </View>

      <Pressable style={s.alr} onPress={() => go("/ajustes")}>
        <View style={[s.alrDot, { backgroundColor: t.acc }]} />
        <Text style={s.alrTxt}>
          <Text style={{ fontWeight: "500" }}>Definições de alertas</Text> ·
          contas, dívidas e prazos
        </Text>
        <Text style={s.link}>›</Text>
      </Pressable>

      <View style={s.panel}>
        <View style={s.eh}>
          <Text style={s.ehTxt}>Notificações do sistema</Text>
          <Text style={[s.link, { color: permission === "granted" ? t.pos : t.muted }]}>
            {permissionLabel(permission)}
          </Text>
        </View>
        <Text style={[s.tgSub, { lineHeight: 16, marginTop: 2 }]}>
          {description}
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {permission === "granted" ? (
            <Pressable
              style={[s.emptyBtn, { marginTop: 0, opacity: testBusy ? 0.6 : 1 }]}
              onPress={handleTest}
              disabled={testBusy}
            >
              <Text style={s.emptyBtnTxt}>
                {testBusy ? "A enviar…" : "Enviar teste"}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              style={[s.emptyBtn, { marginTop: 0 }]}
              onPress={handleEnable}
            >
              <Text style={s.emptyBtnTxt}>Ativar notificações</Text>
            </Pressable>
          )}

          {permission === "denied" && (
            <Pressable
              style={[s.emptyBtn, { marginTop: 0, backgroundColor: t.circ }]}
              onPress={() => void Linking.openSettings()}
            >
              <Text style={[s.emptyBtnTxt, { color: t.text }]}>
                Abrir definições
              </Text>
            </Pressable>
          )}

          <Pressable
            style={[s.emptyBtn, { marginTop: 0, backgroundColor: t.circ }]}
            onPress={() => go("/bill")}
          >
            <Text style={[s.emptyBtnTxt, { color: t.text }]}>Contas fixas</Text>
          </Pressable>

          <Pressable
            style={[s.emptyBtn, { marginTop: 0, backgroundColor: t.circ }]}
            onPress={() => go("/inteligencia")}
          >
            <Text style={[s.emptyBtnTxt, { color: t.text }]}>Previsões</Text>
          </Pressable>
        </View>

        {feedback && (
          <Text style={[s.tgSub, { marginTop: 8, lineHeight: 15 }]}>
            {feedback}
          </Text>
        )}
      </View>

      <View style={s.panel}>
        <View style={s.eh}>
          <Text style={s.ehTxt}>Recentes</Text>
          <Text style={s.link}>
            {unreadCount
              ? `${unreadCount} ${unreadCount === 1 ? "nova" : "novas"}`
              : "Tudo lido"}
          </Text>
        </View>

        {items.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyTxt}>
              Sem notificações por agora. Os lembretes de contas, dívidas,
              projetos e metas aparecem aqui.
            </Text>
          </View>
        )}

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
      </View>
    </ScrollView>
  );
}
