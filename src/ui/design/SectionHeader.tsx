import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, useThemedStyles, type Colors } from '../theme';

export function SectionHeader({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  const styles = useThemedStyles(makeStyles);
  return <View style={styles.row}><Text style={styles.title}>{title}</Text>{action && onPress ? <Pressable onPress={onPress}><Text style={styles.action}>{action}</Text></Pressable> : null}</View>;
}
const makeStyles = (colors: Colors) => StyleSheet.create({ row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, title: { color: colors.text, fontFamily: fonts.medium, fontSize: 14 }, action: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 11 } });
