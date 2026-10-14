import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { colors, fonts, gradients, layout, spacing } from '../theme';
import { PressableScale } from './PressableScale';

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
    <PressableScale accessibilityLabel={label} onPress={onPress} style={styles.wrap} radius={layout.fabHeight / 2}>
      <LinearGradient
        colors={gradients.primary.colors}
        start={gradients.primary.start}
        end={gradients.primary.end}
        style={styles.button}
      >
        <Icon color={colors.text} size={22} strokeWidth={2} />
        <Text style={styles.label}>{label}</Text>
      </LinearGradient>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: layout.screenPadding,
    bottom: layout.fabBottom,
    borderRadius: layout.fabHeight / 2,
    shadowColor: 'rgba(60,116,245,.55)',
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  button: {
    height: layout.fabHeight,
    borderRadius: layout.fabHeight / 2,
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
