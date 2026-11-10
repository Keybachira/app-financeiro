import { Pressable, StyleSheet, Text, View } from "react-native";

import { fonts, radius, useEstilosTema, type Cores } from "../tema";

/**
 * Chip "categoria · lembrado": sugere a categoria aprendida para a nota escrita.
 *
 * Se a sugestão já está aplicada ('applied') ou não há ação ('onPress'), mosta
 * apenas um selo inerte; caso contrário é um botão que aplica a categoria.
 */
export function ChipSugestaoCategoria({
  category,
  applied,
  onPress,
}: {
  category: string;
  applied: boolean;
  onPress?: () => void;
}) {
  const styles = useEstilosTema(makeStyles);
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

const makeStyles = (colors: Cores) =>
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
