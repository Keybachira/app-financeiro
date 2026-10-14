import { Briefcase } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { IconTile } from '../../src/ui/components/IconTile';
import { Panel } from '../../src/ui/components/Panel';
import { Screen } from '../../src/ui/components/Screen';
import { colors, fonts } from '../../src/ui/theme';

export default function ProjectsScreen() {
  return (
    <Screen title="Projetos">
      <Panel>
        <View style={styles.row}>
          <IconTile icon={Briefcase} />
          <View style={styles.textBlock}>
            <Text style={styles.title}>Projetos e recebimentos</Text>
            <Text style={styles.text}>
              Acompanha o que já recebeste, o que falta receber e a percentagem paga de cada projeto.
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
