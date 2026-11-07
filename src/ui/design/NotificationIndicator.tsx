import { Bell } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, useTheme, useThemedStyles, type Colors } from '../theme';

export function NotificationIndicator({ count, onPress }: { count: number; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return <Pressable accessibilityLabel="Notificações" onPress={onPress} style={styles.button}><Bell size={20} color={colors.text} />{count > 0 ? <View style={styles.badge}><Text style={styles.text}>{count}</Text></View> : null}</Pressable>;
}
const makeStyles = (colors: Colors) => StyleSheet.create({ button: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.bgMid, alignItems: 'center', justifyContent: 'center' }, badge: { position: 'absolute', top: -3, right: -3, minWidth: 19, height: 19, borderRadius: 10, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' }, text: { color: colors.toastText, fontFamily: fonts.bold, fontSize: 10 } });
