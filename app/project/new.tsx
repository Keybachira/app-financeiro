import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
  const { colors } = useTema();
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
            <Text style={styles.amountLabel}>Valor do projeto</Text>
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

            <Text style={[styles.label, styles.labelGap]}>Cliente</Text>
            <TextInput
              value={client}
              onChangeText={setClient}
              placeholder="Opcional"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              returnKeyType="done"
            />

            <Text style={[styles.label, styles.labelGap]}>Nota</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Opcional"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              returnKeyType="done"
            />
          </Painel>

          <Painel>
            <Text style={styles.label}>Entrega</Text>
            <View style={styles.chipRow}>
              <DayChip
                label={dueDate ? formatDayMonthPt(dueDate) : 'Sem data'}
                active={dueDate !== null}
                onPress={() => setShowPicker(true)}
              />
              {dueDate ? <DayChip label="Remover" active={false} onPress={() => setDueDate(null)} /> : null}
            </View>
          </Painel>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Guardar projeto"
            accessibilityState={{ disabled: !valid }}
            disabled={!valid}
            onPress={guardar}
            style={({ pressed }) => [styles.saveButton, !valid && styles.saveDisabled, pressed && styles.pressed]}
          >
            <Text style={styles.saveLabel}>Guardar projeto</Text>
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
  const styles = useEstilosTema(makeStyles);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
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
      fontFamily: fonts.medium,
      fontSize: 22,
      letterSpacing: -0.4,
      color: colors.text,
    },
    amountWrap: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
      gap: 4,
    },
    amountLabel: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
    },
    label: {
      fontFamily: fonts.regular,
      fontSize: 11,
      color: colors.textMuted,
    },
    labelGap: {
      marginTop: 16,
    },
    input: {
      fontFamily: fonts.medium,
      fontSize: 16,
      color: colors.text,
      paddingVertical: 10,
      paddingHorizontal: 0,
      borderBottomWidth: 1.5,
      borderBottomColor: colors.panelBorder,
    },
    chipRow: {
      flexDirection: 'row',
      gap: 6,
      flexWrap: 'wrap',
      marginTop: 10,
    },
    chip: {
      height: 34,
      borderRadius: 17,
      paddingHorizontal: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.iconTileBg,
    },
    chipActive: {
      backgroundColor: colors.accent,
    },
    chipText: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
    },
    chipTextActive: {
      fontFamily: fonts.medium,
      color: '#fff',
    },
    saveButton: {
      height: 50,
      borderRadius: 25,
      marginTop: spacing.sm,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveDisabled: {
      opacity: 0.5,
    },
    pressed: {
      opacity: 0.85,
    },
    saveLabel: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: '#fff',
    },
  });
