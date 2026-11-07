import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { useCallback, useRef } from "react";

import { fonts, layout, spacing, useTheme } from "../theme";

export function Fab({
  icon: Icon,
  label,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}) {
  const { gradients } = useTheme();
  const busyRef = useRef(false);

  const handlePress = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      onPress();
    } finally {
      // Mantém curto para evitar duplo toque durante transição modal.
      setTimeout(() => {
        busyRef.current = false;
      }, 500);
    }
  }, [onPress]);

  return (
    <Pressable
      accessibilityLabel={label}
      onPress={handlePress}
      style={styles.wrap}
    >
      <LinearGradient
        colors={gradients.primary.colors}
        start={gradients.primary.start}
        end={gradients.primary.end}
        style={styles.button}
      >
        <Icon color="#FFFFFF" size={22} strokeWidth={2} />
        <Text style={styles.label}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: layout.screenPadding,
    bottom: layout.fabBottom,
    borderRadius: layout.fabHeight / 2,
    shadowColor: "rgba(156,50,215,.35)",
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  button: {
    height: layout.fabHeight,
    borderRadius: layout.fabHeight / 2,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: "#FFFFFF",
  },
});
