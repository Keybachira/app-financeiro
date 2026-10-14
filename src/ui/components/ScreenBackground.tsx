import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { colors, gradients } from '../theme';
import { RadialHighlight } from './RadialHighlight';

export function ScreenBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={gradients.background.colors}
        locations={gradients.background.locations}
        start={gradients.background.start}
        end={gradients.background.end}
        style={StyleSheet.absoluteFill}
      />
      <RadialHighlight cx={0.85} cy={0.06} rx={0.7} ry={0.22} color={colors.glowTop} opacity={0.5} />
    </View>
  );
}
