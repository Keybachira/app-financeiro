import { useMemo } from "react";
import { useColorScheme } from "react-native";

import { useStore } from "../../data";

// Paleta clara — valores originais do design (não mexer: é a referência visual).
const lightPalette = {
  bg: "#EDEDED",
  bgMid: "#FFFFFF",
  bgDeep: "#EDEDED",
  bgTop: "#EDEDED",
  glowTop: "#FFFFFF",
  glowWhite: "#FFFFFF",
  glowDeep: "#9C32D7",
  panelFrom: "#FFFFFF",
  panelTo: "#FFFFFF",
  panelBorder: "#E2E2E2",
  glassFrom: "#A63ADD",
  glassMid: "#9C32D7",
  glassTo: "#8123B9",
  glassBorder: "rgba(156,50,215,.18)",
  glassText: "#FFFFFF",
  chipOnGlass: "rgba(255,255,255,.18)",
  primaryFrom: "#A63ADD",
  primaryTo: "#8123B9",
  accent: "#9C32D7",
  accentSoft: "#9C32D7",
  warn: "#D9A514",
  text: "#0D0D0D",
  textMuted: "#8D8D8D",
  hairline: "#E0E0E0",
  tabBarBg: "rgba(255,255,255,.94)",
  tabPill: "#EBD7F5",
  tabDockBg: "#000000",
  tabDockBorder: "#2A2F2C",
  tabItemIdle: "#262B28",
  tabItemActive: "#FFFFFF",
  chipNeutralBg: "#EFEFEF",
  chipNeutralText: "#6F6F6F",
  chipWarnBg: "#FFF1C7",
  chipWarnText: "#9A7600",
  chipAccentBg: "#F0DDF8",
  chipAccentText: "#8123B9",
  iconTileBg: "#F0DDF8",
  track: "#E0E0E0",
  trackSoft: "#F0F0F0",
  progressFillFrom: "#A63ADD",
  progressFillTo: "#8123B9",
  avatarBg: "#111111",
  avatarText: "#FFFFFF",
  backdrop: "rgba(4,8,24,.72)",
  success: "#1F9D57",
  danger: "#D9423B",
  toastBg: "#101839",
  toastText: "#FFFFFF",
  toastAction: "#C77DFF",
  inputBg: "rgba(13,13,13,.04)",
};

export type Colors = { readonly [K in keyof typeof lightPalette]: string };

export const lightColors: Colors = lightPalette;

// Paleta escura — mesmas chaves, superfícies escuras e acentos mais claros para
// manter contraste sobre preto.
export const darkColors: Colors = {
  ...lightPalette,
  bg: "#000000",
  bgMid: "#151515",
  bgDeep: "#000000",
  bgTop: "#0A0A0A",
  glowTop: "#262626",
  glowDeep: "#6D1E97",
  panelFrom: "#1E1E1E",
  panelTo: "#161616",
  panelBorder: "#2C2C2C",
  glassBorder: "rgba(255,255,255,.16)",
  accent: "#C77DFF",
  accentSoft: "#C77DFF",
  warn: "#F0C14B",
  text: "#F5F5F5",
  textMuted: "#A0A0A0",
  hairline: "#2A2A2A",
  tabBarBg: "rgba(20,20,20,.94)",
  tabPill: "#3A2452",
  tabDockBg: "#1C1C1C",
  tabDockBorder: "#3A3A3A",
  tabItemIdle: "#303030",
  tabItemActive: "#FFFFFF",
  chipNeutralBg: "#262626",
  chipNeutralText: "#B5B5B5",
  chipWarnBg: "#3B2E08",
  chipWarnText: "#F5C542",
  chipAccentBg: "#2E1B3E",
  chipAccentText: "#D6A5F5",
  iconTileBg: "#2E1B3E",
  track: "#2A2A2A",
  trackSoft: "#1F1F1F",
  avatarBg: "#262626",
  backdrop: "rgba(0,0,0,.82)",
  success: "#34C759",
  danger: "#FF5A52",
  toastBg: "#262626",
  toastText: "#FFFFFF",
  toastAction: "#D6A5F5",
  inputBg: "rgba(255,255,255,.06)",
};

export function useTheme() {
  const { theme } = useStore();
  const system = useColorScheme();
  const dark = theme === "system" ? system === "dark" : theme === "dark";
  const colors = dark ? darkColors : lightColors;
  const gradients = useMemo(() => makeGradients(colors), [colors]);

  return { colors, gradients, dark };
}

/** Estilos que dependem da paleta: recalculados quando o modo muda. */
export function useThemedStyles<T>(factory: (c: Colors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [colors, factory]);
}

export const fonts = {
  regular: "DMSans_400Regular",
  medium: "DMSans_500Medium",
  bold: "DMSans_700Bold",
} as const;

export const fontAssets = {
  DMSans_400Regular: require("../../assets/fonts/DMSans-Regular.ttf"),
  DMSans_500Medium: require("../../assets/fonts/DMSans-Medium.ttf"),
  DMSans_700Bold: require("../../assets/fonts/DMSans-Bold.ttf"),
} as const;

export const radius = {
  chip: 12,
  control: 14,
  panel: 20,
  glass: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const layout = {
  screenPadding: 16,
  touchTarget: 44,
  primaryButton: 56,
  tabPillWidth: 56,
  tabPillHeight: 32,
  fabHeight: 52,
  fabBottom: 104,
} as const;

function angle(deg: number) {
  const rad = (deg * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  return {
    start: { x: 0.5 - dx / 2, y: 0.5 - dy / 2 },
    end: { x: 0.5 + dx / 2, y: 0.5 + dy / 2 },
  };
}

export type Gradients = ReturnType<typeof makeGradients>;

function makeGradients(colors: Colors) {
  return {
    background: {
      colors: [colors.bg, colors.bg, colors.bg, colors.bg] as [
        string,
        string,
        string,
        string,
      ],
      locations: [0, 0.14, 0.34, 0.62] as [number, number, number, number],
      ...angle(180),
    },
    panel: {
      colors: [colors.panelFrom, colors.panelTo] as [string, string],
      ...angle(160),
    },
    glass: {
      colors: [colors.glassFrom, colors.glassMid, colors.glassTo] as [
        string,
        string,
        string,
      ],
      ...angle(135),
    },
    primary: {
      colors: [colors.primaryFrom, colors.primaryTo] as [string, string],
      ...angle(160),
    },
    progress: {
      colors: [colors.progressFillFrom, colors.progressFillTo] as [
        string,
        string,
      ],
      ...angle(90),
    },
  };
}
