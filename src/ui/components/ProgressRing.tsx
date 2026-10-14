import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors, fonts } from '../theme';

export function ProgressRing({
  value,
  size = 56,
  stroke = 6,
  showPercent = true,
}: {
  value: number;
  size?: number;
  stroke?: number;
  showPercent?: boolean;
}) {
  const pct = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = `${(pct * circumference).toFixed(2)} ${circumference.toFixed(2)}`;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,.12)"
          strokeWidth={stroke}
          fill="none"
        />
        {pct > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.accent}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={dash}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            fill="none"
          />
        ) : null}
      </Svg>
      {showPercent ? (
        <View style={styles.center} pointerEvents="none">
          <Text style={[styles.percent, { fontSize: Math.round(size / 4.3) }]}>{`${Math.round(pct * 100)}%`}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percent: {
    fontFamily: fonts.bold,
    color: colors.text,
  },
});
