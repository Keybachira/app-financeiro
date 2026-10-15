import { useId } from 'react';
import { useWindowDimensions } from 'react-native';
import { Defs, Line, LinearGradient, Rect, Stop, Svg } from 'react-native-svg';

import { colors } from '../theme';

// viewBox em unidades de layout; a largura real do ecrã é medida em runtime.
const VIEW_WIDTH = 310;
const HEIGHT = 56;
const CHART_PADDING = 16;

export function DailyBarChart({
  month,
  data,
  daysInMonth,
  dailyLimit,
}: {
  month: string;
  data: Record<string, number>;
  daysInMonth: number;
  dailyLimit: number | null;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const gradientId = `daily${uid}`;

  // O viewBox é medido na largura real disponível. Com `preserveAspectRatio="none"`
  // e width="100%", o SVG era esticado ~1.3× em ecrãs largos: os cantos
  // arredondados viravam elipses, o traço da linha do limite ficava com
  // espessura desigual e a altura das barras deixava de ser proporcional ao
  // valor. Aqui o mapa é 1:1 com os píxeis do ecrã.
  const { width: screenWidth } = useWindowDimensions();
  const width = Math.max(1, Math.round(screenWidth - CHART_PADDING * 2));
  const height = HEIGHT;
  const gap = daysInMonth > 20 ? 2 : 6;
  const barWidth = Math.max(2, Math.floor((width - gap * (daysInMonth - 1)) / daysInMonth));

  const values = Object.values(data);
  const maxValue = Math.max(1, ...values, dailyLimit ?? 0);
  const usableHeight = height - 6;

  const limitY = dailyLimit && dailyLimit > 0 ? height - 3 - Math.round((dailyLimit / maxValue) * usableHeight) : null;

  return (
    <Svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      accessibilityRole="image"
      accessibilityLabel="Gastos por dia do mês, com a linha do limite diário"
    >
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#9CC0FF" />
          <Stop offset="1" stopColor="#3C74F5" />
        </LinearGradient>
      </Defs>

      {Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        const date = `${month}-${String(day).padStart(2, '0')}`;
        const amount = data[date] ?? 0;
        const barHeight = amount > 0 ? Math.max(3, Math.round((amount / maxValue) * usableHeight)) : 0;

        if (barHeight === 0) {
          return null;
        }

        const exceeds = dailyLimit !== null && amount > dailyLimit;
        const x = index * (barWidth + gap);

        return (
          <Rect
            key={day}
            x={x}
            y={height - barHeight}
            width={barWidth}
            height={barHeight}
            rx={Math.min(4, barWidth / 2)}
            fill={exceeds ? colors.warn : `url(#${gradientId})`}
          />
        );
      })}

      {/* A linha do limite é desenhada DEPOIS das barras: ao contrário, as barras
          mais altas tapavam-na por completo. */}
      {limitY !== null ? (
        <Line x1="0" y1={limitY} x2={width} y2={limitY} stroke={colors.textMuted} strokeWidth="1" strokeDasharray="3 4" />
      ) : null}
    </Svg>
  );
}
