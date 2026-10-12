'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { concepts, conceptById, type ConceptId } from '@adequate/design-tokens';
import { gentlePrompts, hybridSlots, quickReactions, screens, statusLabels, type HybridSlot } from '@adequate/mock-content';
import { useReview } from '@/lib/review-store';
import { usePrefs } from '@/lib/prefs';
import { favoriteConcept, hybridSelections, screenVariantDecisions, unresolvedItems } from '@/lib/derive';
import { ConceptFrame, type ScreenCtx } from '@/screens/kit';
import { ScreenPreview, viewportById } from './ScreenPreview';
import { SlotMini } from './HybridPanel';
import { DecisionBar } from './DecisionBar';
import { NomenclaturePanel } from './NomenclaturePanel';

type Step =
  | { kind: 'intro' }
  | { kind: 'concept'; concept: ConceptId }
  | { kind: 'hybrid'; slot: HybridSlot }
  | { kind: 'screen'; screenId: string }
  | { kind: 'names' }
  | { kind: 'end' };

function ConceptStep({ id }: { id: ConceptId }) {
  const c = conceptById[id];
  const { get, decide, current } = useReview();
  const r = get({ level: 'concept', conceptId: id, targetId: 'overall', variantId: null });
  const fav = favoriteConcept(current) === id;
  return (
    <>
      <h2>{c.letter} · {c.name}</h2>
      <p className="at-sub" style={{ fontSize: 20 }}>{c.tagline} {c.emotionalPromise}</p>
      <div className="at-variant-pair" style={{ gridTemplateColumns: '3fr 1fr' }}>
        <ScreenPreview conceptId={id} screenId="public.home" variant="v1" viewport={viewportById.desktop} maxHeight={560} />
        <ScreenPreview conceptId={id} screenId="member.today" variant="v1" viewport={viewportById.ios} maxHeight={560} />
      </div>
      <p className="at-prompt">What would you want someone to feel here? Does this feel like your voice?</p>
      <div className="at-quick" style={{ maxWidth: 720 }}>
        {quickReactions.map((s) => (
          <button key={s} type="button" data-tone={statusLabels[s].tone} aria-pressed={r?.status === s} onClick={() => decide({ level: 'concept', conceptId: id, targetId: 'overall', status: s })} style={{ minHeight: 64, fontSize: 18 }}>
            {statusLabels[s].label}
          </button>
        ))}
      </div>
      <button type="button" className="at-fav" style={{ maxWidth: 720 }} aria-pressed={fav} onClick={() => (fav ? decide({ level: 'favorite', conceptId: null, targetId: 'overall', status: 'deferred' }) : decide({ level: 'favorite', conceptId: id, targetId: 'overall', status: 'approved' }))}>
        {fav ? '★ My favourite overall' : '☆ Make this my favourite overall'}
      </button>
    </>
  );
}

function HybridStep({ slot }: { slot: HybridSlot }) {
  const { current, decide } = useReview();
  const { reducedMotion, modeFor } = usePrefs();
  const sel = hybridSelections(current)[slot.id];
  return (
    <>
      <h2>{slot.question}</h2>
      <p className="at-sub">Mix & match · {slot.name}. You can take this from any direction, whatever your favourite is.</p>
      <div className="at-big-choices">
        {concepts.map((c) => {
          const ctx: ScreenCtx = { concept: c, mode: modeFor(c.id), platform: 'web', width: 420, reducedMotion };
          const on = sel === c.id;
          return (
            <div key={c.id} className="at-cell" data-on={on} style={{ height: 240 }}>
              <span className="at-cell-letter" aria-hidden>{c.letter}</span>
              {on ? <span className="at-cell-check" aria-hidden>✓ Chosen</span> : null}
              <div inert className="at-cell-art" style={{ zoom: 1.6 } as CSSProperties}>
                <ConceptFrame ctx={ctx}><SlotMini slot={slot} concept={c} /></ConceptFrame>
              </div>
              <button type="button" className="at-cell-hit" aria-pressed={on} aria-label={`${slot.name} from ${c.name}`} onClick={() => (on ? decide({ level: 'hybrid', conceptId: null, targetId: slot.id, status: 'deferred' }) : decide({ level: 'hybrid', conceptId: c.id, targetId: slot.id, status: 'approved' }))} />
            </div>
          );
        })}
      </div>
      <p className="at-small at-muted">Tap again to clear. “None of these” is fine — just move on and it stays open.</p>
    </>
  );
}

function ScreenStep({ screenId, prompt }: { screenId: string; prompt: string }) {
  const { current } = useReview();
  const def = screens.find((s) => s.id === screenId)!;
  const fav = favoriteConcept(current);
  const [c, setC] = useState<ConceptId>(fav ?? 'golden-human');
  const vp = def.mobileFirst ? viewportById.ios : viewportById.desktop;
  return (
    <>
      <div className="at-section-head">
        <div>
          <h2>{def.name}</h2>
          <p className="at-sub">{def.purpose}</p>
        </div>
        <div className="at-seg" role="group" aria-label="Show in which direction">
          {concepts.map((x) => (
            <button key={x.id} type="button" aria-pressed={c === x.id} onClick={() => setC(x.id)}>{x.letter} · {x.name.replace('The ', '')}</button>
          ))}
        </div>
      </div>
      <p className="at-prompt">{def.prompt} <span className="at-muted">· {prompt}</span></p>
      <div className="at-variant-pair">
        {def.variants.map((v) => (
          <div key={v.id} style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
            <p><strong>{v.key === 'v1' ? 'First way' : 'Second way'} — {v.name}.</strong> <span className="at-muted">{v.idea}</span></p>
            <div className={`at-preview-box ${vp.kind !== 'web' ? 'is-narrow' : ''}`} style={{ padding: 12 }}>
              <ScreenPreview conceptId={c} screenId={screenId} variant={v.key} viewport={vp} maxHeight={vp.kind === 'web' ? 460 : 560} />
            </div>
            <DecisionBar level="screen" conceptId={c} targetId={screenId} variantId={v.id} title={`${v.name} · ${conceptById[c].letter}`} />
          </div>
        ))}
      </div>
    </>
  );
}

export function PresentView() {
  const { state, current, undo } = useReview();
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [i, setI] = useState(0);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const all: Step[] = useMemo(
    () => [
      { kind: 'intro' },
      ...concepts.map((c) => ({ kind: 'concept' as const, concept: c.id })),
      ...hybridSlots.map((s) => ({ kind: 'hybrid' as const, slot: s })),
      ...screens.filter((s) => s.priority).map((s) => ({ kind: 'screen' as const, screenId: s.id })),
      { kind: 'names' },
      { kind: 'end' },
    ],
    [],
  );

  const isOpen = useCallback(
    (s: Step) => {
      if (s.kind === 'concept') {
        const d = current.get(`concept|${s.concept}|overall|-`);
        return !d;
      }
      if (s.kind === 'hybrid') return !hybridSelections(current)[s.slot.id];
      if (s.kind === 'screen') return !screenVariantDecisions(current, s.screenId).some((d) => d.status === 'approved');
      return true;
    },
    [current],
  );
  // Freeze the queue when the filter is switched on so steps don't vanish mid-decision.
  const [frozen, setFrozen] = useState<Step[] | null>(null);
  const steps = onlyOpen && frozen ? frozen : all;
  const step = steps[Math.min(i, steps.length - 1)];
  const go = useCallback((d: number) => setI((n) => Math.max(0, Math.min(steps.length - 1, n + d))), [steps.length]);

  const toggleFull = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        go(1);
      }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        go(-1);
      }
      if (e.key === 'f' || e.key === 'F') toggleFull();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, toggleFull]);

  const toggleOpen = () => {
    if (!onlyOpen) {
      setFrozen(all.filter((s) => s.kind === 'intro' || s.kind === 'end' || s.kind === 'names' || isOpen(s)));
      setI(0);
    }
    setOnlyOpen(!onlyOpen);
  };

  const open = unresolvedItems(state).length;
  let body: ReactNode = null;
  if (step.kind === 'intro')
    body = (
      <>
        <h2>Let’s look at ADEQUATE together.</h2>
        <p className="at-sub" style={{ fontSize: 20, maxWidth: 820 }}>
          We’ll go through three directions, then pick parts you like, then a few important screens. Use the big buttons, the arrow keys, or swipe.
          There are no wrong answers, and nothing is decided until you say so — skipping something simply leaves it open.
        </p>
        <p className="at-prompt">Right now you are recording as <strong>{state.author}</strong>. Switch at the top of the screen if someone else is deciding.</p>
        <p className="at-small at-muted">All words in these designs are concept copy, not LG’s own words. Member data is invented. Nothing is live.</p>
      </>
    );
  else if (step.kind === 'concept') body = <ConceptStep id={step.concept} />;
  else if (step.kind === 'hybrid') body = <HybridStep slot={step.slot} />;
  else if (step.kind === 'screen') body = <ScreenStep key={step.screenId} screenId={step.screenId} prompt={gentlePrompts[i % gentlePrompts.length]} />;
  else if (step.kind === 'names') body = (<><h2>Do these words feel like yours?</h2><NomenclaturePanel /></>);
  else
    body = (
      <>
        <h2>Thank you.</h2>
        <p className="at-sub" style={{ fontSize: 20 }}>{state.decisions.length} choices recorded · {open} things still open.</p>
        <div className="at-row">
          <Link className="at-btn at-btn-primary" href="/review/">See everything & export</Link>
          <Link className="at-btn" href="/voice/">Add an idea in Founder Voice</Link>
          <button type="button" className="at-btn" onClick={toggleOpen}>{onlyOpen ? 'Show all steps' : 'Review only what’s still open'}</button>
        </div>
      </>
    );

  return (
    <div
      className="at-present"
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        if (!touch.current) return;
        const dx = e.changedTouches[0].clientX - touch.current.x;
        const dy = e.changedTouches[0].clientY - touch.current.y;
        if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
        touch.current = null;
      }}
    >
      <div className="at-present-top">
        <Link href="/" className="at-btn at-btn-sm">✕ Exit</Link>
        <span className="at-small at-muted" aria-live="polite">Step {Math.min(i, steps.length - 1) + 1} of {steps.length}{onlyOpen ? ' · open items only' : ''}</span>
        <div className="at-progress" aria-hidden><span style={{ width: `${((Math.min(i, steps.length - 1) + 1) / steps.length) * 100}%` }} /></div>
        <button type="button" className="at-btn at-btn-sm" aria-pressed={onlyOpen} onClick={toggleOpen}>{onlyOpen ? 'Showing open items' : `Review unresolved (${open})`}</button>
        <button type="button" className="at-btn at-btn-sm" onClick={undo} disabled={!state.decisions.length}>↶ Undo</button>
        <button type="button" className="at-btn at-btn-sm" onClick={toggleFull}>⤢ Full screen</button>
      </div>
      <div className="at-present-body">
        <div key={`${onlyOpen}-${i}`} className="at-present-step">{body}</div>
      </div>
      <div className="at-present-bottom">
        <button type="button" className="at-btn" onClick={() => go(-1)} disabled={i === 0}>← Previous</button>
        <span className="at-small at-muted">Arrow keys · swipe · F for full screen</span>
        <button type="button" className="at-btn at-btn-primary" onClick={() => go(1)} disabled={i >= steps.length - 1}>Next →</button>
      </div>
    </div>
  );
}
