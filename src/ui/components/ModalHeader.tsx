import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import { colors, fonts, spacing } from '../theme';
import { IconButton } from './IconButton';

/**
 * Cabeçalho para ecrãs abertos como modal, com botão de voltar explícito.
 *
 * O `headerShown: false` global remove o cabeçalho nativo do `Stack`, por isso
 * `router.back()` ficava só acessível pelo gesto de sistema. Um ecrã modal sem
 * botão visível de fechar é um beco sem saída — daí este componente existir e
 * ser usado em todos.
 *
 * Usa `ArrowLeft` (e não `X`): nos modais de detalhe (`debt/[id]`,
 * `project/[id]`, `goal/[id]`) o `X` já existe à direita, e uma seta à
 * esquerda dá a indicação de "hierarquia" que o gesto de voltar transmite.
 */
export function ModalHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <IconButton icon={ArrowLeft} label="Voltar" onPress={() => router.back()} />
      <View style={styles.titleBlock}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});