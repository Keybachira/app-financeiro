import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { A, ICON, ITEM_FORMS, ItemTipo, goBack, useTheme } from "../data";

// Param: ?tipo=metas|dividas|projetos|fixas
export default function NovoItem() {
  const { t, s } = useTheme();
  const ins = useSafeAreaInsets();
  const { tipo } = useLocalSearchParams<{ tipo?: string }>();
  const key = (tipo && tipo in ITEM_FORMS ? tipo : "metas") as ItemTipo;
  const f = ITEM_FORMS[key];
  const [v, setV] = useState<string[]>(f.campos.map(() => ""));

  const guardar = () => {
    A.addItem(
      key,
      v.map((x) => x.trim()),
    );
    goBack();
  };

  return (
    <KeyboardAvoidingView
      style={s.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[s.content, { paddingTop: ins.top + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.back}>
          <Pressable
            style={s.circ}
            onPress={goBack}
            accessibilityLabel="Fechar"
          >
            <Feather name={ICON.x} size={20} color={t.text} />
          </Pressable>
          <Text style={s.backTxt}>{f.titulo}</Text>
        </View>

        <View style={s.panel}>
          {f.campos.map((c, i) => (
            <TextInput
              key={c.l}
              style={s.input}
              value={v[i]}
              onChangeText={(x) =>
                setV((p) => p.map((y, j) => (j === i ? x : y)))
              }
              placeholder={c.l}
              placeholderTextColor={t.muted}
              keyboardType={c.num ? "decimal-pad" : "default"}
              autoFocus={i === 0}
              accessibilityLabel={c.l}
            />
          ))}
          <Pressable style={s.go} onPress={guardar}>
            <Text style={s.goTxt}>Guardar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
