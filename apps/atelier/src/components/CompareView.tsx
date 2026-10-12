'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { concepts, conceptById, type ConceptId } from '@adequate/design-tokens';
import { screens, screenById, surfaces, gentlePrompts } from '@adequate/mock-content';
import { ScreenPreview, viewportById } from './ScreenPreview';
import { ViewportPicker } from './ExploreView';
import { DecisionBar } from './DecisionBar';

const isConcept = (x: string | null): x is ConceptId => !!x && x in conceptById;

function Side({ label, concept, setConcept, variant, setVariant, screenId, vp, hidden }: {
  label: string; concept: ConceptId; setConcept: (c: ConceptId) => void; variant: 'v1' | 'v2'; setVariant: (v: 'v1' | 'v2') => void; screenId: string; vp: string; hidden: boolean;
}) {
  const def = screenById[screenId];
  const vdef = def.variants.find((v) => v.key === variant) ?? def.variants[0];
  const viewport = viewportById[vp];
  return (
    <div className="at-compare-side" data-hidden={hidden}>
      <div className="at-compare-pick">
        <strong>{label}</strong>
        <div className="at-seg" role="group" aria-label={`${label}: direction`}>
          {concepts.map((c) => (
            <button key={c.id} type="button" aria-pressed={concept === c.id} onClick={() => setConcept(c.id)} title={c.name}>{c.letter} · {c.name.replace('The ', '')}</button>
          ))}
        </div>
        {def.variants.length > 1 ? (
          <div className="at-seg" role="group" aria-label={`${label}: variant`}>
            {def.variants.map((v) => (
              <button key={v.id} type="button" aria-pressed={variant === v.key} onClick={() => setVariant(v.key)}>{v.name}</button>
            ))}
          </div>
        ) : null}
      </div>
      <p className="at-small at-muted">{vdef.idea}</p>
      <div className={`at-preview-box ${viewport.kind !== 'web' ? 'is-narrow' : ''}`} style={{ padding: 12 }}>
        <ScreenPreview conceptId={concept} screenId={screenId} variant={vdef.key} viewport={viewport} maxHeight={viewport.kind === 'web' ? 640 : 680} />
      </div>
      <DecisionBar level="screen" conceptId={concept} targetId={screenId} variantId={vdef.id} title={`${conceptById[concept].letter} · ${def.name} · “${vdef.name}”`} />
    </div>
  );
}

export function CompareView() {
  const q = useSearchParams();
  const router = useRouter();
  const [screenId, setScreenId] = useState(q.get('screen') && screenById[q.get('screen')!] ? q.get('screen')! : 'public.home');
  const [a, setA] = useState<ConceptId>(isConcept(q.get('a')) ? (q.get('a') as ConceptId) : 'golden-human');
  const [b, setB] = useState<ConceptId>(isConcept(q.get('b')) ? (q.get('b') as ConceptId) : a === 'resonance-atlas' ? 'living-manifesto' : 'resonance-atlas');
  const [va, setVa] = useState<'v1' | 'v2'>(q.get('va') === 'v2' ? 'v2' : 'v1');
  const [vb, setVb] = useState<'v1' | 'v2'>(q.get('vb') === 'v2' ? 'v2' : 'v1');
  const [vp, setVp] = useState(screenById[screenId].mobileFirst ? 'ios' : 'desktop');
  const [showing, setShowing] = useState<'a' | 'b'>('a');
  const touch = useRef<number | null>(null);
  const def = screenById[screenId];
  const prompt = gentlePrompts[screens.indexOf(def) % gentlePrompts.length];

  const changeScreen = (id: string) => {
    setScreenId(id);
    setVa('v1');
    setVb(screenById[id].variants.length > 1 && a === b ? 'v2' : 'v1');
    setVp(screenById[id].mobileFirst ? 'ios' : 'desktop');
    router.replace(`/compare/?screen=${id}&a=${a}&b=${b}`, { scroll: false });
  };

  return (
    <main
      className="at-page"
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current == null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 60) setShowing(dx < 0 ? 'b' : 'a');
        touch.current = null;
      }}
    >
      <section className="at-section-head">
        <div>
          <h1 className="at-h2" style={{ fontSize: 30 }}>Compare side by side</h1>
          <p className="at-sub">{def.prompt}</p>
        </div>
        <label className="at-field">
          Screen
          <select className="at-select" value={screenId} onChange={(e) => changeScreen(e.target.value)}>
            {surfaces.map((s) => (
              <optgroup key={s.id} label={s.name}>
                {screens.filter((x) => x.surface === s.id).map((x) => (
                  <option key={x.id} value={x.id}>{x.name}{x.variants.length > 1 ? ' (2 variants)' : ''}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </section>
      <p className="at-prompt">{prompt}</p>
      <div className="at-row" style={{ justifyContent: 'space-between' }}>
        <ViewportPicker value={vp} onChange={setVp} />
        <div className="at-seg at-swipe-toggle" role="group" aria-label="Show left or right (or swipe)">
          <button type="button" aria-pressed={showing === 'a'} onClick={() => setShowing('a')}>◀ Left</button>
          <button type="button" aria-pressed={showing === 'b'} onClick={() => setShowing('b')}>Right ▶</button>
        </div>
      </div>
      <div className="at-compare">
        <Side label="Left" concept={a} setConcept={setA} variant={va} setVariant={setVa} screenId={screenId} vp={vp} hidden={showing !== 'a'} />
        <Side label="Right" concept={b} setConcept={setB} variant={vb} setVariant={setVb} screenId={screenId} vp={vp} hidden={showing !== 'b'} />
      </div>
    </main>
  );
}
