import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { Plus, Trash, X } from "lucide-react-native";

import { CATEGORIES, DEFAULT_CATEGORY } from "../../domain/categories";
import { suggestCategory } from "../../domain/categoryHints";
import { parseISO, toISO, todayISO } from "../../domain/dates";
import { MoneyText } from "../../ui/components/MoneyText";
import { Panel } from "../../ui/components/Panel";
import { ScreenBackground } from "../../ui/components/ScreenBackground";
import { IconButton } from "../../ui/components/IconButton";
import { SegmentedControl } from "../../ui/components/SegmentedControl";
import { CategoryChips } from "../../ui/components/CategoryChips";
import { CategorySuggestChip } from "../../ui/components/CategorySuggestChip";
import { QuickChips } from "../../ui/components/QuickChips";
import { DayChips } from "../../ui/components/DayChips";
import { AmountKeypad } from "../../ui/components/AmountKeypad";
import { ConfirmSheet } from "../../ui/components/ConfirmSheet";
import { useToast } from "../../ui/components/Toast";
import { fonts, radius, spacing, useTheme, useThemedStyles, type Colors } from "../../ui/theme";
import {
  createMovement,
  deleteMovement,
  restoreMovement,
  updateMovement,
  type MovementInput,
  type MovementRow,
  type MovementType,
} from "../../repos/movements";
import {
  useCategoryHints,
  useQuickChips,
  type QuickChipData,
} from "./useQuickPicks";
import { syncIntelligenceAfterMovementChange } from "../intelligence/engine";

const TYPE_OPTIONS: { value: MovementType; label: string }[] = [
  { value: "expense", label: "Despesa" },
  { value: "income", label: "Receita" },
];

export function MovementEditor({
  movement,
  initialType = "expense",
}: {
  movement: MovementRow | null;
  initialType?: MovementType;
}) {
  const { colors, gradients } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const today = todayISO();
  const router = useRouter();
  const toast = useToast();
  const hints = useCategoryHints();
  const quickChips = useQuickChips(today);
  const actionLockRef = useRef(false);

  const [type, setType] = useState<MovementType>(
    movement?.type ?? initialType,
  );
  const [digits, setDigits] = useState(() =>
    movement ? String(movement.amount) : "",
  );
  const [note, setNote] = useState(movement?.note ?? "");
  const [date, setDate] = useState(movement?.date ?? today);
  const [category, setCategory] = useState(
    movement?.category ?? DEFAULT_CATEGORY,
  );
  const [categoryTouched, setCategoryTouched] = useState(movement !== null);
  const [showPicker, setShowPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const suggestion = useMemo(() => suggestCategory(note, hints), [note, hints]);

  useEffect(() => {
    if (!categoryTouched && suggestion && suggestion !== category) {
      setCategory(suggestion);
    }
  }, [suggestion, categoryTouched, category]);

  const amount = digits.length > 0 ? Number(digits) : 0;

  const applyQuickChip = useCallback(
    (chip: QuickChipData) => {
      if (actionLockRef.current || chip.amount <= 0) {
        return;
      }

      actionLockRef.current = true;
      try {
        const chipCategory =
          chip.category ??
          suggestCategory(chip.note ?? "", hints) ??
          DEFAULT_CATEGORY;
        const input: MovementInput = {
          type: chip.type,
          amount: chip.amount,
          category: chipCategory,
          date: today,
          note: chip.note,
        };

        const created = createMovement(input);
        syncIntelligenceAfterMovementChange();
        toast({
          message: `Registado ${chip.label}`,
          actionLabel: "Desfazer",
          onAction: () => {
            deleteMovement(created.id);
            syncIntelligenceAfterMovementChange();
          },
        });
        router.back();
      } catch {
        actionLockRef.current = false;
        toast({ message: "Não foi possível registar o movimento." });
      }
    },
    [hints, router, toast, today],
  );

  const handleSave = useCallback(() => {
    if (actionLockRef.current) return;
    if (amount <= 0) {
      toast({ message: "Indica um valor maior que zero" });
      return;
    }

    actionLockRef.current = true;
    try {
      const trimmedNote = note.trim();
      const input: MovementInput = {
        type,
        amount,
        category,
        date,
        note: trimmedNote.length > 0 ? trimmedNote : null,
      };

      if (movement) {
        const previous = movement;
        updateMovement(previous.id, input);
        syncIntelligenceAfterMovementChange();
        toast({
          message: "Movimento atualizado",
          actionLabel: "Desfazer",
          onAction: () => {
            updateMovement(previous.id, {
              type: previous.type,
              amount: previous.amount,
              category: previous.category,
              date: previous.date,
              note: previous.note,
            });
            syncIntelligenceAfterMovementChange();
          },
        });
      } else {
        const created = createMovement(input);
        syncIntelligenceAfterMovementChange();
        toast({
          message: "Movimento registado",
          actionLabel: "Desfazer",
          onAction: () => {
            deleteMovement(created.id);
            syncIntelligenceAfterMovementChange();
          },
        });
      }

      router.back();
    } catch (error) {
      actionLockRef.current = false;
      toast({
        message: error instanceof Error ? error.message : "Não foi possível guardar o movimento.",
        tone: "error",
      });
    }
  }, [amount, category, date, movement, note, router, toast, type]);

  const handleDelete = useCallback(() => {
    if (!movement || actionLockRef.current) {
      return;
    }

    actionLockRef.current = true;
    try {
      const deleted = movement;
      deleteMovement(deleted.id);
      syncIntelligenceAfterMovementChange();
      setConfirmDelete(false);
      toast({
        message: "Movimento apagado",
        actionLabel: "Desfazer",
        onAction: () => {
          restoreMovement(deleted);
          syncIntelligenceAfterMovementChange();
        },
      });
      router.back();
    } catch (error) {
      actionLockRef.current = false;
      setConfirmDelete(false);
      toast({
        message: error instanceof Error ? error.message : "Não foi possível apagar o movimento.",
        tone: "error",
      });
    }
  }, [movement, router, toast]);

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>
              {movement ? "Editar movimento" : "Novo movimento"}
            </Text>
            <IconButton icon={X} label="Fechar" onPress={() => router.back()} />
          </View>

          <SegmentedControl
            options={TYPE_OPTIONS}
            value={type}
            onChange={movement?.origin === "manual" ? setType : () => undefined}
          />

          <View style={styles.amountWrap}>
            <MoneyText
              value={amount}
              size="hero"
              tone={type === "income" ? "income" : "default"}
            />
          </View>

          <Panel padded={false} style={styles.notePanel}>
            <View style={styles.noteRow}>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Nota"
                placeholderTextColor={colors.textMuted}
                style={styles.noteInput}
                returnKeyType="done"
              />
              {suggestion ? (
                <CategorySuggestChip
                  category={suggestion}
                  applied={suggestion === category}
                  onPress={() => setCategory(suggestion)}
                />
              ) : null}
            </View>
          </Panel>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Categoria</Text>
            <CategoryChips
              categories={CATEGORIES}
              value={category}
              onChange={(next) => {
                setCategory(next);
                setCategoryTouched(true);
              }}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Rápidos · um toque guarda</Text>
            {quickChips.length > 0 ? (
              <QuickChips
                items={quickChips.map((chip) => ({
                  key: chip.key,
                  label: chip.label,
                  highlighted: chip.highlighted,
                }))}
                onSelect={(key) => {
                  const chip = quickChips.find((item) => item.key === key);
                  if (chip) {
                    applyQuickChip(chip);
                  }
                }}
              />
            ) : (
              <Text style={styles.empty}>
                Os atalhos aparecem depois de registares alguns movimentos.
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Data</Text>
            <DayChips
              value={date}
              today={today}
              onChange={setDate}
              onCustomPress={() => setShowPicker(true)}
            />
          </View>

          <AmountKeypad
            onDigit={(key) =>
              setDigits((current) =>
                current === "0" ? key : (current + key).slice(0, 12),
              )
            }
            onBackspace={() => setDigits((current) => current.slice(0, -1))}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Guardar movimento"
            onPress={handleSave}
            style={styles.saveWrap}
          >
            <LinearGradient
              colors={gradients.primary.colors}
              start={gradients.primary.start}
              end={gradients.primary.end}
              style={styles.saveButton}
            >
              <Text style={styles.saveLabel}>Guardar</Text>
            </LinearGradient>
          </Pressable>

          {movement?.origin === "manual" ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setConfirmDelete(true)}
              style={styles.deleteButton}
            >
              <Trash color={colors.warn} size={18} strokeWidth={2} />
              <Text style={styles.deleteLabel}>Apagar movimento</Text>
            </Pressable>
          ) : null}
          {movement && movement.origin !== "manual" ? (
            <Text style={styles.linkedHint}>
              Este movimento pertence a um pagamento. Edita ou apaga-o no módulo de origem.
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      {showPicker ? (
        <DateTimePicker
          value={parseISO(date)}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(_event, selected) => {
            setShowPicker(false);
            if (selected) {
              setDate(toISO(selected));
            }
          }}
        />
      ) : null}

      <ConfirmSheet
        visible={confirmDelete}
        title="Apagar movimento"
        message="O movimento será removido e os pagamentos ligados deixam de estar associados a ele."
        confirmLabel="Apagar"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 48,
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.text,
  },
  amountWrap: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  notePanel: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  noteInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
    padding: 0,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  saveWrap: {
    borderRadius: 28,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    shadowColor: "rgba(60,116,245,.4)",
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  saveButton: {
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  saveLabel: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.text,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 44,
    paddingVertical: spacing.md,
  },
  deleteLabel: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.warn,
  },
  linkedHint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});
