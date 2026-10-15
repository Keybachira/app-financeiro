import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';

import { CATEGORIES, DEFAULT_CATEGORY } from '../../src/domain/categories';
import { AmountKeypad } from '../../src/ui/components/AmountKeypad';
import { CategoryChips } from '../../src/ui/components/CategoryChips';
import { IconButton } from '../../src/ui/components/IconButton';
import { MoneyText } from '../../src/ui/components/MoneyText';
import { Panel } from '../../src/ui/components/Panel';
import { ScreenBackground } from '../../src/ui/components/ScreenBackground';
import { Switch } from '../../src/ui/components/Switch';
import { useToast } from '../../src/ui/components/Toast';
import { colors, fonts, gradients, spacing } from '../../src/ui/theme';
import { getBill } from '../../src/repos/bills';
import { useBills } from '../../src/features/bills/useBills';

const DAY_CHIPS = [1, 5, 10, 15, 20, 25, 28, 30];
const REMIND_CHIPS = [0, 1, 2, 3, 7];

export default function BillFormScreen() {
  const router = useRouter();
  const toast = useToast();
  const { create, update, toggleActive } = useBills();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const existing = typeof id === 'string' ? getBill(id) : null;

  const [name, setName] = useState(existing?.name ?? '');
  const [digits, setDigits] = useState(existing ? String(existing.amount) : '');
  const [day, setDay] = useState<number | null>(existing?.day_of_month ?? null);
  const [category, setCategory] = useState(existing?.category ?? DEFAULT_CATEGORY);
  const [remind, setRemind] = useState(existing?.remind_days_before ?? 1);
  const [active, setActive] = useState(existing ? existing.active === 1 : true);

  const amount = digits.length > 0 ? Number(digits) : 0;
  const valid = name.trim().length > 0 && amount > 0 && day !== null;

  const handleSave = () => {
    if (!valid || day === null) {
      toast({ message: 'Indica nome, valor e dia da conta' });
      return;
    }

    const input = {
      name: name.trim(),
      amount,
      dayOfMonth: day,
      remindDaysBefore: remind,
      category,
      icon: null,
    };

    if (existing) {
      update(existing.id, input);
      toggleActive(existing.id, active);
      toast({ message: 'Conta atualizada' });
    } else {
      create(input);
      toast({ message: 'Conta criada' });
    }

    router.back();
  };

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>{existing ? 'Editar conta' : 'Nova conta'}</Text>
            <IconButton icon={X} label="Fechar" onPress={() => router.back()} />
          </View>

          <View style={styles.amountWrap}>
            <MoneyText value={amount} size="hero" />
          </View>

          <AmountKeypad
            onDigit={(key) => setDigits((current) => (current === '0' ? key : (current + key).slice(0, 12)))}
            onBackspace={() => setDigits((current) => current.slice(0, -1))}
          />

          <Panel>
            <Text style={styles.label}>Nome</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ex.: Água"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              returnKeyType="done"
            />
          </Panel>

          <Panel>
            <Text style={styles.label}>Dia do mês</Text>
            <View style={styles.chipRow}>
              {DAY_CHIPS.map((value) => (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: day === value }}
                  onPress={() => setDay(value)}
                >
                  <LinearGradient
                    colors={day === value ? gradients.primary.colors : gradients.panel.colors}
                    start={day === value ? gradients.primary.start : gradients.panel.start}
                    end={day === value ? gradients.primary.end : gradients.panel.end}
                    style={[styles.chip, day !== value && styles.chipMuted]}
                  >
                    <Text style={[styles.chipText, day === value && styles.chipTextActive]}>{String(value)}</Text>
                  </LinearGradient>
                </Pressable>
              ))}
            </View>
          </Panel>

          <View style={styles.section}>
            <Text style={styles.label}>Categoria</Text>
            <CategoryChips categories={CATEGORIES} value={category} onChange={setCategory} />
          </View>

          <Panel>
            <Text style={styles.label}>Lembrar antes</Text>
            <View style={styles.chipRow}>
              {REMIND_CHIPS.map((value) => (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: remind === value }}
                  onPress={() => setRemind(value)}
                >
                  <LinearGradient
                    colors={remind === value ? gradients.primary.colors : gradients.panel.colors}
                    start={remind === value ? gradients.primary.start : gradients.panel.start}
                    end={remind === value ? gradients.primary.end : gradients.panel.end}
                    style={[styles.chip, remind !== value && styles.chipMuted]}
                  >
                    <Text style={[styles.chipText, remind === value && styles.chipTextActive]}>
                      {value === 0 ? 'No dia' : `${value}d`}
                    </Text>
                  </LinearGradient>
                </Pressable>
              ))}
            </View>
          </Panel>

          {existing ? (
            <Panel>
              <View style={styles.toggleRow}>
                <View style={styles.toggleText}>
                  <Text style={styles.toggleTitle}>Conta ativa</Text>
                  <Text style={styles.toggleSubtitle}>Contas inativas não contam para o valor diário</Text>
                </View>
                <Switch value={active} onValueChange={setActive} label="Conta ativa" />
              </View>
            </Panel>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Guardar conta fixa"
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
    </View>
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.md,
  },
  chip: {
    height: 36,
    minWidth: 44,
    paddingHorizontal: 14,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipMuted: {
    borderWidth: 1,
    borderColor: colors.panelBorder,
  },
  chipText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
  chipTextActive: {
    fontFamily: fonts.bold,
  },
  section: {
    gap: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  toggleText: {
    flex: 1,
  },
  toggleTitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
  toggleSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
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
