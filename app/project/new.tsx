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
import { useToast } from '../../src/ui/components/Toast';
import { colors, fonts, gradients, spacing } from '../../src/ui/theme';
import { getProject } from '../../src/repos/projects';
import { useProjects } from '../../src/features/projects/useProjects';

export default function ProjectFormScreen() {
  const router = useRouter();
  const toast = useToast();
  const { create, update } = useProjects();
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

  const handleSave = () => {
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
      <ScreenBackground />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>{existing ? 'Editar projeto' : 'Novo projeto'}</Text>
            <IconButton icon={X} label="Fechar" onPress={() => router.back()} />
          </View>

          <View style={styles.amountWrap}>
            <MoneyText value={total} size="hero" />
          </View>

          <AmountKeypad
            onDigit={(key) => setDigits((current) => (current === '0' ? key : (current + key).slice(0, 12)))}
            onBackspace={() => setDigits((current) => current.slice(0, -1))}
          />

          <Panel>
            <Text style={styles.label}>Nome do projeto</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ex.: Site da loja"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              returnKeyType="done"
            />
          </Panel>

          <Panel>
            <Text style={styles.label}>Cliente</Text>
            <TextInput
              value={client}
              onChangeText={setClient}
              placeholder="Opcional"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              returnKeyType="done"
            />
          </Panel>

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

          <Pressable onPress={handleSave} style={[styles.saveWrap, !valid && styles.saveDisabled]}>
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
