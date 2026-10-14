import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { colors, fonts, gradients, radius, spacing } from '../theme';

export function Fab({
  icon: Icon,
  label,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.wrap}>
      <LinearGradient
        colors={gradients.primary.colors}
        start={gradients.primary.start}
        end={gradients.primary.end}
        style={styles.button}
      >
        <Icon color={colors.text} size={22} strokeWidth={2} />
        <Text style={styles.label}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 16,
    bottom: 104,
    borderRadius: 26,
    shadowColor: 'rgba(60,116,245,.55)',
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  button: {
    height: 52,
    borderRadius: 26,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
});
