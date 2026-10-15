import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Lock } from 'lucide-react-native';

import { AmountKeypad } from '../src/ui/components/AmountKeypad';
import { IconTile } from '../src/ui/components/IconTile';
import { ScreenBackground } from '../src/ui/components/ScreenBackground';
import { colors, fonts, spacing } from '../src/ui/theme';
import { useLockState } from '../src/features/security/useLockState';

export function LockScreen({ onUnlocked }: { onUnlocked?: () => void }) {
  const { unlock } = useLockState();
  const [digits, setDigits] = useState('');
  const [error, setError] = useState(false);

  const attempt = useCallback(
    async (pin: string) => {
      const ok = await unlock(pin);

      if (ok) {
        onUnlocked?.();
        return;
      }

      setError(true);
      setDigits('');
    },
    [unlock, onUnlocked]
  );

  useEffect(() => {
    if (digits.length === 4) {
      void attempt(digits);
    }
  }, [digits, attempt]);

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <View style={styles.body}>
        <View style={styles.header}>
          <IconTile icon={Lock} size={64} iconSize={28} />
          <Text style={styles.title}>Aplicação bloqueada</Text>
          <Text style={styles.subtitle}>Introduz o PIN de 4 dígitos para continuar.</Text>
        </View>

        <View style={styles.pinWrap}>
          {[0, 1, 2, 3].map((index) => (
            <View key={index} style={[styles.pinDot, index < digits.length && styles.pinDotFilled]} />
          ))}
        </View>

        {error ? <Text style={styles.error}>PIN incorreto. Tenta outra vez.</Text> : null}

        <View style={styles.keypad}>
          <AmountKeypad
            onDigit={(key) =>
              // `slice` é obrigatório: a tecla "000" somaria 3 dígitos de uma vez e
// "12" + "000" = "12000" ficaria com 5 caracteres, nunca iguais a 4.
setDigits((current) => (current + key).slice(0, 4))
            }
            onBackspace={() => {
              setError(false);
              setDigits((current) => current.slice(0, -1));
            }}
          />
        </View>
      </View>
    </View>
  );
}

export default LockScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  body: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.lg,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  pinWrap: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
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
  },
  keypad: {
    alignSelf: 'stretch',
    marginTop: spacing.lg,
  },
});
