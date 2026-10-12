'use client';

import { useEffect, useRef, useState } from 'react';
import { concepts, conceptById, type ConceptId, type ConceptSystem } from '@adequate/design-tokens';
import { hybridSlots, type HybridSlot } from '@adequate/mock-content';
import { useReview } from '@/lib/review-store';
import { favoriteConcept, hybridSelections } from '@/lib/derive';
import { usePrefs } from '@/lib/prefs';
import { Card, ConceptFrame, Mark, Rings, Wave, Marquee, Constellation, type ScreenCtx } from '@/screens/kit';
import { ScreenPreview, viewportById } from './ScreenPreview';

export function SlotMini({ slot, concept }: { slot: HybridSlot; concept: ConceptSystem }) {
  const t = concept.typography;
  switch (slot.id) {
    case 'slot.hero':
      return <ScreenPreview conceptId={concept.id} screenId="public.home" variant="v1" viewport={viewportById.desktop} thumbnail maxHeight={110} />;
    case 'slot.dashboard':
      return <ScreenPreview conceptId={concept.id} screenId="member.today" variant="v2" viewport={viewportById.desktop} thumbnail maxHeight={110} />;
    case 'slot.typography':
      return (
        <div className="at-cell-mini">
          <span className="ad-display" style={{ fontSize: 34, lineHeight: 1 }}>Aa Enough</span>
          <span style={{ fontSize: 13 }}>{t.display.family} · {t.body.family}</span>
        </div>
      );
    case 'slot.palette': {
      const c = concept.color[concept.defaultMode];
      return (
        <div className="at-cell-mini" style={{ flexDirection: 'row', gap: 0, padding: '24px 0 0' }}>
          {[c.bg, c.surfaceAlt, c.ink, c.accent, c.accent2].map((x, i) => (
            <span key={i} style={{ flex: 1, background: x, minHeight: 52 }} />
          ))}
        </div>
      );
    }
    case 'slot.symbols':
      return (
        <div className="at-cell-mini" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Mark size={36} />
          {concept.id === 'resonance-atlas' ? <div style={{ width: 90 }}><Constellation labels={['a', 'b', 'c', 'd']} height={50} /></div> : concept.id === 'golden-human' ? <div style={{ width: 60 }}><Rings count={3} /></div> : <span className="ad-display" style={{ fontSize: 30 }}>→ ■ ○</span>}
        </div>
      );
    case 'slot.motion':
      return (
        <div className="at-cell-mini">
          <span className="at-motion-track" aria-hidden style={{ height: 14, position: 'relative', display: 'block' }}>
            <span className="at-motion-dot" style={{ position: 'absolute', width: 14, height: 14, borderRadius: concept.radii.pill, background: 'var(--c-accent)', animation: `at-slide ${concept.motion.durations.slow * 2.4}ms ${concept.motion.easing.expressive} infinite alternate` }} />
          </span>
          <span style={{ fontSize: 12, lineHeight: 1.3 }}>{concept.motion.language.split(':')[0]}</span>
        </div>
      );
    case 'slot.audio':
      return <div className="at-cell-mini" style={{ justifyContent: 'center' }}><div style={{ maxHeight: 70, overflow: 'hidden' }}><Wave bars={concept.id === 'resonance-atlas' ? 36 : 28} playing progress={0.4} /></div></div>;
    case 'slot.navigation':
      return (
        <div className="at-cell-mini">
          {concept.id === 'living-manifesto' ? <Marquee /> : null}
          <span style={{ fontSize: 12, lineHeight: 1.35 }}>{concept.components.find((c) => c.id === 'nav')?.anatomy}</span>
        </div>
      );
    case 'slot.cards':
      return (
        <div className="at-cell-mini">
          <Card index="01"><span className="ad-h3" style={{ fontSize: 15 }}>Strengths</span><span style={{ fontSize: 12 }}>Keeps showing up</span></Card>
        </div>
      );
    case 'slot.founder':
      return (
        <div className="at-cell-mini">
          <span className="ad-display" style={{ fontSize: 18 }}>Say it the way you’d say it.</span>
          <span className="ad-btn ad-btn-primary ad-btn-sm" style={{ minHeight: 28, fontSize: 11, width: 'fit-content' }}>Capture</span>
        </div>
      );
    default:
      return null;
  }
}

export function HybridPanel() {
  const { current, decide } = useReview();
  const { reducedMotion, modeFor } = usePrefs();
  const sel = hybridSelections(current);
  const fav = favoriteConcept(current);
  const [pulse, setPulse] = useState(0);
  const first = useRef(true);
  const sig = JSON.stringify(sel) + fav;
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setPulse((p) => p + 1);
  }, [sig]);

  const pick = (slot: HybridSlot, c: ConceptId) => {
    if (sel[slot.id] === c) decide({ level: 'hybrid', conceptId: null, targetId: slot.id, status: 'deferred', comment: 'Cleared selection' });
    else decide({ level: 'hybrid', conceptId: c, targetId: slot.id, status: 'approved' });
  };

  const chosen = hybridSlots.filter((s) => sel[s.id]);
  return (
    <section className="at-panel" id="mix" aria-labelledby="mix-title">
      <div className="at-section-head">
        <div>
          <h2 className="at-h2" id="mix-title">Mix & match</h2>
          <p className="at-sub">You don’t have to choose all-or-nothing. Love one direction overall, and borrow parts from the others. Tap a tile to choose it; tap again to clear.</p>
        </div>
      </div>
      <div key={pulse} className={`at-summary ${pulse ? 'at-pulse' : ''}`} role="status" aria-live="polite" style={{ margin: '16px 0' }}>
        <span>Your direction so far:</span>
        <b>{fav ? `Favourite overall — ${conceptById[fav].letter} · ${conceptById[fav].name}` : 'No favourite chosen yet'}</b>
        {chosen.length ? <span>·</span> : null}
        {chosen.map((s) => (
          <span key={s.id} className="at-chip">{s.name}: {conceptById[sel[s.id]!].letter}</span>
        ))}
        {!chosen.length ? <span className="at-muted">· nothing mixed in yet</span> : null}
      </div>
      <div className="at-hybrid">
        <div className="at-hybrid-row at-hybrid-labels" aria-hidden>
          <span />
          {concepts.map((c) => (
            <span key={c.id} className="at-hybrid-head">{c.letter} · {c.name}</span>
          ))}
        </div>
        {hybridSlots.map((slot) => (
          <div className="at-hybrid-row" key={slot.id} role="group" aria-label={slot.question}>
            <div className="at-hybrid-slot">
              <b>{slot.name}</b>
              <span>{slot.question}</span>
            </div>
            {concepts.map((c) => {
              const on = sel[slot.id] === c.id;
              const ctx: ScreenCtx = { concept: c, mode: modeFor(c.id), platform: 'web', width: 320, reducedMotion };
              return (
                <div key={c.id} className="at-cell" data-on={on}>
                  <span className="at-cell-letter" aria-hidden>{c.letter}</span>
                  {on ? <span className="at-cell-check" aria-hidden>✓ Chosen</span> : null}
                  <div inert className="at-cell-art">
                    <ConceptFrame ctx={ctx}>
                      <SlotMini slot={slot} concept={c} />
                    </ConceptFrame>
                  </div>
                  <button type="button" className="at-cell-hit" aria-pressed={on} aria-label={`${slot.name} from ${c.letter} · ${c.name}${on ? ' (chosen — tap to clear)' : ''}`} onClick={() => pick(slot, c.id)} />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
