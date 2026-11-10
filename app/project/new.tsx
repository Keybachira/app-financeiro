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
import { useAvisoRapido } from '../../src/ui/componentes/AvisoRapido';
import { fonts, spacing, useTema, useEstilosTema, type Cores } from '../../src/ui/tema';
import { getProject } from '../../src/repos/projects';
import { useProjetos } from '../../src/features/projetos/useProjetos';

export default function ProjectFormScreen() {
  const { colors, gradients } = useTema();
  const styles = useEstilosTema(makeStyles);
  const router = useRouter();
  const toast = useAvisoRapido();
  const { create, update } = useProjetos();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const existing = typeof id === 'string' ? getProject(id) : null;
  const today = todayISO();

  const [name, setName] = useState(existing?.name ?? '');
  const [client, setClient] = useState(existing?.client ?? '');
  const [digits, setDigits] = useState(existing ? String(existing.total) : '');
  const [dueDate, setDueDate] = useState<string | null>(existing?.due_date ?? null);
  const [note, setNote] = useState(existing?.note ?? '');
  const [showPicker, setShowPicker] = useState(false);

  const total = digits.length > 0 ? Number(digits) : 0;
  const valid = name.trim().length > 0 && total > 0 && (dueDate === null || isValidDate(dueDate));

  const guardar = () => {
    if (!valid) {
      toast({ message: 'Dá um nome e um valor ao projeto' });
      return;
    }

    const input = {
      name: name.trim(),
      client: client.trim().length > 0 ? client.trim() : null,
      total,
      dueDate,
      note: note.trim().length > 0 ? note.trim() : null,
    };

    if (existing) {
      update(existing.id, input);
      toast({ message: 'Projeto atualizado' });
    } else {
      create(input);
      toast({ message: 'Projeto criado' });
    }

    router.back();
  };

  return (
    <View style={styles.root}>
      <FundoEcra />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>{existing ? 'Editar projeto' : 'Novo projeto'}</Text>
            <BotaoIcone icon={X} label="Fechar" onPress={() => router.back()} />
          </View>

          <View style={styles.amountWrap}>
            <TextoValor value={total} size="hero" />
          </View>

          <TecladoValor
            onDigit={(key) => setDigits((current) => (current === '0' ? key : (current + key).slice(0, 12)))}
            onBackspace={() => setDigits((current) => current.slice(0, -1))}
          />

          <Painel>
            <Text style={styles.label}>Nome do projeto</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ex.: Site da loja"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              returnKeyType="done"
            />
          </Painel>

          <Painel>
            <Text style={styles.label}>Cliente</Text>
            <TextInput
              value={client}
              onChangeText={setClient}
              placeholder="Opcional"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              returnKeyType="done"
            />
          </Painel>

          <View style={styles.section}>
            <Text style={styles.label}>Entrega</Text>
            <View style={styles.chipRow}>
              <DayChip
                label={dueDate ? formatDayMonthPt(dueDate) : 'Sem data'}
                active={dueDate !== null}
                onPress={() => setShowPicker(true)}
              />
              {dueDate ? <DayChip label="Remover" active={false} onPress={() => setDueDate(null)} /> : null}
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
            accessibilityLabel="Guardar projeto"
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
          value={parseISO(dueDate ?? today)}
          mode="date"
          display="default"
          onChange={(_event, selected) => {
            setShowPicker(false);
            if (selected) {
              setDueDate(toISO(selected));
            }
          }}
        />
      ) : null}
    </View>
  );
}

function DayChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { gradients } = useTema();
  const styles = useEstilosTema(makeStyles);

  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress}>
      <LinearGradient
        colors={active ? gradients.primary.colors : gradients.panel.colors}
        start={active ? gradients.primary.start : gradients.panel.start}
        end={active ? gradients.primary.end : gradients.panel.end}
        style={[styles.chip, !active && styles.chipMuted]}
      >
        <Text style={[styles.chipText, !active && styles.chipTextMuted]}>{label}</Text>
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
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveLabel: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.text,
  },
});
