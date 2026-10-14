import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { colors } from '../theme';

export function IconTile({
  icon: Icon,
  size = 40,
  iconSize = 22,
  tone = 'accent',
  style,
}: {
  icon: LucideIcon;
  size?: number;
  iconSize?: number;
  tone?: 'accent' | 'neutral';
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: tone === 'accent' ? colors.iconTileBg : colors.chipNeutralBg,
        },
        style,
      ]}
    >
      <Icon color={tone === 'accent' ? colors.accent : colors.textMuted} size={iconSize} strokeWidth={2} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
