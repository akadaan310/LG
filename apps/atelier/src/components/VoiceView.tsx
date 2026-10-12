'use client';

import { useEffect, useRef, useState } from 'react';
import { concepts, conceptById, type ConceptId } from '@adequate/design-tokens';
import { impactOptions, screens, screenById, surfaces } from '@adequate/mock-content';
import { useReview } from '@/lib/review-store';
import { DecisionBar } from './DecisionBar';

type RecState = 'idle' | 'asking' | 'recording' | 'done' | 'denied' | 'unsupported';

/** Optional, local-only microphone capture. The audio lives in memory for this tab only. */
function LocalRecorder() {
  const [st, setSt] = useState<RecState>('idle');
  const [url, setUrl] = useState<string | null>(null);
  const [secs, setSecs] = useState(0);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
    if (timer.current) clearInterval(timer.current);
    rec.current?.stream.getTracks().forEach((t) => t.stop());
  }, [url]);

  const start = async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') return setSt('unsupported');
    setSt('asking');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      chunks.current = [];
      r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: r.mimeType || 'audio/webm' });
        setUrl((old) => (old && URL.revokeObjectURL(old), URL.createObjectURL(blob)));
        setSt('done');
      };
      rec.current = r;
      r.start();
      setSecs(0);
      timer.current = setInterval(() => setSecs((s) => s + 1), 1000);
      setSt('recording');
    } catch {
      setSt('denied');
    }
  };
  const stop = () => {
    rec.current?.stop();
    if (timer.current) clearInterval(timer.current);
  };

  return (
    <div className="at-callout">
      <strong>Optional: speak it instead (local only)</strong>
      <span>Recording stays in this browser tab only. It is never uploaded, transcribed, or analysed, and is not saved with your review. Close the tab and it’s gone — download it if you want to keep it.</span>
      <div className="at-row" style={{ marginTop: 6 }}>
        {st === 'recording' ? (
          <button type="button" className="at-btn at-btn-primary" onClick={stop}><span className="at-rec-dot" aria-hidden /> Stop · {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}</button>
        ) : (
          <button type="button" className="at-btn" onClick={start} disabled={st === 'asking'}>🎙 {st === 'done' ? 'Record again' : 'Start recording'}</button>
        )}
        {st === 'asking' ? <span className="at-small">Waiting for microphone permission…</span> : null}
        {st === 'denied' ? <span className="at-small">Microphone not allowed — that’s fine, typing works just as well.</span> : null}
        {st === 'unsupported' ? <span className="at-small">This browser can’t record here. Typing works just as well.</span> : null}
      </div>
      {url ? (
        <div className="at-row">
          <audio controls src={url} aria-label="Your local recording" />
          <a className="at-btn at-btn-sm" href={url} download="founder-voice-recording.webm">Download recording</a>
        </div>
      ) : null}
    </div>
  );
}

export function VoiceView() {
  const { state, propose, removeProposal, current } = useReview();
  const [text, setText] = useState('');
  const [impact, setImpact] = useState(impactOptions[0]);
  const [impactNote, setImpactNote] = useState('');
  const [surfaceId, setSurfaceId] = useState('public.home');
  const [conceptId, setConceptId] = useState<ConceptId | ''>('');
  const [saved, setSaved] = useState<string | null>(null);

  const submit = () => {
    if (!text.trim()) return;
    propose({ text: text.trim(), impact, impactNote: impactNote.trim(), surfaceId, conceptId: conceptId || null });
    setSaved(`p-${String(state.nextProposal).padStart(4, '0')}`);
    setText('');
    setImpactNote('');
    setTimeout(() => setSaved(null), 3000);
  };

  return (
    <main className="at-page">
      <section>
        <h1 className="at-h2" style={{ fontSize: 30 }}>Founder Voice</h1>
        <p className="at-sub" style={{ maxWidth: 820 }}>
          Write or paste an idea — a feeling, a belief, a line you’d say on stage. Choose what you want it to do for someone, and attach it to a place in the design.
          This is a simple local notebook. It does <strong>not</strong> use AI and nothing is rewritten: your words are saved exactly as typed, as a proposal for review.
        </p>
      </section>
      <div className="at-voice">
        <section className="at-panel" style={{ display: 'grid', gap: 16 }}>
          <label className="at-field">
            Your idea, in your words
            <textarea className="at-note" value={text} onChange={(e) => setText(e.target.value)} placeholder="Say it however it comes…" />
          </label>
          <div className="at-field">
            What should someone feel or do because of it?
            <div className="at-impacts" role="group" aria-label="Intended impact">
              {impactOptions.map((o) => (
                <button key={o} type="button" aria-pressed={impact === o} onClick={() => setImpact(o)}>{o}</button>
              ))}
            </div>
            <input className="at-input" value={impactNote} onChange={(e) => setImpactNote(e.target.value)} placeholder="Anything else about the impact? (optional)" aria-label="Impact note" />
          </div>
          <div className="at-row">
            <label className="at-field" style={{ flex: 1, minWidth: 220 }}>
              Where could it show up?
              <select className="at-select" value={surfaceId} onChange={(e) => setSurfaceId(e.target.value)}>
                {surfaces.map((s) => (
                  <optgroup key={s.id} label={s.name}>
                    {screens.filter((x) => x.surface === s.id).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </label>
            <label className="at-field" style={{ flex: 1, minWidth: 220 }}>
              In which direction? (optional)
              <select className="at-select" value={conceptId} onChange={(e) => setConceptId(e.target.value as ConceptId | '')}>
                <option value="">Any / not sure</option>
                {concepts.map((c) => <option key={c.id} value={c.id}>{c.letter} · {c.name}</option>)}
              </select>
            </label>
          </div>
          <div className="at-row">
            <button type="button" className="at-btn at-btn-primary" onClick={submit} disabled={!text.trim()}>Save as a proposal</button>
            <span className="at-small at-muted">Recorded as {state.author}. Saved words are labelled “captured locally, not yet approved for public use”.</span>
          </div>
          {saved ? <p role="status" className="at-chip at-chip-yes">Saved as {saved}</p> : null}
        </section>
        <LocalRecorder />
      </div>

      <section style={{ display: 'grid', gap: 12 }}>
        <h2 className="at-h2">Proposals ({state.proposals.length})</h2>
        {!state.proposals.length ? <p className="at-muted">None yet.</p> : null}
        {[...state.proposals].reverse().map((p) => (
          <article key={p.id} className="at-panel" style={{ display: 'grid', gap: 10 }}>
            <div className="at-row" style={{ justifyContent: 'space-between' }}>
              <span className="at-mono">{p.id} · {p.author} · {new Date(p.createdAt).toLocaleString()}</span>
              <button
                type="button"
                className="at-btn at-btn-sm"
                onClick={() => {
                  if (!current.get(`proposal|${p.id}`) || window.confirm('Remove this proposal? Its decisions stay in history.')) removeProposal(p.id);
                }}
              >
                Remove
              </button>
            </div>
            <blockquote style={{ margin: 0, fontSize: 19, borderLeft: '3px solid var(--at-ink)', paddingLeft: 14, whiteSpace: 'pre-wrap' }}>{p.text}</blockquote>
            <p className="at-small">
              Wants people to: <strong>{p.impact}</strong>{p.impactNote ? ` — ${p.impactNote}` : ''} · On: <strong>{screenById[p.surfaceId]?.name ?? p.surfaceId}</strong>
              {p.conceptId ? <> · In: <strong>{conceptById[p.conceptId].name}</strong></> : null}
            </p>
            <p className="at-small at-muted">{p.provenance}</p>
            <DecisionBar level="proposal" conceptId={null} targetId={p.id} title="Should this move forward?" compact />
          </article>
        ))}
      </section>
    </main>
  );
}
