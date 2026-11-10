import { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeftRight, Pencil, Trash, X } from "lucide-react-native";

import { formatKz } from "../../src/domain/money";
import { formatDayMonthPt } from "../../src/domain/dates";
import { FolhaValor } from "../../src/ui/componentes/FolhaValor";
import { FolhaConfirmacao } from "../../src/ui/componentes/FolhaConfirmacao";
import { CartaoDestaque } from "../../src/ui/componentes/CartaoDestaque";
import { BotaoIcone } from "../../src/ui/componentes/BotaoIcone";
import { TextoValor } from "../../src/ui/componentes/TextoValor";
import { Painel } from "../../src/ui/componentes/Painel";
import { BarraProgresso } from "../../src/ui/componentes/BarraProgresso";
import { AnelProgresso } from "../../src/ui/componentes/AnelProgresso";
import { FundoEcra } from "../../src/ui/componentes/FundoEcra";
import { ChipEstado } from "../../src/ui/componentes/ChipEstado";
import { Interruptor } from "../../src/ui/componentes/Interruptor";
import { useAvisoRapido } from "../../src/ui/componentes/AvisoRapido";
import {
  fonts,
  spacing,
  useTema,
  useEstilosTema,
  type Cores,
} from "../../src/ui/tema";
import { getProject, projectView } from "../../src/repos/projects";
import {
  rotuloChipProjeto,
  useProjetos,
} from "../../src/features/projetos/useProjetos";
import {
  callbackProtegido,
  executarAcaoProtegida,
} from "../../src/ui/protecaoAcoes";

export default function ProjectDetailScreen() {
  const { colors, gradients } = useTema();
  const styles = useEstilosTema(makeStyles);
  const router = useRouter();
  const toast = useAvisoRapido();
  const { id } = useLocalSearchParams<{ id: string }>();
  const projectId = typeof id === "string" ? id : null;
  const {
    pay,
    payments,
    updatePayment,
    removePayment,
    remove,
    deliver,
    createIncomeDefault,
    setCreateIncomeDefault,
  } = useProjetos();

  const [payOpen, setPayOpen] = useState(false);
  const [editPaymentId, setEditPaymentId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const actionLock = useRef(false);
  const project = projectId ? getProject(projectId) : null;
  const view = project ? projectView(project) : null;

  if (!projectId || !project || !view) {
    return (
      <View style={styles.root}>
        <FundoEcra />
        <View style={styles.header}>
          <Text style={styles.title}>Projeto</Text>
          <BotaoIcone icon={X} label="Fechar" onPress={() => router.back()} />
        </View>
        <View style={styles.body}>
          <Text style={styles.muted}>Este projeto já não existe.</Text>
        </View>
      </View>
    );
  }

  const paymentList = payments(projectId);
  const editing =
    paymentList.find((payment) => payment.id === editPaymentId) ?? null;

  return (
    <View style={styles.root}>
      <FundoEcra />
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {project.name}
          </Text>
          <View style={styles.headerActions}>
            <BotaoIcone
              icon={Pencil}
              label="Editar projeto"
              onPress={callbackProtegido(() =>
                router.push({
                  pathname: "/project/new",
                  params: { id: projectId },
                }),
              )}
            />
            <BotaoIcone icon={X} label="Fechar" onPress={() => router.back()} />
          </View>
        </View>

        <CartaoDestaque>
          <View style={styles.summaryRow}>
            <AnelProgresso value={view.progress} size={72} stroke={8} />
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>
                {view.settled ? "Recebido" : "Em falta"}
              </Text>
              <TextoValor
                value={view.settled ? view.received : view.remaining}
                size="lg"
              />
              <Text style={styles.summaryLabel}>
                de {formatKz(project.total)}
              </Text>
            </View>
            <ChipEstado label={rotuloChipProjeto(view)} tone="accent" />
          </View>
          <Text style={styles.summaryFooter}>
            {project.client ? `Cliente: ${project.client} · ` : ""}
            {project.due_date
              ? `entrega a ${formatDayMonthPt(project.due_date)}`
              : "sem data de entrega"}
          </Text>
        </CartaoDestaque>

        {!view.settled ? (
          <Painel style={styles.payCard} padded={false}>
            <Pressable
              accessibilityRole="button"
              onPress={callbackProtegido(() => setPayOpen(true))}
              style={styles.payButton}
            >
              <Text style={styles.payLabel}>Registar recebimento</Text>
              <Text style={styles.payHint}>
                {createIncomeDefault
                  ? "Cria uma receita em Projetos"
                  : "Sem receita automática"}
              </Text>
            </Pressable>
          </Painel>
        ) : null}

        <View style={styles.optionRow}>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Criar receita ao receber</Text>
            <Text style={styles.optionMeta}>
              Lança um movimento de receita na categoria Projetos.
            </Text>
          </View>
          <Interruptor
            value={createIncomeDefault}
            onValueChange={(value) => {
              setCreateIncomeDefault(value);
              toast({
                message: value
                  ? "Receita automática ativada"
                  : "Receita automática desativada",
              });
            }}
            label="Criar receita ao receber"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recebimentos</Text>
          {paymentList.length > 0 ? (
            paymentList.map((payment) => (
              <View key={payment.id} style={styles.paymentRow}>
                <View style={styles.paymentIcon}>
                  <ArrowLeftRight
                    color={colors.accent}
                    size={18}
                    strokeWidth={2}
                  />
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentDate}>
                    {formatDayMonthPt(payment.date)}
                  </Text>
                  <Text style={styles.paymentMeta}>
                    {payment.movement_id
                      ? "Movimento ligado"
                      : "Sem movimento ligado"}
                  </Text>
                </View>
                <TextoValor value={payment.amount} size="md" />
                <Pressable
                  accessibilityLabel="Editar recebimento"
                  hitSlop={8}
                  onPress={callbackProtegido(() =>
                    setEditPaymentId(payment.id),
                  )}
                >
                  <Pencil color={colors.textMuted} size={16} strokeWidth={2} />
                </Pressable>
                <Pressable
                  accessibilityLabel="Apagar recebimento"
                  hitSlop={8}
                  onPress={() =>
                    executarAcaoProtegida(() => {
                      try {
                        removePayment(payment.id);
                        toast({ message: "Recebimento apagado" });
                      } catch (e) {
                        toast({
                          message: e instanceof Error ? e.message : "Falhou.",
                          tone: "error",
                        });
                      }
                    })
                  }
                >
                  <Trash color={colors.warn} size={16} strokeWidth={2} />
                </Pressable>
              </View>
            ))
          ) : (
            <Text style={styles.muted}>Sem recebimentos registados.</Text>
          )}
        </View>

        <View style={styles.footerRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              executarAcaoProtegida(() => {
                try {
                  deliver(projectId, project.delivered_at === null);
                  toast({
                    message:
                      project.delivered_at === null
                        ? "Marcado como entregue"
                        : "Entrega removida",
                  });
                } catch (e) {
                  toast({
                    message: e instanceof Error ? e.message : "Falhou.",
                    tone: "error",
                  });
                }
              })
            }
            style={styles.textButton}
          >
            <Text style={styles.textButtonLabel}>
              {project.delivered_at === null
                ? "Marcar como entregue"
                : "Remover entrega"}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => setConfirmDelete(true)}
            style={styles.textButton}
          >
            <Trash color={colors.warn} size={16} strokeWidth={2} />
            <Text style={styles.deleteLabel}>Apagar projeto</Text>
          </Pressable>
        </View>
      </ScrollView>

      <FolhaValor
        visible={payOpen}
        title={`Recebimento · ${project.name}`}
        confirmLabel="Registar"
        maxAmount={view.remaining}
        helper={`Em falta ${formatKz(view.remaining)}`}
        onCancel={() => setPayOpen(false)}
        onConfirm={(amount) => {
          if (actionLock.current) return;
          actionLock.current = true;
          try {
            setPayOpen(false);
            pay(projectId, amount, undefined, createIncomeDefault);
            toast({ message: `Recebimento de ${formatKz(amount)} registado` });
          } catch (e) {
            toast({
              message: e instanceof Error ? e.message : "Falhou.",
              tone: "error",
            });
          } finally {
            actionLock.current = false;
          }
        }}
      />

      <FolhaValor
        visible={editing !== null}
        title="Editar recebimento"
        confirmLabel="Guardar"
        maxAmount={editing ? view.remaining + editing.amount : view.remaining}
        onCancel={() => setEditPaymentId(null)}
        onConfirm={(amount) => {
          if (!editing || actionLock.current) return;
          actionLock.current = true;
          try {
            updatePayment(editing.id, amount, editing.date);
            setEditPaymentId(null);
            toast({ message: "Recebimento atualizado" });
          } catch (e) {
            toast({
              message: e instanceof Error ? e.message : "Falhou.",
              tone: "error",
            });
          } finally {
            actionLock.current = false;
          }
        }}
      />

      <FolhaConfirmacao
        visible={confirmDelete}
        title="Apagar projeto"
        message="Os recebimentos registados vão ser apagados. Os movimentos ligados deixam de estar associados a eles."
        confirmLabel="Apagar"
        destructive
        onConfirm={() => {
          if (actionLock.current) return;
          actionLock.current = true;
          try {
            setConfirmDelete(false);
            remove(projectId);
            toast({ message: "Projeto apagado" });
            router.back();
          } catch (e) {
            actionLock.current = false;
            toast({
              message: e instanceof Error ? e.message : "Falhou.",
              tone: "error",
            });
          }
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </View>
  );
}

const makeStyles = (colors: Cores) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    body: {
      flex: 1,
    },
    bodyContent: {
      flexGrow: 1,
      padding: spacing.lg,
      paddingTop: spacing.xl,
      gap: spacing.md,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    title: {
      flex: 1,
      fontFamily: fonts.bold,
      fontSize: 20,
      color: colors.text,
    },
    summaryRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    summaryInfo: {
      flex: 1,
      gap: 2,
    },
    summaryLabel: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.glassText,
    },
    summaryFooter: {
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: "rgba(255,255,255,.12)",
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.glassText,
    },
    payCard: {
      overflow: "hidden",
    },
    payButton: {
      minHeight: 60,
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
    },
    payLabel: {
      fontFamily: fonts.bold,
      fontSize: 15,
      color: colors.text,
    },
    payHint: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
    },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    optionText: {
      flex: 1,
    },
    optionTitle: {
      fontFamily: fonts.medium,
      fontSize: 15,
      color: colors.text,
    },
    optionMeta: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
    },
    section: {
      gap: spacing.sm,
    },
    sectionTitle: {
      fontFamily: fonts.bold,
      fontSize: 16,
      color: colors.text,
    },
    paymentRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      minHeight: 48,
    },
    paymentIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.iconTileBg,
      alignItems: "center",
      justifyContent: "center",
    },
    paymentInfo: {
      flex: 1,
    },
    paymentDate: {
      fontFamily: fonts.medium,
      fontSize: 15,
      color: colors.text,
    },
    paymentMeta: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
    },
    footerRow: {
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    textButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minHeight: 44,
    },
    textButtonLabel: {
      fontFamily: fonts.medium,
      fontSize: 15,
      color: colors.text,
    },
    deleteLabel: {
      fontFamily: fonts.medium,
      fontSize: 15,
      color: colors.warn,
    },
    muted: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
      paddingVertical: spacing.sm,
    },
  });
