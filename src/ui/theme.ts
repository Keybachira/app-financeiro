export const colors = {
  bg: '#070C24',
  bgMid: '#0B1538',
  bgDeep: '#1B3A9C',
  bgTop: '#3F78F2',
  glowTop: '#BED7FF',
  glowWhite: '#FFFFFF',
  glowDeep: '#0F1E8C',
  panelFrom: '#1A2654',
  panelTo: '#101839',
  panelBorder: 'rgba(255,255,255,.07)',
  glassFrom: '#4F83F5',
  glassMid: '#3B6EF0',
  glassTo: '#2A4FC4',
  glassBorder: 'rgba(255,255,255,.35)',
  glassText: '#E1EAFF',
  chipOnGlass: 'rgba(255,255,255,.14)',
  primaryFrom: '#6B9BFF',
  primaryTo: '#2F5FE0',
  accent: '#5B8DFF',
  accentSoft: '#8DB4FF',
  warn: '#FFB547',
  text: '#FFFFFF',
  textMuted: '#9AA6C9',
  hairline: 'rgba(255,255,255,.12)',
  tabBarBg: 'rgba(12,19,49,.6)',
  tabPill: '#3C74F5',
  chipNeutralBg: 'rgba(255,255,255,.08)',
  chipNeutralText: '#C9D3F2',
  chipWarnBg: 'rgba(255,181,71,.18)',
  chipWarnText: '#FFC978',
  chipAccentBg: 'rgba(60,116,245,.24)',
  chipAccentText: '#9CBEFF',
  iconTileBg: 'rgba(60,116,245,.24)',
  track: 'rgba(255,255,255,.18)',
  trackSoft: 'rgba(255,255,255,.12)',
  progressFillFrom: '#3C74F5',
  progressFillTo: '#8DB8FF',
} as const;

export const fonts = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  bold: 'DMSans_700Bold',
} as const;

export const fontAssets = {
  DMSans_400Regular: require('../../assets/fonts/DMSans-Regular.ttf'),
  DMSans_500Medium: require('../../assets/fonts/DMSans-Medium.ttf'),
  DMSans_700Bold: require('../../assets/fonts/DMSans-Bold.ttf'),
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

export const gradients = {
  background: {
    colors: [colors.bgTop, colors.bgDeep, colors.bgMid, colors.bg] as [string, string, string, string],
    locations: [0, 0.14, 0.34, 0.62] as [number, number, number, number],
    ...angle(180),
  },
  panel: {
    colors: [colors.panelFrom, colors.panelTo] as [string, string],
    ...angle(160),
  },
  glass: {
    colors: [colors.glassFrom, colors.glassMid, colors.glassTo] as [string, string, string],
    ...angle(135),
  },
  primary: {
    colors: [colors.primaryFrom, colors.primaryTo] as [string, string],
    ...angle(160),
  },
  progress: {
    colors: [colors.progressFillFrom, colors.progressFillTo] as [string, string],
    ...angle(90),
  },
};
