import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Lock, Wallet, X } from 'lucide-react-native';

import { formatKz } from '../src/domain/money';
import { AmountKeypad } from '../src/ui/components/AmountKeypad';
import { IconButton } from '../src/ui/components/IconButton';
import { IconTile } from '../src/ui/components/IconTile';
import { Panel } from '../src/ui/components/Panel';
import { ScreenBackground } from '../src/ui/components/ScreenBackground';
import { Switch } from '../src/ui/components/Switch';
import { useToast } from '../src/ui/components/Toast';
import { colors, fonts, gradients, radius, spacing } from '../src/ui/theme';
import { useMonthlyLimit } from '../src/features/settings/useSettings';
import { useLockState } from '../src/features/security/useLockState';

export default function SettingsScreen() {
  const router = useRouter();
  const toast = useToast();
  const { limit, setLimit } = useMonthlyLimit();
  const { hasPin, enabled, setEnabled, setPin, removePin } = useLockState();

  const [value, setValue] = useState(limit === null ? '' : String(limit));
  const [pinSheet, setPinSheet] = useState(false);

  const parsed = Number(value.replace(/[\s.]/g, ''));

  const handleSaveLimit = () => {
    if (value.trim().length === 0 || !Number.isFinite(parsed) || parsed <= 0) {
      setLimit(null);
      toast({ message: 'Limite removado' });
    } else {
      setLimit(parsed);
      toast({ message: `Limite definido em ${formatKz(parsed)}` });
    }
    router.back();
  };

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Definições</Text>
          <IconButton icon={X} label="Fechar" onPress={() => router.back()} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconTile icon={Wallet} size={40} />
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Limite mensal</Text>
              <Text style={styles.cardMeta}>Usado no resumo e no valor que podes gastar por dia.</Text>
            </View>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              style={styles.input}
            />
            <Text style={styles.suffix}>Kz</Text>
          </View>

          <Text style={styles.hint}>
            {limit === null ? 'Sem limite definido.' : `Limite atual: ${formatKz(limit)}.`} Deixa vazio para remover.
          </Text>

          <Pressable accessibilityRole="button" onPress={handleSaveLimit} style={styles.saveWrap}>
            <LinearGradient
              colors={gradients.primary.colors}
              start={gradients.primary.start}
              end={gradients.primary.end}
              style={styles.saveButton}
            >
              <Text style={styles.saveLabel}>Guardar</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconTile icon={Lock} size={40} />
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Segurança</Text>
              <Text style={styles.cardMeta}>
                O PIN protege o acesso à aplicação. Os dados continuam apenas no telemóvel.
              </Text>
            </View>
          </View>

          {hasPin ? (
            <>
              <View style={styles.toggleRow}>
                <View style={styles.toggleText}>
                  <Text style={styles.toggleTitle}>Exigir PIN ao abrir</Text>
                  <Text style={styles.toggleSubtitle}>Pede o PIN sempre que a aplicação inicia</Text>
                </View>
                <Switch value={enabled} onValueChange={setEnabled} label="Exigir PIN ao abrir" />
              </View>

              <View style={styles.buttonRow}>
                <Pressable accessibilityRole="button" onPress={() => setPinSheet(true)} style={styles.secondaryButton}>
                  <Text style={styles.secondaryLabel}>Alterar PIN</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    removePin();
                    toast({ message: 'PIN removido' });
                  }}
                  style={[styles.secondaryButton, styles.dangerButton]}
                >
                  <Text style={styles.dangerLabel}>Remover PIN</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Pressable accessibilityRole="button" onPress={() => setPinSheet(true)} style={styles.primaryButton}>
              <LinearGradient
                colors={gradients.primary.colors}
                start={gradients.primary.start}
                end={gradients.primary.end}
                style={styles.saveButton}
              >
                <Text style={styles.saveLabel}>Definir PIN</Text>
              </LinearGradient>
            </Pressable>
          )}
        </View>
      </ScrollView>

      <PinSheet
        visible={pinSheet}
        onCancel={() => setPinSheet(false)}
        onConfirm={async (pin) => {
          await setPin(pin);
          setPinSheet(false);
          toast({ message: 'PIN definido' });
        }}
      />
    </View>
  );
}

function PinSheet({
  visible,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (pin: string) => Promise<void>;
}) {
  const [first, setFirst] = useState('');
  const [confirming, setConfirming] = useState('');
  const [step, setStep] = useState<'first' | 'confirm'>('first');
  const [error, setError] = useState(false);

  const digits = step === 'first' ? first : confirming;

  const handleDigit = (key: string) => {
    setError(false);
    if (step === 'first') {
      const next = (first + key).slice(0, 4);
      setFirst(next);
      if (next.length === 4) {
        setStep('confirm');
      }
      return;
    }

    const next = (confirming + key).slice(0, 4);
    setConfirming(next);
    if (next.length === 4) {
      if (next === first) {
        void onConfirm(next);
        return;
      }
      setError(true);
      setConfirming('');
    }
  };

  const reset = () => {
    setFirst('');
    setConfirming('');
    setStep('first');
    setError(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        reset();
        onCancel();
      }}
    >
      <View style={styles.sheetRoot}>
        <ScreenBackground />
        <View style={styles.sheetBody}>
          <View style={styles.header}>
            <Text style={styles.title}>{step === 'first' ? 'Novo PIN' : 'Confirma o PIN'}</Text>
            <IconButton
              icon={X}
              label="Cancelar"
              onPress={() => {
                reset();
                onCancel();
              }}
            />
          </View>

          <View style={styles.pinWrap}>
            {[0, 1, 2, 3].map((index) => (
              <View key={index} style={[styles.pinDot, index < digits.length && styles.pinDotFilled]} />
            ))}
          </View>

          {error ? <Text style={styles.error}>Os PIN não coincidem. Tenta outra vez.</Text> : null}

          <AmountKeypad
            onDigit={handleDigit}
            onBackspace={() => {
              setError(false);
              if (step === 'first') {
                setFirst((prev) => prev.slice(0, -1));
              } else {
                setConfirming((prev) => prev.slice(0, -1));
              }
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.text,
  },
  card: {
    borderRadius: radius.panel,
    borderWidth: 1,
    borderColor: colors.panelBorder,
    backgroundColor: colors.bgMid,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  cardMeta: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    marginTop: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: spacing.lg,
  },
  input: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.text,
    padding: 0,
  },
  suffix: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textMuted,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  saveWrap: {
    borderRadius: 28,
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
  primaryButton: {
    borderRadius: 28,
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
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
  },
  dangerButton: {
    borderColor: 'rgba(255,181,71,.4)',
  },
  dangerLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.warn,
  },
  sheetRoot: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  sheetBody: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  pinWrap: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
  },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  pinDotFilled: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.warn,
    textAlign: 'center',
  },
});
