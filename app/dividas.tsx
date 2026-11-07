import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ICON, ITEM_FORMS, go, goBack, kz, useTheme } from '../data';

export default function Dividas() {
  const { t, s, st } = useTheme();
  const ins = useSafeAreaInsets();

  return (
    <ScrollView style={s.screen} contentContainerStyle={[s.content, { paddingTop: ins.top + 20 }]} showsVerticalScrollIndicator={false}>
      <View style={s.back}>
        <Pressable style={s.circ} onPress={goBack} accessibilityLabel="Voltar">
          <Feather name={ICON.back} size={20} color={t.text} />
        </Pressable>
        <Text style={s.backTxt}>Dívidas</Text>
      </View>

      {!st.mod.dividas ? (
        <View style={s.panel}>
          <View style={s.empty}>
            <Text style={s.emptyTxt}>O módulo está desativado.</Text>
            <Pressable style={s.emptyBtn} onPress={() => go('/ajustes')}>
              <Text style={s.emptyBtnTxt}>Gerir módulos</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <>
          <View style={s.panel}>
            {st.dividas.length === 0 && (
              <View style={s.empty}>
                <Text style={s.emptyTxt}>Sem dívidas registadas.</Text>
              </View>
            )}
            {st.dividas.map((d) => (
              <View key={d.id} style={s.it}>
                <View style={[s.circSm, { backgroundColor: t.circ }]}>
                  <Feather name={ICON.debt} size={17} color={t.text} />
                </View>
                <View style={s.itBody}>
                  <Text style={s.itTxt}>{d.nome}</Text>
                  <Text style={s.itSub}>Vence a {d.vence}</Text>
                </View>
                <Text style={[s.pTxt, s.neg]}>{kz(d.valor)}</Text>
              </View>
            ))}
          </View>
          <Pressable style={s.go} onPress={() => go('/novo-item?tipo=dividas')}>
            <Text style={s.goTxt}>{ITEM_FORMS.dividas.botao}</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}
