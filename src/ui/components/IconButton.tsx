import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { colors, gradients } from '../theme';
import { PressableScale } from './PressableScale';

export function IconButton({
  icon: Icon,
  label,
  onPress,
  badge = false,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  badge?: boolean;
}) {
  return (
    <PressableScale accessibilityLabel={label} onPress={onPress} style={styles.wrap} radius={22}>
      <LinearGradient
        colors={gradients.panel.colors}
        start={gradients.panel.start}
        end={gradients.panel.end}
        style={styles.button}
      >
        <Icon color={colors.text} size={22} strokeWidth={2} />
        {badge ? <View style={styles.badge} /> : null}
      </LinearGradient>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 44,
    height: 44,
  },
  button: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.panelBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.warn,
  },
});
