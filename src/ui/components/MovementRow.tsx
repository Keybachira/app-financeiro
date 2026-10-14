import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { MovementRow } from '../../repos/movements';
import { addDays, formatDayMonthPt } from '../../domain/dates';
import { categoryIcon, incomeIcon } from '../categoryIcons';
import { colors, fonts } from '../theme';
import { IconTile } from './IconTile';
import { MoneyText } from './MoneyText';

function dayLabel(date: string, today: string): string {
  if (date === today) {
    return 'hoje';
  }

  if (date === addDays(today, -1)) {
    return 'ontem';
  }

  return formatDayMonthPt(date);
}

export function MovementRow({
  movement,
  today,
  onPress,
}: {
  movement: MovementRow;
  today: string;
  onPress: () => void;
}) {
  const isIncome = movement.type === 'income';
  const Icon = isIncome ? incomeIcon() : categoryIcon(movement.category);

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.pressable}>
      <IconTile icon={Icon} size={40} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {movement.note && movement.note.trim().length > 0 ? movement.note : movement.category}
        </Text>
        <Text style={styles.meta}>
          {isIncome ? 'Receita' : 'Despesa'} · {dayLabel(movement.date, today)}
        </Text>
      </View>
      <View style={styles.amount}>
        {isIncome ? <Text style={styles.sign}>+</Text> : null}
        <MoneyText value={movement.amount} size="md" tone={isIncome ? 'income' : 'default'} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    minHeight: 60,
  },
  info: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.text,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  amount: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  sign: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.accent,
  },
});
