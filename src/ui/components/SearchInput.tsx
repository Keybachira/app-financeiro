import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Search, X } from 'lucide-react-native';

import { colors, fonts, radius } from '../theme';

export function SearchInput({
  value,
  onChange,
  placeholder = 'Procurar',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
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
        <Pressable accessibilityLabel="Limpar pesquisa" hitSlop={8} onPress={() => onChange('')}>
          <X color={colors.textMuted} size={18} strokeWidth={2} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: 'rgba(255,255,255,.06)',
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
