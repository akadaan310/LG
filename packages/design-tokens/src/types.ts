export type ConceptId = 'golden-human' | 'resonance-atlas' | 'living-manifesto';
export type ConceptLetter = 'A' | 'B' | 'C';
export type ColorMode = 'light' | 'dark';

export interface ColorTokens {
  /** Page background */
  bg: string;
  /** Raised surfaces: cards, sheets */
  surface: string;
  /** Secondary surface: wells, inputs, quiet panels */
  surfaceAlt: string;
  /** Primary text */
  ink: string;
  /** Secondary text — must still pass 4.5:1 on bg */
  inkMuted: string;
  /** Brand accent used for marks, rules, focus of attention */
  accent: string;
  /** Text/icon color placed on top of `accent` */
  onAccent: string;
  /** Accent variant safe for body-size text on bg */
  accentText: string;
  /** Secondary accent (spectral line, marginalia ink, etc.) */
  accent2: string;
  /** Hairlines, dividers */
  line: string;
  /** Keyboard focus ring */
  focus: string;
}

export interface FontRole {
  family: string;
  /** CSS fallback stack used if the bundled font fails to load */
  fallback: string;
  /** Font family name for React Native (system fallback until fonts are bundled natively) */
  native: { ios: string; android: string };
  weights: number[];
  usage: string;
}

export interface Typography {
  display: FontRole;
  body: FontRole;
  accent: FontRole;
  /** Type scale in px, smallest → largest */
  scale: number[];
  lineHeight: { tight: number; body: number; loose: number };
  displayTracking: string;
  displayCase: 'none' | 'uppercase';
  pairingRationale: string;
}

export interface Motion {
  language: string;
  easing: { standard: string; enter: string; exit: string; expressive: string };
  durations: { instant: number; quick: number; base: number; slow: number; cinematic: number };
  reducedMotion: string;
}

export interface SignatureMoment {
  id: string;
  title: string;
  description: string;
}

export interface ComponentAnatomy {
  id: string;
  name: string;
  anatomy: string;
}

export interface ConceptSystem {
  id: ConceptId;
  letter: ConceptLetter;
  name: string;
  tagline: string;
  positioning: string;
  emotionalPromise: string;
  descriptors: string[];
  defaultMode: ColorMode;
  color: Record<ColorMode, ColorTokens>;
  typography: Typography;
  spacing: number[];
  grid: {
    maxWidth: number;
    columns: { desktop: number; tablet: number; mobile: number };
    gutter: { desktop: number; tablet: number; mobile: number };
    margin: { desktop: number; tablet: number; mobile: number };
    note: string;
  };
  radii: { sm: number; md: number; lg: number; pill: number };
  borderWidth: number;
  iconography: string;
  imagery: string;
  motion: Motion;
  soundVisualization: string;
  components: ComponentAnatomy[];
  copyTone: string;
  signatureMoments: SignatureMoment[];
  risks: string[];
}
