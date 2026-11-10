import { useEffect, useRef, useState } from "react";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { CalendarDays, X } from "lucide-react-native";

import {
  formatDayMonthPt,
  isValidDate,
  parseISO,
  toISO,
  todayISO,
} from "../../src/domain/dates";
import { TecladoValor } from "../../src/ui/componentes/TecladoValor";
import { BotaoIcone } from "../../src/ui/componentes/BotaoIcone";
import { TextoValor } from "../../src/ui/componentes/TextoValor";
import { Painel } from "../../src/ui/componentes/Painel";
import { FundoEcra } from "../../src/ui/componentes/FundoEcra";
import { useAvisoRapido } from "../../src/ui/componentes/AvisoRapido";
import { fonts, radius, spacing, useTema, useEstilosTema, type Cores } from "../../src/ui/tema";
import { getGoal } from "../../src/repos/goals";
import { useMetas } from "../../src/features/metas/useMetas";

export default function GoalFormScreen() {
  const { colors, gradients } = useTema();
  const styles = useEstilosTema(makeStyles);
  const router = useRouter();
  const toast = useAvisoRapido();
  const { create, update } = useMetas();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const existing = typeof id === "string" ? getGoal(id) : null;
  const today = todayISO();

  const [name, setName] = useState(existing?.name ?? "");
  const [digits, setDigits] = useState(existing ? String(existing.target) : "");
  const [deadline, setDeadline] = useState<string | null>(
    existing?.deadline ?? null,
  );
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setDigits(String(existing.target));
      setDeadline(existing.deadline);
    }
  }, [existing?.id, existing?.name, existing?.target, existing?.deadline]);

  const target = digits.length > 0 ? Number(digits) : 0;
  const nameValid = name.trim().length > 0;
  const valid =
    nameValid && target > 0 && (deadline === null || isValidDate(deadline));

  const guardar = () => {
    if (!valid) {
      toast({ message: "Dá um nome e um valor à meta" });
      return;
    }

    const input = { name: name.trim(), target, deadline };

    if (existing) {
      update(existing.id, input);
      toast({ message: "Meta atualizada" });
    } else {
      const created = create(input);
      toast({ message: "Meta criada" });
      router.replace(`/goal/${created.id}`);
      return;
    }

    router.back();
  };

  return (
    <View style={styles.root}>
      <FundoEcra />
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
              {existing ? "Editar meta" : "Nova meta"}
            </Text>
            <BotaoIcone icon={X} label="Fechar" onPress={() => router.back()} />
          </View>

          <Painel>
            <Text style={styles.label}>Nome</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ex.: Computador novo"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              returnKeyType="done"
            />
          </Painel>

          <View style={styles.amountBlock}>
            <Text style={styles.labelCenter}>Valor da meta</Text>
            <TextoValor value={target} size="hero" />
          </View>

          <TecladoValor
            onDigit={(key) =>
              setDigits((current) =>
                current === "0" ? key : (current + key).slice(0, 12),
              )
            }
            onBackspace={() => setDigits((current) => current.slice(0, -1))}
          />

          <View style={styles.section}>
            <Text style={styles.label}>Prazo</Text>
            <View style={styles.chipRow}>
              <DayChip
                label="Sem prazo"
                active={deadline === null}
                onPress={() => setDeadline(null)}
              />
              <DayChip
                label={deadline ? formatDayMonthPt(deadline) : "Escolher data"}
                active={deadline !== null}
                onPress={() => setShowPicker(true)}
              />
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Guardar meta"
            accessibilityState={{ disabled: !valid }}
            disabled={!valid}
            onPress={guardar}
            style={[styles.saveWrap, !valid && styles.saveDisabled]}
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
        </ScrollView>
      </KeyboardAvoidingView>

      {showPicker ? (
        <DateTimePicker
          value={deadline ? parseISO(deadline) : new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(_event, selected) => {
            setShowPicker(false);
            if (selected) {
              setDeadline(toISO(selected));
            }
          }}
        />
      ) : null}
    </View>
  );
}

function DayChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors, gradients } = useTema();
  const styles = useEstilosTema(makeStyles);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
    >
      <LinearGradient
        colors={active ? gradients.primary.colors : gradients.panel.colors}
        start={active ? gradients.primary.start : gradients.panel.start}
        end={active ? gradients.primary.end : gradients.panel.end}
        style={[styles.chip, !active && styles.chipMuted]}
      >
        {active ? (
          <CalendarDays color={colors.text} size={14} strokeWidth={2} />
        ) : null}
        <Text style={[styles.chipText, !active && styles.chipTextMuted]}>
          {label}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

const makeStyles = (colors: Cores) =>
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
  label: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  labelCenter: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
  },
  input: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
    padding: 0,
    marginTop: spacing.xs,
  },
  amountBlock: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  section: {
    gap: 8,
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  chip: {
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chipMuted: {
    borderWidth: 1,
    borderColor: colors.panelBorder,
  },
  chipText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
  },
  chipTextMuted: {
    fontFamily: fonts.regular,
  },
  saveWrap: {
    borderRadius: 28,
    marginTop: spacing.md,
  },
  saveDisabled: {
    opacity: 0.5,
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
});
