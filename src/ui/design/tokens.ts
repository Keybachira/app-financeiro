import { duracao } from '../movimento';
import { coresClaras, fonts, layout, radius, spacing, useTema } from '../tema';

/**
 * Tokens derivados do design system canónico (`src/ui/tema` + `src/ui/movimento`).
 *
 * Não há valores próprios aqui: raios, espaçamentos, tipografia e durações vêm
 * todos da mesma fonte que os componentes usam, para não voltar a existir uma
 * segunda paleta a divergir da primeira.
 */
const baseTokens = {
  fonts,
  radius,
  spacing: {
    ...spacing,
    /** Padding horizontal de página (`.scroll`). */
    page: layout.screenPadding,
    section: spacing.lg,
  },
  motion: duracao,
} as const;

export const tokensDesign = {
  ...baseTokens,
  colors: coresClaras,
} as const;

/** Tokens com a paleta ativa (clara ou escura). */
export function useTokensDesign() {
  const { colors, dark } = useTema();

  return {
    ...baseTokens,
    colors,
    dark,
  };
}
