import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';

import { formatShortPt, todayISO } from '../src/domain/dates';
import { nextSalaryDate } from '../src/domain/salary';
import { AmountKeypad } from '../src/ui/components/AmountKeypad';
import { IconButton } from '../src/ui/components/IconButton';
import { MoneyText } from '../src/ui/components/MoneyText';
import { Panel } from '../src/ui/components/Panel';
import { ScreenBackground } from '../src/ui/components/ScreenBackground';
import { Switch } from '../src/ui/components/Switch';
import { useToast } from '../src/ui/components/Toast';
import { colors, fonts, gradients, spacing } from '../src/ui/theme';
import { useSalary } from '../src/features/salary/useSalary';

const DAY_CHIPS = [1, 5, 10, 15, 20, 25, 28, 30];

export default function SalaryScreen() {
  const router = useRouter();
  const toast = useToast();
  const { settings, save } = useSalary();
  const today = todayISO();

  const [digits, setDigits] = useState(settings.amount === null ? '' : String(settings.amount));
  const [day, setDay] = useState<number | null>(settings.day);
  const [adjust, setAdjust] = useState(settings.adjustBusinessDay);
  const [auto, setAuto] = useState(settings.autoIncome);

  const amount = digits.length > 0 ? Number(digits) : 0;
  const valid = amount > 0 && day !== null;

  const preview =
    day === null ? null : nextSalaryDate({ salaryDay: day, adjustBusinessDay: adjust, today });

  const handleSave = () => {
    if (!valid) {
      toast({ message: 'Indica o valor e o dia do salário' });
      return;
    }

    save({ amount, day, adjustBusinessDay: adjust, autoIncome: auto });
    toast({ message: 'Salário atualizado' });
    router.back();
  };

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Salário</Text>
            <IconButton icon={X} label="Fechar" onPress={() => router.back()} />
          </View>

          <Panel>
            <Text style={styles.label}>Valor mensal</Text>
            <MoneyText value={amount} size="hero" />
          </Panel>

          <AmountKeypad
            onDigit={(key) => setDigits((current) => (current === '0' ? key : (current + key).slice(0, 12)))}
            onBackspace={() => setDigits((current) => current.slice(0, -1))}
          />

          <Panel>
            <Text style={styles.label}>Dia em que cai</Text>
            <View style={styles.daysRow}>
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
                    style={[styles.dayChip, day !== value && styles.dayChipMuted]}
                  >
                    <Text style={[styles.dayText, day === value && styles.dayTextActive]}>{String(value)}</Text>
                  </LinearGradient>
                </Pressable>
              ))}
            </View>
          </Panel>

          <Panel>
            <ToggleRow
              title="Ajustar ao dia útil"
              subtitle="Se cair ao fim de semana, conta na sexta"
              value={adjust}
              onChange={setAdjust}
            />
            <View style={styles.separator} />
            <ToggleRow
              title="Lançar como receita"
              subtitle="Regista nos movimentos no dia certo"
              value={auto}
              onChange={setAuto}
            />
          </Panel>

          <Panel style={styles.previewCard}>
            <Text style={styles.label}>Próximo salário</Text>
            {preview ? (
              <Text style={styles.previewValue}>{formatShortPt(preview)}</Text>
            ) : (
              <Text style={styles.previewEmpty}>Escolhe o dia do salário</Text>
            )}
          </Panel>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Guardar salário"
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

function ToggleRow({
  title,
  subtitle,
  value,
  onChange,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleText}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleSubtitle}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} label={title} />
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
    fontSize: 28,
    color: colors.text,
    letterSpacing: -0.5,
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.md,
  },
  dayChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipMuted: {
    borderWidth: 1,
    borderColor: colors.panelBorder,
  },
  dayText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
  dayTextActive: {
    fontFamily: fonts.bold,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
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
    fontSize: 13,
    color: colors.textMuted,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,.08)',
  },
  previewCard: {
    gap: 4,
  },
  previewValue: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.accentSoft,
  },
  previewEmpty: {
    fontFamily: fonts.regular,
    fontSize: 15,
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
