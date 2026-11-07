import { Pressable, StyleSheet, Text, View } from "react-native";

import { fonts, radius, useThemedStyles, type Colors } from "../theme";

export function CategorySuggestChip({
  category,
  applied,
  onPress,
}: {
  category: string;
  applied: boolean;
  onPress?: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const content = (
    <>
      <Text style={styles.label}>{category} · lembrado</Text>
    </>
  );

  if (applied || !onPress) {
    return <View style={styles.chip}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Usar categoria ${category}`}
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      style={styles.chip}
    >
      {content}
    </Pressable>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
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
