import { Target } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { IconTile } from '../../src/ui/components/IconTile';
import { Panel } from '../../src/ui/components/Panel';
import { Screen } from '../../src/ui/components/Screen';
import { colors, fonts, spacing } from '../../src/ui/theme';

export default function GoalsScreen() {
  return (
    <Screen title="Metas">
      <Panel>
        <View style={styles.row}>
          <IconTile icon={Target} />
          <View style={styles.textBlock}>
            <Text style={styles.title}>Metas de poupança</Text>
            <Text style={styles.text}>
              Cria metas e acompanha o progresso, o ritmo de poupança e as metas concluídas.
            </Text>
          </View>
        </View>
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  text: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    marginTop: 2,
  },
});
