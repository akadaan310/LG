import type { ColorMode, ConceptSystem } from './types';
import { contrastRatio, wcagLevel, type WcagLevel } from './contrast';

export interface ContrastCheck {
  label: string;
  fg: string;
  bg: string;
  ratio: number;
  level: WcagLevel;
  /** Minimum required for this pairing's intended use */
  required: number;
  pass: boolean;
}

/** Computed (not hand-written) contrast audit for the key pairings of a concept. */
export function auditConcept(concept: ConceptSystem, mode: ColorMode): ContrastCheck[] {
  const c = concept.color[mode];
  const pairs: [string, string, string, number][] = [
    ['Body text on page', c.ink, c.bg, 4.5],
    ['Body text on card', c.ink, c.surface, 4.5],
    ['Secondary text on page', c.inkMuted, c.bg, 4.5],
    ['Secondary text on card', c.inkMuted, c.surface, 4.5],
    ['Accent text on page', c.accentText, c.bg, 4.5],
    ['Label on accent button', c.onAccent, c.accent, 4.5],
    ['Accent mark on page (non-text)', c.accent, c.bg, 3],
    ['Focus ring on page', c.focus, c.bg, 3],
  ];
  return pairs.map(([label, fg, bg, required]) => {
    const ratio = contrastRatio(fg, bg);
    return { label, fg, bg, ratio, level: wcagLevel(ratio), required, pass: ratio >= required };
  });
}
