import { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeftRight, Pencil, Trash, X } from "lucide-react-native";

import { formatKz } from "../../src/domain/money";
import { formatDayMonthPt, monthShort } from "../../src/domain/dates";
import { FolhaValor } from "../../src/ui/componentes/FolhaValor";
import { FolhaConfirmacao } from "../../src/ui/componentes/FolhaConfirmacao";
import { BotaoIcone } from "../../src/ui/componentes/BotaoIcone";
import { CartaoDestaque } from "../../src/ui/componentes/CartaoDestaque";
import { TextoValor } from "../../src/ui/componentes/TextoValor";
import { Painel } from "../../src/ui/componentes/Painel";
import { AnelProgresso } from "../../src/ui/componentes/AnelProgresso";
import { FundoEcra } from "../../src/ui/componentes/FundoEcra";
import { ChipEstado } from "../../src/ui/componentes/ChipEstado";
import { useAvisoRapido } from "../../src/ui/componentes/AvisoRapido";
import { fonts, radius, spacing, useTema, useEstilosTema, type Cores } from "../../src/ui/tema";
import { useMetas } from "../../src/features/metas/useMetas";
import { callbackProtegido, executarAcaoProtegida } from "../../src/ui/protecaoAcoes";

type SheetMode = "deposit" | "withdraw" | null;

export default function GoalDetailScreen() {
  const { colors, gradients } = useTema();
  const styles = useEstilosTema(makeStyles);
  const router = useRouter();
  const toast = useAvisoRapido();
  const { id } = useLocalSearchParams<{ id: string }>();
  const goalId = typeof id === "string" ? id : null;
  const { detail, ops, deposit, withdraw, remove, archive, removeOp } =
    useMetas();

  const [sheet, setSheet] = useState<SheetMode>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const view = goalId ? detail(goalId) : null;

  if (!goalId || !view) {
    return (
      <View style={styles.root}>
        <FundoEcra />
        <View style={styles.header}>
          <Text style={styles.title}>Meta</Text>
          <BotaoIcone icon={X} label="Fechar" onPress={() => router.back()} />
        </View>
        <View style={styles.body}>
          <Text style={styles.muted}>Esta meta já não existe.</Text>
        </View>
      </View>
    );
  }

  const operations = ops(goalId);
  const chipLabel = view.completed
    ? "Concluída"
    : view.goal.deadline === null
      ? "Sem prazo"
      : view.pace === "ahead"
        ? "Adiantada"
        : view.pace === "behind"
          ? "Atrasada"
          : "No ritmo";
  const chipTone =
    view.completed || view.pace === "ahead"
      ? "accent"
      : view.pace === "behind"
        ? "warn"
        : "neutral";

  const opLockRef = useRef(false);
  const handleConfirmAmount = (amount: number) => {
    if (opLockRef.current) return;
    setSheet(null);
    opLockRef.current = true;
    try {
      if (sheet === "deposit") {
        deposit(goalId, amount);
        toast({ message: `Depositado ${formatKz(amount)}` });
      } else if (sheet === "withdraw") {
        withdraw(goalId, amount);
        toast({ message: `Levantado ${formatKz(amount)}` });
      }
    } catch (caught) {
      toast({
        message: caught instanceof Error ? caught.message : "Operação falhou.",
        tone: "error",
      });
    } finally {
      opLockRef.current = false;
    }
  };

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
            {view.goal.name}
          </Text>
          <View style={styles.headerActions}>
            <BotaoIcone
              icon={Pencil}
              label="Editar meta"
              onPress={callbackProtegido(() =>
                router.push({ pathname: "/goal/new", params: { id: goalId } }),
              )}
            />
            <BotaoIcone icon={X} label="Fechar" onPress={() => router.back()} />
          </View>
        </View>

        <CartaoDestaque>
          <View style={styles.summaryRow}>
            <AnelProgresso value={view.progress} size={72} stroke={8} />
            <View style={styles.summaryInfo}>
              <TextoValor value={view.saved} size="lg" />
              <Text style={styles.summaryTarget}>
                de {formatKz(view.goal.target)}
              </Text>
              <View style={styles.chip}>
                <ChipEstado label={chipLabel} tone={chipTone} />
              </View>
            </View>
          </View>
          <Text style={styles.summaryFooter}>
            {view.completed
              ? "Podes levantar ou arquivar quando quiseres"
              : view.goal.deadline === null
                ? "Sem prazo definido"
                : `Poupar ${formatKz(view.monthlyNeeded)}/mês · até ${monthShort(view.goal.deadline)}`}
          </Text>
        </CartaoDestaque>

        <View style={styles.actionsRow}>
          <Painel style={styles.actionCard} padded={false}>
            <Pressable
              accessibilityRole="button"
              onPress={callbackProtegido(() => setSheet("deposit"))}
              style={styles.actionButton}
            >
              <Text style={styles.actionLabel}>Depositar</Text>
            </Pressable>
          </Painel>
          <Painel style={styles.actionCard} padded={false}>
            <Pressable
              accessibilityRole="button"
              disabled={view.saved <= 0}
              onPress={callbackProtegido(() => setSheet("withdraw"))}
              style={[
                styles.actionButton,
                view.saved <= 0 && styles.actionDisabled,
              ]}
            >
              <Text style={styles.actionLabel}>Levantar</Text>
            </Pressable>
          </Painel>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operações</Text>
          {operations.length > 0 ? (
            operations.map((op) => (
              <View key={op.id} style={styles.opRow}>
                <View style={styles.opIcon}>
                  <ArrowLeftRight
                    color={op.kind === "deposit" ? colors.accent : colors.warn}
                    size={18}
                    strokeWidth={2}
                  />
                </View>
                <View style={styles.opInfo}>
                  <Text style={styles.opTitle}>
                    {op.kind === "deposit" ? "Depósito" : "Levantamento"}
                  </Text>
                  <Text style={styles.opMeta}>{formatDayMonthPt(op.date)}</Text>
                </View>
                <TextoValor
                  value={op.amount}
                  size="sm"
                  tone={op.kind === "deposit" ? "default" : "muted"}
                />
                <Pressable
                  accessibilityLabel="Apagar operação"
                  hitSlop={8}
                  onPress={() =>
                    executarAcaoProtegida(() => {
                      try {
                        removeOp(op.id);
                        toast({ message: "Operação apagada" });
                      } catch (e) {
                        toast({
                          message: e instanceof Error ? e.message : "Falhou.",
                          tone: "error",
                        });
                      }
                    })
                  }
                >
                  <X color={colors.textMuted} size={16} strokeWidth={2} />
                </Pressable>
              </View>
            ))
          ) : (
            <Text style={styles.muted}>Sem operações registadas.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              archive(goalId, view.goal.archived_at === null);
              toast({
                message:
                  view.goal.archived_at === null
                    ? "Meta arquivada"
                    : "Meta reativada",
              });
            }}
            style={styles.textButton}
          >
            <Text style={styles.textButtonLabel}>
              {view.goal.archived_at === null
                ? "Arquivar meta"
                : "Reativar meta"}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => setConfirmDelete(true)}
            style={styles.textButton}
          >
            <Trash color={colors.warn} size={16} strokeWidth={2} />
            <Text style={styles.deleteLabel}>Apagar meta</Text>
          </Pressable>
        </View>
      </ScrollView>

      <FolhaValor
        visible={sheet !== null}
        title={sheet === "deposit" ? "Depositar na meta" : "Levantar da meta"}
        confirmLabel={sheet === "deposit" ? "Depositar" : "Levantar"}
        helper={
          sheet === "withdraw"
            ? `Disponível: ${formatKz(view.saved)}`
            : undefined
        }
        maxAmount={sheet === "withdraw" ? view.saved : undefined}
        onCancel={() => setSheet(null)}
        onConfirm={handleConfirmAmount}
      />

      <FolhaConfirmacao
        visible={confirmDelete}
        title="Apagar meta"
        message={`O reservado de ${formatKz(view.saved)} volta ao saldo do mês. Esta ação é irreversível.`}
        confirmLabel="Apagar"
        destructive
        onConfirm={() => {
          setConfirmDelete(false);
          remove(goalId);
          toast({ message: "Meta apagada" });
          router.back();
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
    gap: spacing.lg,
  },
  summaryInfo: {
    flex: 1,
    gap: 4,
  },
  summaryTarget: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.glassText,
  },
  chip: {
    marginTop: 4,
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
  actionsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionCard: {
    flex: 1,
  },
  actionButton: {
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  actionDisabled: {
    opacity: 0.5,
  },
  actionLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  opRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
  opIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.iconTileBg,
    alignItems: "center",
    justifyContent: "center",
  },
  opInfo: {
    flex: 1,
  },
  opTitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
  opMeta: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  textButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
    paddingVertical: spacing.sm,
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
  headerSpacer: {
    width: spacing.sm,
  },
  cardRadius: {
    borderRadius: radius.panel,
  },
});
