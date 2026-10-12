'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { conceptById, type ConceptId } from '@adequate/design-tokens';
import { screenById } from '@adequate/mock-content';
import { ConceptFrame } from '@/screens/kit';
import { RenderScreen } from '@/screens/registry';
import { usePrefs } from '@/lib/prefs';

/**
 * A single mock screen at the real browser width — resize the window (or open on a phone/iPad)
 * to check responsive behaviour with genuine device widths.
 */
export function FullPreview() {
  const q = useSearchParams();
  const prefs = usePrefs();
  const c = (q.get('c') as ConceptId) || 'golden-human';
  const [screen, setScreen] = useState(q.get('s') && screenById[q.get('s')!] ? q.get('s')! : 'public.home');
  const v = q.get('v') === 'v2' && screen === q.get('s') ? 'v2' : 'v1';
  const [w, setW] = useState(1440);
  useEffect(() => {
    const on = () => setW(window.innerWidth);
    on();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const concept = conceptById[c] ?? conceptById['golden-human'];
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
      <ConceptFrame ctx={{ concept, mode: prefs.modeFor(concept.id), platform: 'web', width: w, reducedMotion: prefs.reducedMotion, navigate: setScreen }}>
        <RenderScreen screenId={screen} variant={v} />
      </ConceptFrame>
    </div>
  );
}
