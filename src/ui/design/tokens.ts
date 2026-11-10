import { fonts, lightColors, radius, spacing, useTheme } from '../theme';

/** Tokens derivados diretamente da referência Hello Nasara / Meu Kumbo. */
const baseTokens = {
  fonts,
  radius: { ...radius, panel: 28, circle: 999 },
  spacing: { ...spacing, page: 18, section: 16 },
  motion: {
    pressIn: 70,
    pressOut: 160,
    sheet: 320,
    entrance: 300,
    stagger: 45,
  },
} as const;

export const designTokens = {
  ...baseTokens,
  colors: {
    ...lightColors,
    referenceBackground: '#EDEDED',
    referencePanel: '#FFFFFF',
    referenceAccent: '#9C32D7',
    referenceYellow: '#FFD35B',
    referencePositive: '#1F9D57',
    referenceNegative: '#D9423B',
  },
} as const;

/** Tokens com a paleta ativa (clara ou escura). */
export function useDesignTokens() {
  const { colors, dark } = useTheme();

  return {
    ...baseTokens,
    dark,
    colors: {
      ...colors,
      referenceBackground: colors.bg,
      referencePanel: colors.bgMid,
      referenceAccent: colors.accent,
      referenceYellow: colors.warn,
      referencePositive: colors.success,
      referenceNegative: colors.danger,
    },
  };
}
