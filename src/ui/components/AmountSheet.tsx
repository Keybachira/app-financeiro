import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X } from 'lucide-react-native';

import { formatKz } from '../../domain/money';
import { AmountKeypad } from './AmountKeypad';
import { IconButton } from './IconButton';
import { MoneyText } from './MoneyText';
import { ScreenBackground } from './ScreenBackground';
import { colors, fonts, gradients, radius, spacing } from '../theme';

export function AmountSheet({
  visible,
  title,
  confirmLabel = 'Confirmar',
  helper,
  maxAmount,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  confirmLabel?: string;
  helper?: string;
  maxAmount?: number;
  onCancel: () => void;
  onConfirm: (amount: number) => void;
}) {
  const [digits, setDigits] = useState('');

  useEffect(() => {
    if (visible) {
      setDigits('');
    }
  }, [visible]);

  const amount = digits.length > 0 ? Number(digits) : 0;
  const exceedsMax = maxAmount !== undefined && amount > maxAmount;
  const invalid = amount <= 0 || exceedsMax;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.root}>
        <ScreenBackground />
        <View style={styles.body}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <IconButton icon={X} label="Cancelar" onPress={onCancel} />
          </View>

          <View style={styles.amountWrap}>
            <MoneyText value={amount} size="hero" />
          </View>

          <Text style={[styles.helper, exceedsMax && styles.helperWarn]}>
            {exceedsMax ? `Máximo ${formatKz(maxAmount ?? 0)}` : (helper ?? '')}
          </Text>

          <AmountKeypad
            onDigit={(key) => setDigits((current) => (current === '0' ? key : (current + key).slice(0, 12)))}
            onBackspace={() => setDigits((current) => current.slice(0, -1))}
          />

          <Pressable
            accessibilityRole="button"
            disabled={invalid}
            onPress={() => {
              onConfirm(amount);
              setDigits('');
            }}
            style={[styles.saveWrap, invalid && styles.saveDisabled]}
          >
            <LinearGradient
              colors={gradients.primary.colors}
              start={gradients.primary.start}
              end={gradients.primary.end}
              style={styles.saveButton}
            >
              <Text style={styles.saveLabel}>{confirmLabel}</Text>
            </LinearGradient>
          </Pressable>
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
  body: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.sm,
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
    paddingVertical: spacing.md,
  },
  helper: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  helperWarn: {
    color: colors.warn,
    fontFamily: fonts.medium,
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
