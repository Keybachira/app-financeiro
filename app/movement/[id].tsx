import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import { getMovement, type MovementRow } from '../../src/repos/movements';
import { MovementEditor } from '../../src/features/movements/MovementEditor';
import { IconButton } from '../../src/ui/components/IconButton';
import { ScreenBackground } from '../../src/ui/components/ScreenBackground';
import { colors, fonts, spacing } from '../../src/ui/theme';

export default function EditMovementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const movementId = typeof id === 'string' ? id : null;
  const [movement, setMovement] = useState<MovementRow | null>(() =>
    movementId ? getMovement(movementId) : null
  );

  if (movementId === null || movement === null) {
    return (
      <View style={styles.root}>
        <ScreenBackground />
        <View style={styles.header}>
          <Text style={styles.title}>Movimento</Text>
          <IconButton icon={ArrowLeft} label="Voltar" onPress={() => router.back()} />
        </View>
        <View style={styles.body}>
          <Text style={styles.message}>Este movimento já não existe.</Text>
        </View>
      </View>
    );
  }

  return <MovementEditor movement={movement} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.text,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
});
