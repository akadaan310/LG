import { createContext, useContext, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { conceptById, type ColorMode, type ColorTokens, type ConceptId, type ConceptSystem } from '@adequate/design-tokens';

export interface Theme {
  concept: ConceptSystem;
  mode: ColorMode;
  c: ColorTokens;
  font: { display: string; body: string; accent: string };
  upper: boolean;
  radius: ConceptSystem['radii'];
  border: number;
  space: (i: number) => number;
  reducedMotion: boolean;
}

/**
 * Native font families come from the tokens' system fallbacks. The bundled web fonts
 * (Fraunces, Space Grotesk, Anton…) are a handoff item: load them with expo-font once chosen.
 */
export function makeTheme(id: ConceptId, mode: ColorMode, reducedMotion: boolean): Theme {
  const concept = conceptById[id];
  const t = concept.typography;
  const pick = (r: { native: { ios: string; android: string } }) =>
    Platform.select({ ios: r.native.ios, android: r.native.android, default: r.native.ios }) as string;
  return {
    concept,
    mode,
    c: concept.color[mode],
    font: { display: pick(t.display), body: pick(t.body), accent: pick(t.accent) },
    upper: t.displayCase === 'uppercase',
    radius: concept.radii,
    border: concept.borderWidth,
    space: (i) => concept.spacing[Math.min(i, concept.spacing.length - 1)],
    reducedMotion,
  };
}

const ThemeCtx = createContext<Theme | null>(null);

export function ThemeProvider({ theme, children }: { theme: Theme; children: ReactNode }) {
  return <ThemeCtx.Provider value={theme}>{children}</ThemeCtx.Provider>;
}

export function useTheme(): Theme {
  const t = useContext(ThemeCtx);
  if (!t) throw new Error('useTheme outside ThemeProvider');
  return t;
}
