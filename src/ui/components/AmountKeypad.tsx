import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Delete } from 'lucide-react-native';

import { tapLight, tapMedium } from '../haptics';
import { colors, fonts, gradients, radius, spacing } from '../theme';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'back'];

export function AmountKeypad({
  onDigit,
  onBackspace,
}: {
  onDigit: (key: string) => void;
  onBackspace: () => void;
}) {
  const { width } = useWindowDimensions();
  const keyWidth = (width - spacing.lg * 2 - spacing.sm * 2) / 3;

  return (
    <View style={styles.grid}>
      {KEYS.map((key) => (
        <Pressable
          key={key}
          accessibilityRole="button"
          accessibilityLabel={key === 'back' ? 'Apagar último dígito' : key}
          onPress={() => {
            if (key === 'back') {
              tapLight();
              onBackspace();
              return;
            }

            // "000" muda três dígitos de uma vez: mimeo mais forte para o
            // utilizador perceber que o toque não foi um "0" só.
            if (key === '000') {
              tapMedium();
            } else {
              tapLight();
            }

            onDigit(key);
          }}
          // Sem isto o `Pressable` não produzia nenhum estado de premido:
          // `style` como array não tem `pressed`, logo não havia feedback
          // visual em nenhuma das 12 teclas.
          android_ripple={{ color: 'rgba(255,255,255,.14)', borderless: false }}
          style={({ pressed }) => [styles.key, { width: keyWidth }, pressed && styles.keyPressed]}
        >
          <LinearGradient
            colors={gradients.panel.colors}
            start={gradients.panel.start}
            end={gradients.panel.end}
            style={styles.keyBackground}
          >
            {key === 'back' ? (
              <Delete color={colors.text} size={22} strokeWidth={2} />
            ) : (
              <Text style={styles.keyLabel}>{key}</Text>
            )}
          </LinearGradient>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  key: {
    height: 56,
    borderRadius: radius.control,
    overflow: 'hidden',
  },
  keyPressed: {
    opacity: 0.6,
  },
  keyBackground: {
    flex: 1,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.panelBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyLabel: {
    fontFamily: fonts.medium,
    fontSize: 20,
    color: colors.text,
  },
});
