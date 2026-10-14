import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius } from '../theme';

export function CategorySuggestChip({
  category,
  applied,
  onPress,
}: {
  category: string;
  applied: boolean;
  onPress?: () => void;
}) {
  const content = (
    <>
      <Text style={styles.label}>
        {category} · lembrado
      </Text>
    </>
  );

  if (applied || !onPress) {
    return <View style={styles.chip}>{content}</View>;
  }

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Usar categoria ${category}`} onPress={onPress} style={styles.chip}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.chip,
    backgroundColor: colors.chipAccentBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.chipAccentText,
  },
});
