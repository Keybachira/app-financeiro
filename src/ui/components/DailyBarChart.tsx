import { useId } from 'react';
import { Defs, Line, LinearGradient, Rect, Stop, Svg } from 'react-native-svg';

import { colors } from '../theme';

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

  const width = 310;
  const height = 56;
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
      preserveAspectRatio="none"
      accessibilityRole="image"
      accessibilityLabel="Gastos por dia do mês, com a linha do limite diário"
    >
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#9CC0FF" />
          <Stop offset="1" stopColor="#3C74F5" />
        </LinearGradient>
      </Defs>

      {limitY !== null ? (
        <Line x1="0" y1={limitY} x2={width} y2={limitY} stroke={colors.textMuted} strokeWidth="1" strokeDasharray="3 4" />
      ) : null}

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
    </Svg>
  );
}
