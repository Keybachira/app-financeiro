import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeftRight, Briefcase, Home, Target } from 'lucide-react-native';

import { colors, fonts, radius } from '../../src/ui/theme';

const TABS = [
  { name: 'index', title: 'Início', Icon: Home },
  { name: 'goals', title: 'Metas', Icon: Target },
  { name: 'debts', title: 'Dívidas', Icon: ArrowLeftRight },
  { name: 'projects', title: 'Projetos', Icon: Briefcase },
];

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <GlassTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="goals" options={{ title: 'Metas' }} />
      <Tabs.Screen name="debts" options={{ title: 'Dívidas' }} />
      <Tabs.Screen name="projects" options={{ title: 'Projetos' }} />
    </Tabs>
  );
}

type GlassTabBarProps = {
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
  tab: { name: string; title: string; Icon: typeof Home };
  focused: boolean;
  onPress: () => void;
}) {
  // Anima a escala da pill e do ícone quando o separador fica ativo.
  const focus = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(focus, {
      toValue: focused ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [focused, focus]);

  const pillScale = focus.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] });
  const iconTranslateY = focus.interpolate({ inputRange: [0, 1], outputRange: [0, -1] });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={tab.title}
      accessibilityState={{ selected: focused }}
      onPress={onPress}
      style={styles.item}
    >
      <Animated.View
        style={[
          styles.pill,
          focused && styles.pillActive,
          { transform: [{ scale: pillScale }] },
        ]}
      >
        <Animated.View style={{ transform: [{ translateY: iconTranslateY }] }}>
          <tab.Icon color={focused ? colors.text : colors.textMuted} size={22} strokeWidth={2} />
        </Animated.View>
      </Animated.View>
      <Text style={[styles.label, focused && styles.labelActive]}>{tab.title}</Text>
    </Pressable>
  );
}

function GlassTabBar({ state, navigation, insets }: GlassTabBarProps) {
  return (
    <BlurView intensity={18} tint="dark" style={[styles.bar, { paddingBottom: insets.bottom }]}>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.tint]} />
      <View style={styles.row}>
        {TABS.map((tab, index) => (
          <TabItem
            key={tab.name}
            tab={tab}
            focused={state.index === index}
            onPress={() => navigation.navigate(tab.name)}
          />
        ))}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    paddingTop: 10,
    overflow: 'hidden',
  },
  tint: {
    backgroundColor: colors.tabBarBg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  item: {
    alignItems: 'center',
    gap: 4,
    minWidth: 56,
    minHeight: 44,
    justifyContent: 'center',
  },
  pill: {
    width: 56,
    height: 32,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: colors.tabPill,
    shadowColor: colors.tabPill,
    shadowOpacity: 0.6,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  labelActive: {
    fontFamily: fonts.bold,
    color: colors.text,
  },
});

