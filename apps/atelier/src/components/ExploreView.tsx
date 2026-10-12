'use client';

import Link from 'next/link';
import { useState } from 'react';
import { conceptById, auditConcept, type ConceptId, type ConceptSystem } from '@adequate/design-tokens';
import { screens, screenById, surfaces } from '@adequate/mock-content';
import { useReview } from '@/lib/review-store';
import { usePrefs } from '@/lib/prefs';
import { ScreenPreview, viewports, viewportById } from './ScreenPreview';
import { DecisionBar } from './DecisionBar';
import { StatusChip } from './StatusChip';

export function ViewportPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="at-viewports" role="group" aria-label="Screen size">
      {viewports.map((v) => (
        <button key={v.id} type="button" aria-pressed={value === v.id} onClick={() => onChange(v.id)}>
          {v.label}
        </button>
      ))}
    </div>
  );
}

export function ModeToggle({ conceptId }: { conceptId: ConceptId }) {
  const { modeFor, setMode } = usePrefs();
  const m = modeFor(conceptId);
  return (
    <div className="at-seg" role="group" aria-label="Light or dark">
      {(['light', 'dark'] as const).map((x) => (
        <button key={x} type="button" aria-pressed={m === x} onClick={() => setMode(conceptId, x)}>
          {x === 'light' ? 'Light' : 'Dark'}
        </button>
      ))}
    </div>
  );
}

function ScreensTab({ concept }: { concept: ConceptSystem }) {
  const { current } = useReview();
  const [screenId, setScreenId] = useState('public.home');
  const [variant, setVariant] = useState<'v1' | 'v2'>('v1');
  const [vp, setVp] = useState('desktop');
  const def = screenById[screenId];
  const vdef = def.variants.find((v) => v.key === variant) ?? def.variants[0];
  const viewport = viewportById[vp];

  const choose = (id: string) => {
    setScreenId(id);
    setVariant('v1');
    const d = screenById[id];
    if (d.mobileFirst && viewportById[vp].kind === 'web') setVp('ios');
    if (!d.mobileFirst && viewportById[vp].kind !== 'web') setVp('desktop');
  };

  const statusOf = (sid: string) => {
    const ds = [...current.values()].filter((d) => d.level === 'screen' && d.targetId === sid && d.conceptId === concept.id);
    return ds.find((d) => d.status === 'approved') ?? ds[ds.length - 1];
  };

  return (
    <div className="at-explore">
      <aside className="at-side" aria-label="Screens">
        <div className="at-screenlist">
          {surfaces.map((s) => (
            <div key={s.id}>
              <h3>{s.name}</h3>
              {screens.filter((x) => x.surface === s.id).map((x) => {
                const st = statusOf(x.id);
                return (
                  <button key={x.id} type="button" aria-current={screenId === x.id} onClick={() => choose(x.id)}>
                    <span>{x.name}{x.variants.length > 1 ? <span className="at-muted at-small"> · {x.variants.length}</span> : null}</span>
                    {st ? <StatusChip status={st.status} /> : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </aside>
      <div className="at-stage">
        <div className="at-stage-bar">
          <div>
            <h2 className="at-h2">{def.name}</h2>
            <p className="at-sub">{def.purpose}</p>
          </div>
          {def.variants.length > 1 ? (
            <div className="at-tabs" role="tablist" aria-label="Variants">
              {def.variants.map((v) => (
                <button key={v.id} type="button" role="tab" aria-selected={variant === v.key} onClick={() => setVariant(v.key)}>
                  {v.key === 'v1' ? 'A' : 'B'} · {v.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <p className="at-variant-idea"><strong>{vdef.name}:</strong> {vdef.idea}</p>
        <div className="at-stage-bar">
          <ViewportPicker value={vp} onChange={setVp} />
          <div className="at-row">
            <ModeToggle conceptId={concept.id} />
            <Link className="at-btn at-btn-sm" href={`/preview/?c=${concept.id}&s=${screenId}&v=${variant}`} target="_blank">Full-screen ↗</Link>
            {def.variants.length > 1 ? <Link className="at-btn at-btn-sm" href={`/compare/?a=${concept.id}&b=${concept.id}&screen=${screenId}&va=v1&vb=v2`}>Compare A/B</Link> : null}
          </div>
        </div>
        <div className={`at-preview-box ${viewport.kind !== 'web' ? 'is-narrow' : ''}`}>
          <ScreenPreview conceptId={concept.id} screenId={screenId} variant={variant} viewport={viewport} maxHeight={viewport.kind === 'web' ? 900 : 760} />
        </div>
        <p className="at-small at-muted">Tip: the preview is clickable — menus, tabs, buttons and Android Back all work as a demo. Nothing is real or saved except your review choices.</p>
        <DecisionBar level="screen" conceptId={concept.id} targetId={screenId} variantId={vdef.id} title={`${def.name} · “${vdef.name}” in ${concept.letter}`} prompt={def.prompt} />
      </div>
    </div>
  );
}

function SystemTab({ concept }: { concept: ConceptSystem }) {
  const { modeFor } = usePrefs();
  const mode = modeFor(concept.id);
  const c = concept.color[mode];
  const t = concept.typography;
  const audit = auditConcept(concept, mode);
  const [play, setPlay] = useState(0);
  return (
    <div className="at-spec">
      <section className="at-panel at-wide">
        <h3>Positioning</h3>
        <p style={{ fontSize: 18 }}>{concept.positioning}</p>
        <p className="at-muted" style={{ marginTop: 8 }}><strong>Emotional promise:</strong> {concept.emotionalPromise}</p>
        <p className="at-muted" style={{ marginTop: 8 }}><strong>Copy tone:</strong> {concept.copyTone}</p>
      </section>
      <section className="at-panel">
        <h3>Typography</h3>
        <div style={{ background: c.bg, color: c.ink, padding: 16, borderRadius: 12, display: 'grid', gap: 8 }}>
          <span style={{ fontFamily: `"${t.display.family}", ${t.display.fallback}`, fontSize: 44, lineHeight: 1, textTransform: t.displayCase, letterSpacing: t.displayTracking }}>You are enough.</span>
          <span style={{ fontFamily: `"${t.body.family}", ${t.body.fallback}`, fontSize: 17 }}>Accepting yourself is not the end of change. It is where change can begin. <em>(concept copy)</em></span>
          <span style={{ fontFamily: `"${t.accent.family}", ${t.accent.fallback}`, color: c.accentText, fontSize: 20 }}>{t.accent.usage.split('.')[0]}</span>
        </div>
        <dl className="at-def" style={{ marginTop: 12 }}>
          <dt>Display</dt><dd>{t.display.family} · fallback {t.display.fallback}</dd>
          <dt>Body</dt><dd>{t.body.family} · fallback {t.body.fallback}</dd>
          <dt>Accent</dt><dd>{t.accent.family} · fallback {t.accent.fallback}</dd>
          <dt>Native (iOS / Android)</dt><dd>{t.display.native.ios} / {t.display.native.android} until fonts are bundled</dd>
          <dt>Why this pairing</dt><dd>{t.pairingRationale}</dd>
        </dl>
        <div className="at-scale" style={{ marginTop: 12 }} aria-label="Type scale">
          {t.scale.map((s) => <span key={s} style={{ fontFamily: `"${t.display.family}", ${t.display.fallback}`, background: 'none', fontSize: Math.min(s, 60) }}>{s}</span>)}
        </div>
      </section>
      <section className="at-panel">
        <div className="at-row" style={{ justifyContent: 'space-between' }}><h3>Colour · {mode}</h3><ModeToggle conceptId={concept.id} /></div>
        <div className="at-colors">
          {Object.entries(c).map(([k, v]) => (
            <div key={k} className="at-color"><span style={{ background: v }} /><div><b>{k}</b><br /><span className="at-mono">{v}</span></div></div>
          ))}
        </div>
        <h3 style={{ marginTop: 16 }}>Contrast (computed, WCAG 2.x)</h3>
        <table className="at-audit">
          <tbody>
            {audit.map((a) => (
              <tr key={a.label}>
                <td>{a.label}</td>
                <td className="at-mono">{a.ratio}:1</td>
                <td><span className={`at-chip ${a.pass ? 'at-chip-yes' : 'at-chip-no'}`}>{a.pass ? a.level : `Below ${a.required}:1`}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="at-panel">
        <h3>Spacing, grid & corners</h3>
        <div className="at-scale" aria-label="Spacing scale">
          {concept.spacing.map((s) => <span key={s} title={`${s}px`} style={{ width: Math.min(s, 140), height: Math.min(s, 140) }} />)}
        </div>
        <p className="at-small at-muted" style={{ marginTop: 8 }}>Spacing: {concept.spacing.join(' · ')} px</p>
        <dl className="at-def" style={{ marginTop: 12 }}>
          <dt>Grid</dt><dd>{concept.grid.columns.desktop}/{concept.grid.columns.tablet}/{concept.grid.columns.mobile} columns · max {concept.grid.maxWidth}px. {concept.grid.note}</dd>
          <dt>Corners</dt><dd>{concept.radii.sm}/{concept.radii.md}/{concept.radii.lg}px{concept.radii.pill === 0 ? ' · no rounded corners at all' : ''}</dd>
          <dt>Lines</dt><dd>{concept.borderWidth}px</dd>
        </dl>
      </section>
      <section className="at-panel">
        <h3>Motion</h3>
        <p>{concept.motion.language}</p>
        <div className="at-motion-demo" style={{ marginTop: 12 }}>
          <button type="button" className="at-btn at-btn-sm" onClick={() => setPlay((p) => p + 1)}>Play movement sample</button>
          <div style={{ flex: 1, position: 'relative', height: 28, minWidth: 160 }}>
            <span key={play} className="at-motion-ball" style={{ position: 'absolute', left: 0, background: c.accent, borderRadius: concept.radii.pill, animation: play ? `at-slide ${concept.motion.durations.slow * 1.6}ms ${concept.motion.easing.expressive} 2 alternate` : undefined }} />
          </div>
        </div>
        <p className="at-small at-muted" style={{ marginTop: 8 }}><strong>Reduced motion:</strong> {concept.motion.reducedMotion}</p>
        <h3 style={{ marginTop: 16 }}>Sound visuals</h3>
        <p>{concept.soundVisualization}</p>
      </section>
      <section className="at-panel">
        <h3>Icons & imagery</h3>
        <p><strong>Icons:</strong> {concept.iconography}</p>
        <p style={{ marginTop: 8 }}><strong>Imagery:</strong> {concept.imagery}</p>
        <h3 style={{ marginTop: 16 }}>Watch-outs</h3>
        <ul>{concept.risks.map((r) => <li key={r}>{r}</li>)}</ul>
      </section>
      <section className="at-panel at-wide">
        <h3>Signature moments</h3>
        <div className="at-grid-2">
          {concept.signatureMoments.map((m) => (
            <div key={m.id} style={{ display: 'grid', gap: 8 }}>
              <p><strong>{m.title}.</strong> {m.description}</p>
              <DecisionBar level="feature" conceptId={concept.id} targetId={`feature:${m.id}`} title={m.title} compact />
            </div>
          ))}
        </div>
      </section>
      <section className="at-panel at-wide">
        <h3>Components</h3>
        <div className="at-grid-2">
          {concept.components.map((k) => (
            <div key={k.id} style={{ display: 'grid', gap: 8 }}>
              <p><strong>{k.name}.</strong> {k.anatomy}</p>
              <DecisionBar level="component" conceptId={concept.id} targetId={`component:${k.id}`} title={k.name} compact />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function ExploreView({ conceptId }: { conceptId: ConceptId }) {
  const concept = conceptById[conceptId];
  const [tab, setTab] = useState<'screens' | 'system'>('screens');
  if (!concept) return <main className="at-page">Unknown concept.</main>;
  return (
    <main className="at-page">
      <section className="at-section-head">
        <div style={{ display: 'grid', gap: 6 }}>
          <div className="at-row"><span className="at-letter">{concept.letter}</span><h1 style={{ fontSize: 34, letterSpacing: '-0.02em' }}>{concept.name}</h1></div>
          <p className="at-sub" style={{ fontStyle: 'italic' }}>{concept.tagline}</p>
        </div>
        <div className="at-tabs" role="tablist" aria-label="View">
          <button type="button" role="tab" aria-selected={tab === 'screens'} onClick={() => setTab('screens')}>Screens</button>
          <button type="button" role="tab" aria-selected={tab === 'system'} onClick={() => setTab('system')}>Design system</button>
        </div>
      </section>
      <DecisionBar level="concept" conceptId={concept.id} targetId="overall" title={`Your overall feeling about ${concept.name}`} choices={['love', 'maybe', 'not-for-me']} prompt="Which one feels more like your voice? It is completely fine to say none of these." />
      {tab === 'screens' ? <ScreensTab concept={concept} /> : <SystemTab concept={concept} />}
    </main>
  );
}
