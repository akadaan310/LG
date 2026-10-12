import type { ColorMode, ConceptSystem } from './types';

const fontStack = (f: { family: string; fallback: string }) => `"${f.family}", ${f.fallback}`;

/** CSS custom properties for a concept/mode. Consumed by the atelier's screen styles. */
export function cssVars(concept: ConceptSystem, mode: ColorMode): Record<string, string> {
  const c = concept.color[mode];
  const t = concept.typography;
  const vars: Record<string, string> = {
    '--c-bg': c.bg,
    '--c-surface': c.surface,
    '--c-surface-alt': c.surfaceAlt,
    '--c-ink': c.ink,
    '--c-ink-muted': c.inkMuted,
    '--c-accent': c.accent,
    '--c-on-accent': c.onAccent,
    '--c-accent-text': c.accentText,
    '--c-accent-2': c.accent2,
    '--c-line': c.line,
    '--c-focus': c.focus,
    '--f-display': fontStack(t.display),
    '--f-body': fontStack(t.body),
    '--f-accent': fontStack(t.accent),
    '--display-tracking': t.displayTracking,
    '--display-case': t.displayCase,
    '--lh-tight': String(t.lineHeight.tight),
    '--lh-body': String(t.lineHeight.body),
    '--r-sm': `${concept.radii.sm}px`,
    '--r-md': `${concept.radii.md}px`,
    '--r-lg': `${concept.radii.lg}px`,
    '--r-pill': `${concept.radii.pill}px`,
    '--bw': `${concept.borderWidth}px`,
    '--ease': concept.motion.easing.standard,
    '--ease-enter': concept.motion.easing.enter,
    '--ease-expressive': concept.motion.easing.expressive,
    '--d-quick': `${concept.motion.durations.quick}ms`,
    '--d-base': `${concept.motion.durations.base}ms`,
    '--d-slow': `${concept.motion.durations.slow}ms`,
    '--d-cinematic': `${concept.motion.durations.cinematic}ms`,
    '--maxw': `${concept.grid.maxWidth}px`,
  };
  t.scale.forEach((px, i) => (vars[`--fs-${i}`] = `${px}px`));
  concept.spacing.forEach((px, i) => (vars[`--sp-${i}`] = `${px}px`));
  return vars;
}
