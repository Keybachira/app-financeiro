import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, useEstilosTema, type Cores } from '../tema';

/**
 * Título de secção com uma ação opcional à direita (ex.: "Ver tudo").
 *
 * A ação só aparece quando existem 'action' e 'onPress' ao mesmo tempo.
 */
export function CabecalhoSeccao({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  const styles = useEstilosTema(makeStyles);
  return <View style={styles.row}><Text style={styles.title}>{title}</Text>{action && onPress ? <Pressable onPress={onPress}><Text style={styles.action}>{action}</Text></Pressable> : null}</View>;
}
const makeStyles = (colors: Cores) => StyleSheet.create({ row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, title: { color: colors.text, fontFamily: fonts.medium, fontSize: 14 }, action: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 11 } });
