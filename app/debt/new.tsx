import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';

import { formatDayMonthPt, isValidDate, parseISO, toISO, todayISO } from '../../src/domain/dates';
import { AmountKeypad } from '../../src/ui/components/AmountKeypad';
import { IconButton } from '../../src/ui/components/IconButton';
import { MoneyText } from '../../src/ui/components/MoneyText';
import { Panel } from '../../src/ui/components/Panel';
import { ScreenBackground } from '../../src/ui/components/ScreenBackground';
import { SegmentedControl } from '../../src/ui/components/SegmentedControl';
import { useToast } from '../../src/ui/components/Toast';
import { colors, fonts, gradients, spacing } from '../../src/ui/theme';
import { getDebt } from '../../src/repos/debts';
import { useDebts } from '../../src/features/debts/useDebts';

type Kind = 'owe' | 'owed';

export default function DebtFormScreen() {
  const router = useRouter();
  const toast = useToast();
  const { create, update } = useDebts();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const existing = typeof id === 'string' ? getDebt(id) : null;
  const today = todayISO();

  const [kind, setKind] = useState<Kind>(existing?.kind ?? 'owe');
  const [party, setParty] = useState(existing?.party ?? '');
  const [digits, setDigits] = useState(existing ? String(existing.total) : '');
  const [loanDate, setLoanDate] = useState(existing?.loan_date ?? today);
  const [dueDate, setDueDate] = useState<string | null>(existing?.due_date ?? null);
  const [note, setNote] = useState(existing?.note ?? '');
  const [showPicker, setShowPicker] = useState<'loan' | 'due' | null>(null);

  const total = digits.length > 0 ? Number(digits) : 0;
  const valid = party.trim().length > 0 && total > 0 && isValidDate(loanDate) && (dueDate === null || isValidDate(dueDate));

  const handleSave = () => {
    if (!valid) {
      toast({ message: 'Indica quem, o valor e as datas' });
      return;
    }

    const input = {
      kind,
      party: party.trim(),
      total,
      loanDate,
      dueDate,
      note: note.trim().length > 0 ? note.trim() : null,
    };

    if (existing) {
      update(existing.id, input);
      toast({ message: 'Dívida atualizada' });
      router.back();
      return;
    }

    create(input);
    toast({ message: 'Dívida registada' });
    router.back();
  };

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>{existing ? 'Editar dívida' : 'Nova dívida'}</Text>
            <IconButton icon={X} label="Fechar" onPress={() => router.back()} />
          </View>

          <SegmentedControl
            options={[
              { value: 'owe', label: 'Devo' },
              { value: 'owed', label: 'Devem-me' },
            ]}
            value={kind}
            onChange={setKind}
          />

          <View style={styles.amountWrap}>
            <MoneyText value={total} size="hero" />
          </View>

          <AmountKeypad
            onDigit={(key) => setDigits((current) => (current === '0' ? key : (current + key).slice(0, 12)))}
            onBackspace={() => setDigits((current) => current.slice(0, -1))}
          />

          <Panel>
            <Text style={styles.label}>Pessoa ou entidade</Text>
            <TextInput
              value={party}
              onChangeText={setParty}
              placeholder="Ex.: Carlos"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              returnKeyType="done"
            />
          </Panel>

          <View style={styles.section}>
            <Text style={styles.label}>Datas</Text>
            <View style={styles.chipRow}>
              <DateChip label={`Empréstimo ${formatDayMonthPt(loanDate)}`} onPress={() => setShowPicker('loan')} />
              <DateChip
                label={dueDate ? `Vence ${formatDayMonthPt(dueDate)}` : 'Sem vencimento'}
                onPress={() => setShowPicker('due')}
              />
              {dueDate ? <DateChip label="Remover vencimento" onPress={() => setDueDate(null)} /> : null}
            </View>
          </View>

          <Panel>
            <Text style={styles.label}>Nota</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Opcional"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              returnKeyType="done"
            />
          </Panel>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Guardar dívida"
            accessibilityState={{ disabled: !valid }}
            disabled={!valid}
            onPress={handleSave}
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

      {showPicker !== null ? (
        <DateTimePicker
          value={parseISO(showPicker === 'loan' ? loanDate : (dueDate ?? today))}
          mode="date"
          display="default"
          onChange={(_event, selected) => {
            const target = showPicker;
            setShowPicker(null);
            if (selected && target === 'loan') {
              setLoanDate(toISO(selected));
            } else if (selected && target === 'due') {
              setDueDate(toISO(selected));
            }
          }}
        />
      ) : null}
    </View>
  );
}

function DateChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <LinearGradient
        colors={gradients.panel.colors}
        start={gradients.panel.start}
        end={gradients.panel.end}
        style={styles.chip}
      >
        <Text style={styles.chipText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.text,
  },
  amountWrap: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  input: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
    padding: 0,
    marginTop: spacing.xs,
  },
  section: {
    gap: 8,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.panelBorder,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveLabel: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.text,
  },
});
