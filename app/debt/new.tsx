import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';

import { formatDayMonthPt, isValidDate, parseISO, toISO, todayISO } from '../../src/domain/dates';
import { TecladoValor } from '../../src/ui/componentes/TecladoValor';
import { BotaoIcone } from '../../src/ui/componentes/BotaoIcone';
import { TextoValor } from '../../src/ui/componentes/TextoValor';
import { Painel } from '../../src/ui/componentes/Painel';
import { FundoEcra } from '../../src/ui/componentes/FundoEcra';
import { ControloSegmentado } from '../../src/ui/componentes/ControloSegmentado';
import { useAvisoRapido } from '../../src/ui/componentes/AvisoRapido';
import { fonts, spacing, useTema, useEstilosTema, type Cores } from '../../src/ui/tema';
import { getDebt } from '../../src/repos/debts';
import { useDividas } from '../../src/features/dividas/useDividas';

type Kind = 'owe' | 'owed';

export default function DebtFormScreen() {
  const { colors, gradients } = useTema();
  const styles = useEstilosTema(makeStyles);
  const router = useRouter();
  const toast = useAvisoRapido();
  const { create, update } = useDividas();
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

  const guardar = () => {
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
      <FundoEcra />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>{existing ? 'Editar dívida' : 'Nova dívida'}</Text>
            <BotaoIcone icon={X} label="Fechar" onPress={() => router.back()} />
          </View>

          <ControloSegmentado
            options={[
              { value: 'owe', label: 'Devo' },
              { value: 'owed', label: 'Devem-me' },
            ]}
            value={kind}
            onChange={setKind}
          />

          <View style={styles.amountWrap}>
            <TextoValor value={total} size="hero" />
          </View>

          <TecladoValor
            onDigit={(key) => setDigits((current) => (current === '0' ? key : (current + key).slice(0, 12)))}
            onBackspace={() => setDigits((current) => current.slice(0, -1))}
          />

          <Painel>
            <Text style={styles.label}>Pessoa ou entidade</Text>
            <TextInput
              value={party}
              onChangeText={setParty}
              placeholder="Ex.: Carlos"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              returnKeyType="done"
            />
          </Painel>

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

          <Painel>
            <Text style={styles.label}>Nota</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Opcional"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              returnKeyType="done"
            />
          </Painel>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Guardar dívida"
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
  const { gradients } = useTema();
  const styles = useEstilosTema(makeStyles);

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
