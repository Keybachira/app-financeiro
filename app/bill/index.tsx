import { useFocusEffect, useRouter } from "expo-router";
import { Calendar, ChevronLeft, ChevronRight, Plus } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { formatDayMonthPt, monthShort } from "../../src/domain/dates";
import { formatKz } from "../../src/domain/money";
import { useAvisoRapido } from "../../src/ui/componentes/AvisoRapido";
import { fonts, useTema } from "../../src/ui/tema";
import { FormularioConta } from "../../src/features/contas/FormularioConta";
import { useContas } from "../../src/features/contas/useContas";
import type { BillRow, BillView } from "../../src/repos/bills";

import { callbackProtegido } from "../../src/ui/protecaoAcoes";
import { useAcaoProtegida } from "../../src/ui/useAcaoProtegida";

// Paleta do protótipo HTML (AB Finance), tema claro/escuro.
const paleta = (escuro: boolean) => ({
  bg: escuro ? "#000000" : "#ededed",
  panel: escuro ? "#141414" : "#ffffff",
  text: escuro ? "#ffffff" : "#0d0d0d",
  muted: escuro ? "#7a7a7a" : "#8d8d8d",
  circ: escuro ? "#000000" : "#efefef",
  hbtn: escuro ? "#262626" : "#ffffff",
  acc: "#9c32d7",
  accSoft: "#9c32d726",
  amb: "#ffd35b",
  ambGlow: "#ffd35b44",
});
type Paleta = ReturnType<typeof paleta>;

// Quanto menor, mais urgente. Atrasada < hoje < dias até ao vencimento.
const urgencia = (v: BillView): number =>
  v.status === "late" ? -1 : v.status === "today" ? 0 : (v.daysToDue ?? 99);

function textoAlerta(v: BillView): string {
  if (v.status === "late") return "está atrasada";
  if (v.status === "today") return "vence hoje";
  return v.daysToDue === 1 ? "vence em 1 dia" : `vence em ${v.daysToDue} dias`;
}

export default function BillsScreen() {
  // Segue o tema escolhido nas definições (sistema, claro ou escuro).
  const { dark: escuro } = useTema();
  const p = useMemo(() => paleta(escuro), [escuro]);
  const styles = useMemo(() => makeStyles(p), [p]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useAvisoRapido();
  const { open, payable, progress, pay, refresh, today, notificationStatus } =
    useContas();
  // O formulário é uma folha por cima da lista, não um ecrã novo.
  const [formAberto, setFormAberto] = useState(false);
  const [contaEmEdicao, setContaEmEdicao] = useState<BillRow | null>(null);

  const abrirNova = useAcaoProtegida(() => {
    setContaEmEdicao(null);
    setFormAberto(true);
  });

  const fecharFormulario = useCallback(() => {
    setFormAberto(false);
    setContaEmEdicao(null);
    refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  // Todas as contas activas, por dia do mês (Renda 1, Internet 10, ...).
  const rows = useMemo(
    () => [...open].sort((a, b) => a.bill.day_of_month - b.bill.day_of_month),
    [open],
  );

  // Conta mais urgente (atrasada, hoje ou nos próximos 7 dias).
  const alerta = useMemo(() => {
    const prox = [...payable].sort((a, b) => urgencia(a) - urgencia(b))[0];
    return prox && urgencia(prox) <= 7 ? prox : null;
  }, [payable]);

  const editar = (view: BillView) =>
    callbackProtegido(() => {
      setContaEmEdicao(view.bill);
      setFormAberto(true);
    }, "bill:editar");

  const pagar = (view: BillView) => {
    try {
      pay(view.bill.id);
      toast({ message: `${view.bill.name} paga`, tone: "success" });
    } catch (caught) {
      toast({
        message:
          caught instanceof Error
            ? caught.message
            : "Não foi possível pagar a conta.",
        tone: "error",
      });
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: 48 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backBtn,
              pressed && styles.pressedScale,
            ]}
          >
            <ChevronLeft color={p.text} size={20} strokeWidth={1.6} />
          </Pressable>
          <Text style={styles.title}>Despesas fixas</Text>
        </View>

        {/* Alerta de vencimento */}
        {alerta ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${alerta.bill.name} ${textoAlerta(alerta)}`}
            onPress={editar(alerta)}
            style={styles.alert}
          >
            <View style={styles.dotGlow}>
              <View style={styles.dot} />
            </View>
            <Text style={styles.alertText} numberOfLines={1}>
              <Text style={styles.alertBold}>{alerta.bill.name}</Text>{" "}
              {textoAlerta(alerta)}
            </Text>
            <ChevronRight color={p.muted} size={14} strokeWidth={1.8} />
          </Pressable>
        ) : null}

        {/* Lista */}
        <View style={styles.panel}>
          {rows.length === 0 ? (
            <Text style={styles.empty}>Ainda não tens contas fixas.</Text>
          ) : (
            rows.map((view) => (
              <BillRow
                key={view.bill.id}
                view={view}
                today={today}
                p={p}
                onPay={() => pagar(view)}
                onEdit={editar(view)}
              />
            ))
          )}

          {rows.length > 0 ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalText}>Total mensal</Text>
              <Text style={styles.totalText}>{formatKz(progress.total)}</Text>
            </View>
          ) : null}
        </View>

        {notificationStatus && notificationStatus.state !== "scheduled" ? (
          <Text style={styles.note}>
            {notificationStatus.state === "permission_denied"
              ? "Notificações: permissão recusada. Os lembretes não serão agendados até permitir nas definições do sistema."
              : notificationStatus.state === "unavailable"
                ? "Notificações indisponíveis neste dispositivo/build."
                : notificationStatus.state === "error"
                  ? `Notificações: ${notificationStatus.message ?? "falha ao agendar"}.`
                  : (notificationStatus.message ??
                    "Notificações não agendadas.")}
          </Text>
        ) : null}

        {/* Nova conta fixa */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Nova conta fixa"
          onPress={abrirNova}
          style={({ pressed }) => [styles.go, pressed && styles.goPressed]}
        >
          <Plus color="#ffffff" size={15} strokeWidth={2.2} />
          <Text style={styles.goLabel}>Nova conta fixa</Text>
        </Pressable>
      </ScrollView>

      <FormularioConta
        visible={formAberto}
        conta={contaEmEdicao}
        onClose={fecharFormulario}
      />
    </View>
  );
}

function billAccessibilityLabel(view: BillView, today: string): string {
  const base = `${view.bill.name}, ${formatKz(view.bill.amount)}, todo o dia ${view.bill.day_of_month}`;

  if (view.paidThisMonth) {
    return `${base}, paga em ${monthShort(today)}. Toca para editar.`;
  }

  return `${base}, por pagar. Toca para editar.`;
}

function BillRow({
  view,
  today,
  p,
  onPay,
  onEdit,
}: {
  view: BillView;
  today: string;
  p: Paleta;
  onPay: () => void;
  onEdit: () => void;
}) {
  const styles = useMemo(() => makeStyles(p), [p]);

  // A linha é um botão (editar) que contém outro botão (pagar). O label do
  // "Pagar" é próprio para o leitor de ecrã não anunciar os dois em cima um do outro.
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={billAccessibilityLabel(view, today)}
      onPress={onEdit}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
    >
      <View style={styles.iconTile}>
        <Calendar color={p.text} size={17} strokeWidth={1.6} />
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {view.bill.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          Todo o dia {view.bill.day_of_month}
          {view.paidOn ? ` · paga a ${formatDayMonthPt(view.paidOn)}` : ""}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={styles.amount}>{formatKz(view.bill.amount)}</Text>
        {view.paidThisMonth ? (
          <Text style={styles.paid}>Paga</Text>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Pagar ${view.bill.name}, ${formatKz(view.bill.amount)}`}
            onPress={onPay}
            hitSlop={8}
            style={({ pressed }) => [
              styles.payChip,
              pressed && styles.itemPressed,
            ]}
          >
            <Text style={styles.payChipLabel}>Pagar</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const makeStyles = (p: Paleta) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: p.bg,
    },
    content: {
      paddingHorizontal: 18,
    },
    pressedScale: {
      transform: [{ scale: 0.92 }],
    },

    // Cabeçalho
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 4,
    },
    backBtn: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: p.hbtn,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontFamily: fonts.medium,
      fontSize: 20,
      color: p.text,
    },

    // Alerta
    alert: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 14,
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderRadius: 18,
      backgroundColor: p.panel,
    },
    dotGlow: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: p.ambGlow,
      alignItems: "center",
      justifyContent: "center",
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: p.amb,
    },
    alertText: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: 12,
      color: p.text,
    },
    alertBold: {
      fontFamily: fonts.medium,
    },

    // Painel
    panel: {
      backgroundColor: p.panel,
      borderRadius: 28,
      paddingVertical: 18,
      paddingHorizontal: 14,
      marginTop: 16,
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      minHeight: 54,
      paddingVertical: 6,
      paddingHorizontal: 4,
      borderRadius: 14,
    },
    itemPressed: {
      opacity: 0.7,
    },
    iconTile: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: p.circ,
      alignItems: "center",
      justifyContent: "center",
    },
    info: {
      flex: 1,
    },
    name: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: p.text,
    },
    meta: {
      fontFamily: fonts.regular,
      fontSize: 10,
      color: p.muted,
    },
    right: {
      alignItems: "flex-end",
      gap: 4,
    },
    amount: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: p.text,
    },
    paid: {
      fontFamily: fonts.medium,
      fontSize: 10,
      color: p.acc,
    },
    payChip: {
      paddingVertical: 2,
      paddingHorizontal: 10,
      borderRadius: 99,
      backgroundColor: p.accSoft,
    },
    payChipLabel: {
      fontFamily: fonts.medium,
      fontSize: 10,
      color: p.acc,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 10,
      paddingHorizontal: 4,
    },
    totalText: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: p.text,
    },
    empty: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: p.muted,
      textAlign: "center",
      paddingVertical: 26,
      paddingHorizontal: 10,
    },
    note: {
      fontFamily: fonts.regular,
      fontSize: 10,
      color: p.muted,
      textAlign: "center",
      marginTop: 16,
    },

    // Botão principal
    go: {
      height: 50,
      borderRadius: 25,
      backgroundColor: p.acc,
      marginTop: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    goPressed: {
      opacity: 0.85,
    },
    goLabel: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: "#ffffff",
    },
  });
