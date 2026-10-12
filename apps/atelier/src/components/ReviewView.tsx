'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { statusLabels } from '@adequate/mock-content';
import { parseReviewState, useReview } from '@/lib/review-store';
import { describeTarget, unresolvedItems } from '@/lib/derive';
import { buildDecisionsJson, buildReviewMarkdown, buildSelectedDirection, download } from '@/lib/exports';
import { StatusChip } from './StatusChip';
import { StorageNote } from './StorageNote';

export function ReviewView() {
  const { state, current, undo, redo, importState, reset } = useReview();
  const [toast, setToast] = useState<string | null>(null);
  const [preview, setPreview] = useState<'none' | 'review' | 'direction'>('none');
  const file = useRef<HTMLInputElement>(null);
  const open = unresolvedItems(state);
  const say = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3200);
  };

  const onImport = async (f: File) => {
    try {
      const parsed = parseReviewState(JSON.parse(await f.text()));
      if (state.decisions.length && !window.confirm(`Replace the ${state.decisions.length} decisions on this device with the ${parsed.decisions.length} in “${f.name}”?`)) return;
      importState(parsed);
      say(`Loaded ${parsed.decisions.length} decisions and ${parsed.proposals.length} proposals from ${f.name}.`);
    } catch (e) {
      say(e instanceof Error ? e.message : 'That file could not be read.');
    }
  };

  const currentList = [...current.values()].sort((a, b) => b.seq - a.seq);

  return (
    <main className="at-page">
      <section className="at-section-head">
        <div>
          <h1 className="at-h2" style={{ fontSize: 30 }}>Review & export</h1>
          <p className="at-sub">Everything recorded so far, who chose it, and when. Nothing counts as approved unless it was explicitly chosen.</p>
        </div>
        <div className="at-row">
          <button type="button" className="at-btn at-btn-sm" onClick={undo} disabled={!state.decisions.length}>↶ Undo last</button>
          <button type="button" className="at-btn at-btn-sm" onClick={redo} disabled={!state.redo.length}>↷ Redo</button>
        </div>
      </section>

      <section className="at-panel" aria-labelledby="exp-title">
        <h2 className="at-h2" id="exp-title">Handoff files</h2>
        <p className="at-sub">Downloads are generated in your browser. Nothing is uploaded.</p>
        <div className="at-row" style={{ marginTop: 14 }}>
          <button type="button" className="at-btn at-btn-primary" onClick={() => download('design-decisions.json', buildDecisionsJson(state), 'application/json')}>Download design-decisions.json</button>
          <button type="button" className="at-btn" onClick={() => download('design-review.md', buildReviewMarkdown(state), 'text/markdown')}>Download design-review.md</button>
          <button type="button" className="at-btn" onClick={() => download('selected-direction.md', buildSelectedDirection(state), 'text/markdown')}>Download selected-direction.md</button>
        </div>
        <div className="at-row" style={{ marginTop: 14 }}>
          <button type="button" className="at-btn at-btn-sm" onClick={() => file.current?.click()}>Import a review file to continue…</button>
          <input ref={file} type="file" accept="application/json,.json" className="vh" aria-label="Import design-decisions.json" onChange={(e) => (e.target.files?.[0] && onImport(e.target.files[0]), (e.target.value = ''))} />
          <button type="button" className="at-btn at-btn-sm" aria-pressed={preview === 'review'} onClick={() => setPreview(preview === 'review' ? 'none' : 'review')}>Preview review.md</button>
          <button type="button" className="at-btn at-btn-sm" aria-pressed={preview === 'direction'} onClick={() => setPreview(preview === 'direction' ? 'none' : 'direction')}>Preview selected-direction.md</button>
          <button
            type="button"
            className="at-btn at-btn-sm"
            onClick={() => {
              if (window.confirm('Clear every decision and proposal on this device? Export first if you want to keep them. This cannot be undone.')) {
                reset();
                say('Cleared. The board is empty again.');
              }
            }}
          >
            Start over (clear this device)
          </button>
        </div>
        {preview !== 'none' ? <pre className="at-md" style={{ marginTop: 14 }}>{preview === 'review' ? buildReviewMarkdown(state) : buildSelectedDirection(state)}</pre> : null}
        <div style={{ marginTop: 12 }}><StorageNote /></div>
      </section>

      <div className="at-grid-2">
        <section className="at-panel" aria-labelledby="open-title">
          <h2 className="at-h2" id="open-title">Still open ({open.length})</h2>
          <p className="at-sub">Not decided yet, or only “maybe / later”. <Link href="/present/">Review these in presentation mode →</Link></p>
          <ul className="at-history" style={{ marginTop: 12 }}>
            {open.map((u) => (
              <li key={u.id}>
                <span>{u.status ? <StatusChip status={u.status} /> : <span className="at-chip">Open</span>}</span>
                <Link href={u.href}>{u.label}</Link>
              </li>
            ))}
            {!open.length ? <li><span>✓</span><span>Everything on the checklist has an explicit answer.</span></li> : null}
          </ul>
        </section>
        <section className="at-panel" aria-labelledby="hist-title">
          <h2 className="at-h2" id="hist-title">History ({state.decisions.length})</h2>
          <p className="at-sub">Newest first. Undo removes the newest entry; redo brings it back.</p>
          <ol className="at-history" style={{ marginTop: 12 }}>
            {state.redo.map((d) => (
              <li key={`r-${d.id}`} style={{ opacity: 0.45 }}>
                <span className="at-mono">{d.id}</span>
                <span><s>{describeTarget(d)} — {statusLabels[d.status].label}</s> (undone)</span>
              </li>
            ))}
            {[...state.decisions].reverse().map((d) => (
              <li key={d.id}>
                <span className="at-mono">{d.id}</span>
                <span>
                  <strong>{d.author}</strong> · {describeTarget(d)} — {statusLabels[d.status].label}
                  {d.emotionTags.length ? <span className="at-muted"> · {d.emotionTags.join(', ')}</span> : null}
                  {d.comment ? <span className="at-muted"> · “{d.comment}”</span> : null}
                  <br /><span className="at-small at-muted">{new Date(d.timestamp).toLocaleString()}</span>
                </span>
              </li>
            ))}
            {!state.decisions.length ? <li><span>—</span><span>No decisions yet. That’s fine — nothing is assumed.</span></li> : null}
          </ol>
        </section>
      </div>

      <section className="at-panel" aria-labelledby="cur-title">
        <h2 className="at-h2" id="cur-title">Current status ledger</h2>
        <div className="at-table-wrap">
          <table className="at-ledger">
            <thead>
              <tr><th>Level</th><th>What</th><th>Concept</th><th>Variant</th><th>Status</th><th>Who</th><th>ID</th></tr>
            </thead>
            <tbody>
              {currentList.map((d) => (
                <tr key={d.id}>
                  <td className="at-mono">{d.level}</td>
                  <td>{describeTarget(d)}</td>
                  <td className="at-mono">{d.conceptId ?? '—'}</td>
                  <td className="at-mono">{d.variantId ?? '—'}</td>
                  <td><StatusChip status={d.status} /></td>
                  <td>{d.author}</td>
                  <td className="at-mono">{d.id}</td>
                </tr>
              ))}
              {!currentList.length ? <tr><td colSpan={7} className="at-muted">Nothing recorded yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
      {toast ? <div className="at-toast" role="status">{toast}</div> : null}
    </main>
  );
}
