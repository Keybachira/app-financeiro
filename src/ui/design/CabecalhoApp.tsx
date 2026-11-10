import { Bell, Menu } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, useTema, useEstilosTema, type Cores } from '../tema';

/**
 * Cabeçalho do Início: menu à esquerda, sino com contador e avatar à direita.
 *
 * O avatar mostra a inicial do nome (ou "A" quando vazio) — não carrega imagem.
 */
export function CabecalhoApp({ name, unread = 0, onMenu, onNotifications, onProfile }: { name: string; unread?: number; onMenu: () => void; onNotifications: () => void; onProfile: () => void }) {
  const { colors } = useTema();
  const styles = useEstilosTema(makeStyles);
  return <View style={styles.header}>
    <Pressable accessibilityLabel="Menu" onPress={onMenu} style={styles.circle}><Menu size={20} color={colors.text} /></Pressable>
    <View style={styles.actions}>
      <Pressable accessibilityLabel="Notificações" onPress={onNotifications} style={styles.circle}><Bell size={20} color={colors.text} />{unread > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{unread}</Text></View> : null}</Pressable>
      <Pressable accessibilityLabel="Perfil" onPress={onProfile} style={styles.avatar}><Text style={styles.avatarText}>{(name.trim()[0] || 'A').toUpperCase()}</Text></Pressable>
    </View>
  </View>;
}
const makeStyles = (colors: Cores) => StyleSheet.create({ header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, actions: { flexDirection: 'row', gap: 7 }, circle: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.bgMid, alignItems: 'center', justifyContent: 'center' }, avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.avatarBg, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: colors.avatarText, fontFamily: fonts.bold, fontSize: 16 }, badge: { position: 'absolute', top: -3, right: -3, minWidth: 19, height: 19, borderRadius: 10, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }, badgeText: { color: colors.toastText, fontFamily: fonts.bold, fontSize: 10 } });
