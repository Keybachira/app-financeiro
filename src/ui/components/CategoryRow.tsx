import { StyleSheet, Text, View } from 'react-native';

import { formatKz } from '../../domain/money';
import { MoneyText } from './MoneyText';
import { IconTile } from './IconTile';
import { ProgressBar } from './ProgressBar';
import { categoryIcon } from '../categoryIcons';
import { colors, fonts } from '../theme';

export function CategoryRow({
  category,
  amount,
  share,
}: {
  category: string;
  amount: number;
  share: number;
}) {
  return (
    <View style={styles.row}>
      <IconTile icon={categoryIcon(category)} size={40} />
      <View style={styles.info}>
        <View style={styles.top}>
          <Text style={styles.name}>{category}</Text>
          <MoneyText value={amount} size="md" />
        </View>
        <ProgressBar value={share} tone="gradient" height={6} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  info: {
    flex: 1,
    gap: 8,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.text,
  },
});
