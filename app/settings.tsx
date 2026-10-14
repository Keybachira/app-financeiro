import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Wallet, X } from 'lucide-react-native';

import { formatKz } from '../src/domain/money';
import { IconButton } from '../src/ui/components/IconButton';
import { ScreenBackground } from '../src/ui/components/ScreenBackground';
import { IconTile } from '../src/ui/components/IconTile';
import { colors, fonts, gradients, radius, spacing } from '../src/ui/theme';
import { useMonthlyLimit } from '../src/features/settings/useSettings';
import { useToast } from '../src/ui/components/Toast';

export default function SettingsScreen() {
  const router = useRouter();
  const toast = useToast();
  const { limit, setLimit } = useMonthlyLimit();
  const [value, setValue] = useState(limit === null ? '' : String(limit));

  const parsed = Number(value.replace(/[\s.]/g, ''));

  const handleSave = () => {
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
      <View style={styles.content}>
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

          <Pressable accessibilityRole="button" onPress={handleSave} style={styles.saveWrap}>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
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
    alignItems: 'center',
    gap: 14,
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
    shadowColor: 'rgba(60,116,245,.4)',
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
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
