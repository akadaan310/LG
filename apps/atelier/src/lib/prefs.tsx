'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { conceptById, type ColorMode, type ConceptId } from '@adequate/design-tokens';
import { PREFS_KEY } from './review-store';

export type MotionPref = 'system' | 'on' | 'off';
export type Platform = 'ios' | 'android';

interface Prefs {
  motion: MotionPref;
  platform: Platform;
  modes: Partial<Record<ConceptId, ColorMode>>;
}

interface PrefsApi extends Prefs {
  setMotion: (m: MotionPref) => void;
  setPlatform: (p: Platform) => void;
  modeFor: (c: ConceptId) => ColorMode;
  setMode: (c: ConceptId, m: ColorMode) => void;
  /** true when animations should be suppressed */
  reducedMotion: boolean;
}

const PrefsContext = createContext<PrefsApi | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>({ motion: 'system', platform: 'ios', modes: {} });
  const [systemReduced, setSystemReduced] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PREFS_KEY);
      if (raw) setPrefs((p) => ({ ...p, ...JSON.parse(raw) }));
    } catch {
      /* ignore */
    }
    setLoaded(true);
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setSystemReduced(mq.matches);
    const on = () => setSystemReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      /* ignore */
    }
  }, [prefs, loaded]);

  const reducedMotion = prefs.motion === 'off' || (prefs.motion === 'system' && systemReduced);

  useEffect(() => {
    document.documentElement.dataset.motion = reducedMotion ? 'off' : 'on';
  }, [reducedMotion]);

  const api = useMemo<PrefsApi>(
    () => ({
      ...prefs,
      reducedMotion,
      setMotion: (motion) => setPrefs((p) => ({ ...p, motion })),
      setPlatform: (platform) => setPrefs((p) => ({ ...p, platform })),
      modeFor: (c) => prefs.modes[c] ?? conceptById[c].defaultMode,
      setMode: (c, m) => setPrefs((p) => ({ ...p, modes: { ...p.modes, [c]: m } })),
    }),
    [prefs, reducedMotion],
  );

  return <PrefsContext.Provider value={api}>{children}</PrefsContext.Provider>;
}

export function usePrefs(): PrefsApi {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error('usePrefs must be used inside PrefsProvider');
  return ctx;
}
