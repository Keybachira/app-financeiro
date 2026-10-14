import { useId } from 'react';
import { StyleSheet } from 'react-native';
import { Defs, RadialGradient, Rect, Stop, Svg } from 'react-native-svg';

export function RadialHighlight({
  cx,
  cy,
  rx,
  ry = rx,
  color,
  opacity = 1,
}: {
  cx: number;
  cy: number;
  rx: number;
  ry?: number;
  color: string;
  opacity?: number;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const gradientId = `highlight${uid}`;

  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient
          id={gradientId}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="objectBoundingBox"
          gradientTransform={`translate(${cx} ${cy}) scale(${rx} ${ry})`}
        >
          <Stop offset="0" stopColor={color} stopOpacity={opacity} />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradientId})`} />
    </Svg>
  );
}
