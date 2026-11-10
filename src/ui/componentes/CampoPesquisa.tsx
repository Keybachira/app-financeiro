import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Search, X } from "lucide-react-native";

import { fonts, radius, useTema, useEstilosTema, type Cores } from "../tema";

/**
 * Campo de pesquisa controlado, com lupa e botão de limpar.
 *
 * O botão "X" só existe quando há texto e limpa o valor chamando 'onChange("")';
 * não guarda estado próprio.
 */
export function CampoPesquisa({
  value,
  onChange,
  placeholder = "Procurar",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const { colors } = useTema();
  const styles = useEstilosTema(makeStyles);

  return (
    <View style={styles.wrap}>
      <Search color={colors.textMuted} size={18} strokeWidth={2} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        returnKeyType="search"
        autoCorrect={false}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityLabel="Limpar pesquisa"
          hitSlop={8}
          onPress={() => onChange("")}
        >
          <X color={colors.textMuted} size={18} strokeWidth={2} />
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = (colors: Cores) =>
  StyleSheet.create({
    wrap: {
      height: 44,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderRadius: radius.control,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.inputBg,
      paddingHorizontal: 12,
    },
    input: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: 15,
      color: colors.text,
      padding: 0,
    },
  });
