import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { FONT, ICON } from "../../data";
import { useTheme, useThemedStyles, type Colors } from "../../src/ui/theme";

type IconName = ComponentProps<typeof Feather>["name"];

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: "index", title: "Início", icon: ICON.home },
  { name: "movimentos", title: "Movimentos", icon: ICON.mov },
  { name: "stats", title: "Estatísticas", icon: ICON.chart },
  { name: "settings", title: "Ajustes", icon: ICON.tune },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <PillTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "Início" }} />
      <Tabs.Screen name="movimentos" options={{ title: "Movimentos" }} />
      <Tabs.Screen name="stats" options={{ title: "Estatísticas" }} />
      <Tabs.Screen name="settings" options={{ title: "Ajustes" }} />
    </Tabs>
  );
}

type PillTabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  descriptors: Record<string, unknown>;
  navigation: { navigate: (name: string) => void };
  insets: { top: number; right: number; bottom: number; left: number };
};

function TabItem({
  tab,
  focused,
  onPress,
}: {
  tab: { name: string; title: string; icon: IconName };
  focused: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  // 0 = botão circular escuro, 1 = pílula branca com rótulo.
  const focus = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const [labelWidth, setLabelWidth] = useState(0);

  useEffect(() => {
    Animated.timing(focus, {
      toValue: focused ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [focused, focus]);

  const backgroundColor = focus.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.tabItemIdle, colors.tabItemActive],
  });
  const paddingLeft = focus.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 11],
  });
  const paddingRight = focus.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 16],
  });
  const labelReveal = focus.interpolate({
    inputRange: [0, 1],
    outputRange: [0, labelWidth],
  });
  const labelGap = focus.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 8],
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={tab.title}
      accessibilityState={{ selected: focused }}
      onPress={onPress}
      hitSlop={6}
    >
      <Animated.View
        style={[styles.button, { backgroundColor, paddingLeft, paddingRight }]}
      >
        <View style={styles.iconWrap}>
          <Animated.View style={{ opacity: focus.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }}>
            <Feather name={tab.icon} size={20} color="#ffffff" />
          </Animated.View>
          <Animated.View style={[styles.iconOverlay, { opacity: focus }]}>
            <Feather name={tab.icon} size={20} color="#000000" />
          </Animated.View>
        </View>

        {/* Texto escondido só para medir a largura natural do rótulo. */}
        <Text
          style={[styles.label, styles.measure]}
          pointerEvents="none"
          onLayout={(e) => {
            const w = Math.ceil(e.nativeEvent.layout.width);
            if (w > 0 && w !== labelWidth) setLabelWidth(w);
          }}
        >
          {tab.title}
        </Text>

        <Animated.View
          style={{
            width: labelReveal,
            marginLeft: labelGap,
            overflow: "hidden",
          }}
        >
          <Animated.Text
            numberOfLines={1}
            style={[styles.label, { width: labelWidth || undefined }]}
          >
            {tab.title}
          </Animated.Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

function PillTabBar({ state, navigation, insets }: PillTabBarProps) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.host, { bottom: 16 + insets.bottom }]}
    >
      <View style={styles.dock}>
        {TABS.map((tab) => (
          <TabItem
            key={tab.name}
            tab={tab}
            focused={state.routes[state.index]?.name === tab.name}
            onPress={() => navigation.navigate(tab.name)}
          />
        ))}
      </View>
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    host: {
      position: "absolute",
      left: 0,
      right: 0,
      alignItems: "center",
    },
    dock: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      padding: 6,
      borderRadius: 99,
      backgroundColor: colors.tabDockBg,
      borderWidth: 1,
      borderColor: colors.tabDockBorder,
    },
    button: {
      height: 43,
      minWidth: 43,
      borderRadius: 99,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    iconWrap: {
      alignItems: "center",
      justifyContent: "center",
    },
    iconOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
    },
    label: {
      fontFamily: FONT.med,
      fontSize: 13,
      color: "#000000",
    },
    measure: {
      position: "absolute",
      opacity: 0,
    },
  });
