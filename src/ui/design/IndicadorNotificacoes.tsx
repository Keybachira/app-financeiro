import { Bell } from 'lucide-react-native';
import { Pressable, StyleSheet, Text } from 'react-native';
import { fonts, useTema, useEstilosTema, type Cores } from '../tema';
import { Pulso } from '../componentes/Pulso';

/**
 * Sino de notificações com contador de não lidas; usado fora do Início.
 *
 * O selo pulsa como o `.bdg` da referência enquanto houver notificações.
 */
export function IndicadorNotificacoes({ count, onPress }: { count: number; onPress: () => void }) {
  const { colors } = useTema();
  const styles = useEstilosTema(makeStyles);
  return <Pressable accessibilityLabel="Notificações" onPress={onPress} style={styles.button}><Bell size={20} color={colors.text} />{count > 0 ? <Pulso style={styles.badge}><Text style={styles.text}>{count}</Text></Pulso> : null}</Pressable>;
}
const makeStyles = (colors: Cores) => StyleSheet.create({ button: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.bgMid, alignItems: 'center', justifyContent: 'center' }, badge: { position: 'absolute', top: -3, right: -3, minWidth: 19, height: 19, borderRadius: 10, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' }, text: { color: colors.toastText, fontFamily: fonts.bold, fontSize: 10 } });
