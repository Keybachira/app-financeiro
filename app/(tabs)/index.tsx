import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  Receipt,
  Settings,
  Wallet,
} from "lucide-react-native";

import {
  addMonths,
  monthDaysOf,
  monthKey,
  monthNamePt,
  todayISO,
} from "../../src/domain/dates";
import { formatShortPt } from "../../src/domain/dates";
import { formatKz } from "../../src/domain/money";
import { GlassCard } from "../../src/ui/components/GlassCard";
import { Panel } from "../../src/ui/components/Panel";
import { MoneyText } from "../../src/ui/components/MoneyText";
import { ProgressBar } from "../../src/ui/components/ProgressBar";
import { DailyBarChart } from "../../src/ui/components/DailyBarChart";
import { CategoryRow } from "../../src/ui/components/CategoryRow";
import { MovementRow } from "../../src/ui/components/MovementRow";
import { SearchInput } from "../../src/ui/components/SearchInput";
import { Fab } from "../../src/ui/components/Fab";
import { IconButton } from "../../src/ui/components/IconButton";
import { Screen } from "../../src/ui/components/Screen";
import { colors, fonts, radius, spacing } from "../../src/ui/theme";
import { useMonthSummary } from "../../src/features/movements/useMonthSummary";
import { useMonthMovements } from "../../src/features/movements/useMovements";
import { useBillsSummary } from "../../src/features/bills/useBills";
import { QuickAction } from "../../src/ui/components/QuickAction";
import { useGuardedAction } from "../../src/ui/useGuardedAction";

const LIMIT_PREVIEW = 6;

export default function HomeScreen() {
  const today = todayISO();
  const currentMonth = monthKey(today);
  const router = useRouter();
  // Mês em consulta: o atual ou qualquer um anterior. O resumo recebe uma data
  // dentro desse mês — hoje no mês corrente, o dia 1 nos restantes. Com `today`
  // fixo, "faltam X dias" e "podes gastar por dia" continuavam a falar do mês
  // atual enquanto a lista mostrava outro mês.
  const [selectedMonth, setSelectedMonth] = useState(() => monthKey(today));
  const isCurrentMonth = selectedMonth === currentMonth;
  const anchorDate = isCurrentMonth ? today : `${selectedMonth}-01`;
  const { summary, refresh } = useMonthSummary(anchorDate);
  const [search, setSearch] = useState("");
  // Sem "ver todos", a lista parava em 6 com o texto "Movimentos" por cima, e
  // nada indicava que havia mais. O corte não era reversível de forma óbvia.
  const [showAll, setShowAll] = useState(false);
  const { movements, refresh: refreshList } = useMonthMovements(
    summary.month,
    search,
  );
  const { openCount: billsDue, refresh: refreshBills } = useBillsSummary();

  // Sem guarda, dois toques no FAB ou num QuickAction empilhavam dois ecrãs
  // modais e o utilizador tinha de fechar duas vezes.
  const openBackup = useGuardedAction(() => router.push("/backup"));
  const openNewMovement = () => {
    router.push("/movement/new");
  };
  const openBills = useGuardedAction(() => router.push("/bill"));
  const openSalary = useGuardedAction(() => router.push("/salary"));
  const openSettings = useGuardedAction(() => router.push("/settings"));
  const showPreviousMonth = useCallback(() => {
    setSelectedMonth((month) => monthKey(addMonths(`${month}-01`, -1)));
  }, []);
  const showNextMonth = useCallback(() => {
    setSelectedMonth((month) => {
      const next = monthKey(addMonths(`${month}-01`, 1));
      // Não existe resumo para meses futuros.
      return next > currentMonth ? month : next;
    });
  }, [currentMonth]);
  // `router.push` devolve void na tipagem mas o retorno é usado como callback.
  const openMovement = useCallback(
    (id: string) => {
      router.push(`/movement/${id}`);
    },
    [router],
  );

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshList();
      refreshBills();
    }, [refresh, refreshList, refreshBills]),
  );

  const searching = search.trim().length > 0;
  const truncated = !searching && !showAll && movements.length > LIMIT_PREVIEW;
  const visible = searching ? movements : movements.slice(0, LIMIT_PREVIEW);
  const monthDays = monthDaysOf(anchorDate);
  const monthTitle =
    selectedMonth.slice(0, 4) === currentMonth.slice(0, 4)
      ? monthNamePt(anchorDate)
      : `${monthNamePt(anchorDate)} ${selectedMonth.slice(0, 4)}`;

  return (
    <Screen
      title="Início"
      right={
        <View style={styles.headerActions}>
          <IconButton
            icon={Download}
            label="Backup e exportar"
            onPress={openBackup}
          />
          {/* As definições só eram alcançáveis pelo atalho "Definir limite
              mensal", que desaparece assim que existe um limite. O acesso
              passa a estar sempre disponível no cabeçalho. */}
          <IconButton
            icon={Settings}
            label="Definições"
            onPress={openSettings}
          />
        </View>
      }
      floating={
        <Fab icon={Plus} label="Novo movimento" onPress={openNewMovement} />
      }
    >
      <View style={styles.monthRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mês anterior"
          onPress={showPreviousMonth}
          hitSlop={10}
          style={styles.monthArrow}
        >
          <ChevronLeft color={colors.text} size={22} strokeWidth={2.5} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.monthTitle}>
          {monthTitle}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mês seguinte"
          accessibilityState={{ disabled: isCurrentMonth }}
          disabled={isCurrentMonth}
          onPress={showNextMonth}
          hitSlop={10}
          style={styles.monthArrow}
        >
          <ChevronRight
            color={isCurrentMonth ? colors.textMuted : colors.text}
            size={22}
            strokeWidth={2.5}
          />
        </Pressable>
        {!isCurrentMonth ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar ao mês atual"
            onPress={() => setSelectedMonth(currentMonth)}
            hitSlop={6}
            style={({ pressed }) => [
              styles.todayChip,
              pressed && styles.todayChipPressed,
            ]}
          >
            <Text style={styles.todayChipText}>Hoje</Text>
          </Pressable>
        ) : null}
      </View>

      <GlassCard>
        <Text style={styles.cardLabel}>Saldo em carteira</Text>
        <MoneyText value={summary.balance} size="balance" />
        <View style={styles.cardChips}>
          <View style={styles.cardChip}>
            <Text style={styles.cardChipText}>
              {
                // Sinal explícito: sem o `+`, um mês positivo parecia não ter
                // alterado o saldo que passou a ser acumulado.
                `${isCurrentMonth ? "Este mês" : "No mês"} · ${summary.monthBalance > 0 ? "+" : ""}${formatKz(summary.monthBalance)}`
              }
            </Text>
          </View>
          <View style={styles.cardChip}>
            <Text style={styles.cardChipText}>
              Reservado em metas · {formatKz(summary.reserved)}
            </Text>
          </View>
        </View>

        {isCurrentMonth && summary.limit !== null ? (
          <View style={styles.limitBlock}>
            <View style={styles.limitRow}>
              <Text
                style={[
                  styles.limitLabel,
                  summary.limitPercent > 1 && styles.limitLabelWarn,
                ]}
              >
                Limite · {Math.round(summary.limitPercent * 100)}%
              </Text>
              <Text style={styles.limitValue}>
                {formatKz(summary.expenses)} / {formatKz(summary.limit)}
              </Text>
            </View>
            <ProgressBar
              value={Math.min(1, summary.limitPercent)}
              tone={summary.limitPercent > 1 ? "warn" : "white"}
            />
          </View>
        ) : isCurrentMonth ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Definir limite mensal"
            onPress={openSettings}
            style={({ pressed }) => [
              styles.setLimit,
              pressed && styles.setLimitPressed,
            ]}
          >
            <Plus color={colors.glassText} size={16} strokeWidth={2} />
            <Text style={styles.setLimitText}>Definir limite mensal</Text>
          </Pressable>
        ) : null}
      </GlassCard>

      {isCurrentMonth ? (
        <View style={styles.panels}>
          <Panel style={styles.panelHalf}>
            <Text style={styles.panelLabel}>Podes gastar</Text>
            <MoneyText
              value={
                Number.isFinite(summary.spendable.amount)
                  ? summary.spendable.amount
                  : 0
              }
              size="lg"
            />
            <Text
              style={[
                styles.panelMeta,
                summary.spendable.overLimit && styles.panelMetaWarn,
              ]}
            >
              {summary.spendable.overLimit
                ? "Já passaste o limite"
                : `por dia · ${summary.daysToSalary} dias`}
            </Text>
          </Panel>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Próximo salário, ${summary.nextSalary ? formatShortPt(summary.nextSalary) : "por definir"}`}
            onPress={openSalary}
          >
            <Panel style={styles.panelHalf}>
              <Text style={styles.panelLabel}>Próximo salário ›</Text>
              <Text style={styles.panelValue}>
                {summary.nextSalary ? formatShortPt(summary.nextSalary) : "—"}
              </Text>
              <Text style={styles.panelMeta}>
                {summary.nextSalary
                  ? `faltam ${summary.daysToSalary} dias`
                  : "por configurar"}
              </Text>
            </Panel>
          </Pressable>
        </View>
      ) : (
        // Num mês fechado, "podes gastar por dia" e "próximo salário" não têm
        // significado: mostramos o que entrou e saiu nesse mês.
        <View style={styles.panels}>
          <Panel style={styles.panelHalf}>
            <Text style={styles.panelLabel}>Gastaste</Text>
            <MoneyText value={summary.expenses} size="lg" />
            <Text style={styles.panelMeta}>no mês</Text>
          </Panel>
          <Panel style={styles.panelHalf}>
            <Text style={styles.panelLabel}>Recebeste</Text>
            <MoneyText value={summary.income} size="lg" />
            <Text style={styles.panelMeta}>no mês</Text>
          </Panel>
        </View>
      )}

      <View style={styles.quickRow}>
        <QuickAction
          icon={Receipt}
          label="Contas fixas"
          badge={isCurrentMonth ? billsDue : 0}
          onPress={openBills}
        />
        <QuickAction icon={Wallet} label="Salário" onPress={openSalary} />
        <QuickAction icon={Download} label="Backup" onPress={openBackup} />
      </View>

      <Panel>
        <DailyBarChart
          month={summary.month}
          data={summary.daily}
          daysInMonth={monthDays}
          dailyLimit={isCurrentMonth ? summary.dailyLimit : null}
        />
      </Panel>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categorias</Text>
        {summary.categories.length > 0 ? (
          summary.categories.map((row) => (
            <CategoryRow
              key={row.category}
              category={row.category}
              amount={row.amount}
              share={row.share}
            />
          ))
        ) : (
          <Text style={styles.empty}>
            {isCurrentMonth
              ? "Sem despesas registadas este mês."
              : "Sem despesas registadas nesse mês."}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Movimentos</Text>
          {truncated ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Ver todos os ${movements.length} movimentos do mês`}
              onPress={() => setShowAll(true)}
              hitSlop={8}
              style={({ pressed }) => [
                styles.seeAll,
                pressed && styles.seeAllPressed,
              ]}
            >
              <Text style={styles.seeAllText}>
                Ver todos ({movements.length})
              </Text>
              <ChevronRight
                color={colors.accentSoft}
                size={14}
                strokeWidth={2.5}
              />
            </Pressable>
          ) : null}
        </View>

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Procurar por nota ou categoria"
        />

        <View style={styles.list}>
          {visible.map((movement) => (
            <MovementRow
              key={movement.id}
              movement={movement}
              today={today}
              onPress={() => openMovement(movement.id)}
            />
          ))}

          {visible.length === 0 ? (
            <Text style={styles.empty}>
              {searching
                ? "Sem resultados para a pesquisa."
                : isCurrentMonth
                  ? "Sem movimentos este mês."
                  : "Sem movimentos nesse mês."}
            </Text>
          ) : null}

          {truncated ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ver mais movimentos"
              onPress={() => setShowAll(true)}
              style={({ pressed }) => [
                styles.loadMore,
                pressed && styles.loadMorePressed,
              ]}
            >
              <Text style={styles.loadMoreText}>Ver mais</Text>
              <ChevronRight
                color={colors.accentSoft}
                size={16}
                strokeWidth={2.5}
              />
            </Pressable>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  monthArrow: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  monthTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.text,
    letterSpacing: -0.3,
  },
  todayChip: {
    marginLeft: "auto",
    minHeight: 28,
    justifyContent: "center",
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: 10,
  },
  todayChipPressed: {
    opacity: 0.6,
  },
  todayChipText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.accentSoft,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  quickRow: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  cardLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.glassText,
  },
  cardChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cardChip: {
    backgroundColor: colors.chipOnGlass,
    borderRadius: radius.control,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  cardChipText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text,
  },
  limitBlock: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  limitRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  limitLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.glassText,
  },
  limitLabelWarn: {
    fontFamily: fonts.bold,
    color: colors.warn,
  },
  limitValue: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.glassText,
    fontVariant: ["tabular-nums"],
  },
  setLimit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.lg,
    minHeight: 44,
  },
  setLimitPressed: {
    opacity: 0.6,
  },
  setLimitText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.glassText,
  },
  panels: {
    flexDirection: "row",
    gap: spacing.md,
  },
  panelHalf: {
    flex: 1,
    padding: 14,
    gap: 2,
  },
  panelLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  panelMeta: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  panelValue: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.text,
  },
  panelMetaWarn: {
    color: colors.warn,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  seeAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    minHeight: 28,
  },
  seeAllPressed: {
    opacity: 0.6,
  },
  seeAllText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.accentSoft,
  },
  loadMore: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minHeight: 44,
    marginTop: spacing.sm,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  loadMorePressed: {
    opacity: 0.6,
  },
  loadMoreText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.accentSoft,
  },
  list: {
    marginTop: spacing.xs,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    paddingVertical: spacing.sm,
  },
});
