import { Pressable, StyleSheet, Text, View } from "react-native";
import { Briefcase } from "lucide-react-native";

import { formatKz } from "../../domain/money";
import { formatDayMonthPt } from "../../domain/dates";
import { IconeCirculo } from "../../ui/componentes/IconeCirculo";
import { Painel } from "../../ui/componentes/Painel";
import { BarraProgresso } from "../../ui/componentes/BarraProgresso";
import { ChipEstado } from "../../ui/componentes/ChipEstado";
import { fonts, useEstilosTema, type Cores } from "../../ui/tema";
import { rotuloChipProjeto, type useProjetos } from "./useProjetos";

type ProjectViewType = ReturnType<typeof useProjetos>["active"][number];

/**
 * Cartão de um projeto: nome, cliente, recebido/alvo, barra de progresso e
 * prazo de entrega (ou data de entrega quando já liquidado).
 */
export function CartaoProjeto({
  view,
  onPress,
}: {
  view: ProjectViewType;
  onPress: () => void;
}) {
  const styles = useEstilosTema(makeStyles);
  const due = view.project.due_date;

  // Sem label, o TalkBack lia os textos filhos soltos, sem dizer que é um item
  // navegável nem o estado do projeto.
  const accessibilityLabel = [
    view.project.name,
    view.project.client,
    rotuloChipProjeto(view),
    view.settled
      ? `Recebido ${formatKz(view.received)} de ${formatKz(view.project.total)}${
          view.project.delivered_at
            ? `, entregue a ${formatDayMonthPt(view.project.delivered_at)}`
            : ""
        }`
      : `Recebido ${formatKz(view.received)} de ${formatKz(view.project.total)}, falta ${formatKz(
          view.remaining,
        )}${due ? `, entrega a ${formatDayMonthPt(due)}` : ""}`,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
    >
      <Painel>
        <View style={styles.row}>
          <IconeCirculo icon={Briefcase} size={44} />
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>
              {view.project.name}
            </Text>
            {view.project.client ? (
              <Text style={styles.client}>{view.project.client}</Text>
            ) : null}
          </View>
          {/* Os dois ramos eram 'accent': o chip nunca distinguia liquidado de
              em curso, apesar de haver dois estados. */}
          <ChipEstado
            label={rotuloChipProjeto(view)}
            tone={view.settled ? "accent" : "neutral"}
          />
        </View>

        <View style={styles.numbers}>
          <Text style={styles.received}>
            Recebido{" "}
            <Text style={styles.receivedStrong}>{formatKz(view.received)}</Text>
          </Text>
          <Text style={styles.target}>de {formatKz(view.project.total)}</Text>
        </View>

        <BarraProgresso value={view.progress} tone="gradient" />

        <Text style={styles.meta}>
          {view.settled
            ? view.project.delivered_at
              ? `Entregue a ${formatDayMonthPt(view.project.delivered_at)}`
              : "Pago"
            : `Falta ${formatKz(view.remaining)}${due ? ` · entrega a ${formatDayMonthPt(due)}` : ""}`}
        </Text>
      </Painel>
    </Pressable>
  );
}

const makeStyles = (colors: Cores) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    info: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 16,
      color: colors.text,
    },
    client: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
    },
    numbers: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginTop: 14,
      marginBottom: 8,
    },
    received: {
      fontFamily: fonts.regular,
      fontSize: 14,
      color: colors.textMuted,
    },
    receivedStrong: {
      fontFamily: fonts.bold,
      color: colors.text,
    },
    target: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
    },
    meta: {
      marginTop: 8,
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
    },
  });

/** Estado vazio da lista de projetos. */
export function EstadoVazioProjetos({ onCreate }: { onCreate: () => void }) {
  const styles = useEstilosTema(makeStyles);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Sem projetos. Toca para criar o primeiro."
      onPress={onCreate}
    >
      <Painel>
        <Text style={styles.target}>
          Sem projetos. Toca para criar o primeiro.
        </Text>
      </Painel>
    </Pressable>
  );
}
