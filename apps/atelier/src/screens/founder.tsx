'use client';

import { useState } from 'react';
import { copy, provenanceLabels, screens } from '@adequate/mock-content';
import { Badge, Btn, Card, Display, Eyebrow, Icon, Note, Stamp, Tag, Wave, useScreen } from './kit';
import { StudioShell } from './shells';

type V = { v: 'v1' | 'v2' };
const fs = copy.founderStudio;

export function FounderCapture({ v }: V) {
  const [rec, setRec] = useState(false);
  return (
    <StudioShell kind="founder" active="founder.capture">
      {v === 'v1' ? (
        <section className="ad-capture">
          <Eyebrow>An idea arrived?</Eyebrow>
          <Display size="l">Say it the way you’d say it.</Display>
          <div className="ad-voice-stage"><Wave playing={rec} progress={0} bars={40} label="Simulated capture rings — nothing is recorded" /></div>
          <button type="button" className={`ad-recbtn ${rec ? 'is-rec' : ''}`} aria-pressed={rec} onClick={() => setRec(!rec)}>
            <Icon name="mic" /><span>{rec ? 'Capturing (simulated)…' : 'Capture an idea (simulated)'}</span>
          </button>
          <Note>In the real Studio, your original audio and exact words are kept unchanged. This mockup records nothing.</Note>
        </section>
      ) : (
        <section className="ad-notebook">
          <div className="ad-notebook-page">
            <p className="ad-mono">New idea · today</p>
            <textarea rows={8} aria-label="Write an idea" placeholder="Write it down while it’s fresh…" />
            <div className="ad-row">
              <button type="button" className="ad-iconbtn" aria-label="Speak instead (simulated)" onClick={() => setRec(!rec)}><Icon name="mic" /></button>
              {rec ? <Wave playing bars={20} /> : <Note>or speak instead</Note>}
              <Btn small>Keep idea (demo)</Btn>
            </div>
          </div>
        </section>
      )}
    </StudioShell>
  );
}

export function FounderTranscript({ v }: V) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <StudioShell kind="founder" active="founder.transcript">
      {v === 'v1' ? (
        <section className="ad-split">
          <Card label="Your exact words">
            <p className="ad-quote-block">{fs.capturedIdea}</p>
            <span className="ad-prov">{provenanceLabels.placeholder}</span>
            <div className="ad-mini-player"><Icon name="play" /><Wave bars={30} /><span className="ad-mono">original audio</span></div>
          </Card>
          <Card label="Possible readings — not your words">
            {fs.interpretations.map((i) => (
              <div key={i.id} className="ad-interp">
                <p>{i.text}</p>
                <div className="ad-row"><Tag>{i.status}</Tag><Btn small kind="secondary">That’s right</Btn><Btn small kind="ghost">Not what I meant</Btn></div>
              </div>
            ))}
            <span className="ad-prov">{provenanceLabels['concept-copy']}</span>
          </Card>
        </section>
      ) : (
        <section className="ad-highlights">
          <Card label="Your exact words">
            <p className="ad-quote-block">
              Placeholder transcript. <button type="button" className="ad-hl" aria-expanded={open === 'int-1'} onClick={() => setOpen(open === 'int-1' ? null : 'int-1')}>In the real Studio</button>, this would be LG’s exact recorded words, <button type="button" className="ad-hl" aria-expanded={open === 'int-2'} onClick={() => setOpen(open === 'int-2' ? null : 'int-2')}>transcribed and kept unchanged</button>. No transcript of LG exists in this prototype.
            </p>
            {open ? (
              <div className="ad-hl-pop" role="note">
                <p className="ad-note">Interpretation — not your words</p>
                <p>{fs.interpretations.find((i) => i.id === open)?.text}</p>
                <div className="ad-row"><Btn small kind="secondary">That’s right</Btn><Btn small kind="ghost">Not what I meant</Btn></div>
              </div>
            ) : null}
            <span className="ad-prov">{provenanceLabels.placeholder}</span>
          </Card>
        </section>
      )}
    </StudioShell>
  );
}

export function FounderConcepts() {
  return (
    <StudioShell kind="founder" active="founder.concepts">
      <section className="ad-clusters">
        {fs.clusters.map((c, i) => (
          <Card key={c.theme} index={String(i + 1).padStart(2, '0')} label="Theme">
            <h3 className="ad-h3">{c.theme}</h3>
            <ul className="ad-pills">{c.ideas.map((x) => <li key={x}>{x}</li>)}</ul>
            <p className="ad-note">Could show up in:</p>
            <div className="ad-row ad-wrap">{c.uses.map((u) => <Tag key={u}>{u}</Tag>)}</div>
          </Card>
        ))}
      </section>
      <Badge kind="concept" />
    </StudioShell>
  );
}

const cols: [string, string][] = [['new', 'New'], ['discussing', 'Talking it over'], ['yes', 'Yes'], ['not-now', 'Not now']];

export function FounderProposals({ v }: V) {
  const { concept } = useScreen();
  const [i, setI] = useState(0);
  const [verdict, setVerdict] = useState<Record<string, string>>({});
  const p = fs.proposals[i];
  return (
    <StudioShell kind="founder" active="founder.proposals">
      {v === 'v1' ? (
        <section className="ad-kanban">
          {cols.map(([id, label]) => (
            <div key={id} className="ad-kcol">
              <p className="ad-kcol-head">{label}</p>
              {fs.proposals.filter((x) => x.column === id).map((x) => (
                <Card key={x.id} label={x.id}><p>{x.title}</p></Card>
              ))}
            </div>
          ))}
        </section>
      ) : (
        <section className="ad-one">
          <p className="ad-mono">{i + 1} of {fs.proposals.length} · {p.id}</p>
          <Card className="ad-one-card">
            <p className="ad-display ad-display-m">{p.title}</p>
            <p className="ad-note">Gentle question: what would you want someone to feel here?</p>
            {verdict[p.id] ? (concept.id === 'living-manifesto' ? <Stamp>{verdict[p.id]}</Stamp> : <Tag active>{verdict[p.id]}</Tag>) : null}
          </Card>
          <div className="ad-row ad-center ad-wrap">
            {['Yes, this one', 'Not now', 'Let’s talk about it', 'No'].map((x) => (
              <Btn key={x} kind={x === 'Yes, this one' ? 'primary' : 'secondary'} small onClick={() => setVerdict({ ...verdict, [p.id]: x })}>{x}</Btn>
            ))}
          </div>
          <div className="ad-row ad-center">
            <Btn kind="ghost" small onClick={() => setI((n) => Math.max(0, n - 1))}>Previous</Btn>
            <Btn kind="ghost" small onClick={() => setI((n) => Math.min(fs.proposals.length - 1, n + 1))}>Next</Btn>
          </div>
          <Note>Silence is never approval. Nothing moves forward without an explicit yes.</Note>
        </section>
      )}
    </StudioShell>
  );
}

export function FounderTimeline() {
  const steps = [
    ['Recorded', 'Original audio kept unchanged', 'placeholder'],
    ['Transcribed', 'Exact words, marked as LG’s', 'placeholder'],
    ['Interpreted', 'Readings marked as interpretations', 'concept-copy'],
    ['Proposed', 'prop-001 — open with one question', 'concept-copy'],
    ['LG approved', 'Awaiting explicit approval', 'placeholder'],
    ['Handed to engineer', 'Not yet', 'placeholder'],
  ] as const;
  return (
    <StudioShell kind="founder" active="founder.timeline">
      <ol className="ad-prov-timeline">
        {steps.map(([t, d, pv], i) => (
          <li key={t} style={{ animationDelay: `${i * 120}ms` }}>
            <span className="ad-timeline-dot" aria-hidden />
            <div>
              <p className="ad-h3">{t}</p>
              <p>{d}</p>
              <span className="ad-prov">{provenanceLabels[pv]}</span>
            </div>
          </li>
        ))}
      </ol>
    </StudioShell>
  );
}

/* ——————————————————— Developer ——————————————————— */

export function DevIntake() {
  return (
    <StudioShell kind="developer" active="dev.intake">
      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr><th>ID</th><th>Proposal</th><th>Source</th><th>Surfaces</th><th>Status</th></tr>
          </thead>
          <tbody>
            {fs.proposals.map((p, i) => (
              <tr key={p.id}>
                <td className="ad-mono">{p.id}</td>
                <td>{p.title}</td>
                <td>{i % 2 ? 'Founder Voice (typed)' : 'Studio capture'}</td>
                <td>{['member.today', 'member.voice', 'public.membership', 'member.preferences'][i]}</td>
                <td><Tag>{cols.find((c) => c[0] === p.column)?.[1]}</Tag></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Card label="Acceptance criteria · prop-001 (example)">
        <ul className="ad-checks">
          <li><Icon name="check" /> Today opens on one question with no competing modules</li>
          <li><Icon name="check" /> Skipping is always available and never penalised</li>
          <li><Icon name="check" /> Meets WCAG AA contrast and dynamic type up to 200%</li>
        </ul>
      </Card>
      <Badge kind="synthetic" />
    </StudioShell>
  );
}

export function DevCompare() {
  const groups = ['public', 'member', 'founder'] as const;
  const touched = new Set(['member.today', 'member.onboarding', 'public.home', 'public.tools']);
  return (
    <StudioShell kind="developer" active="dev.compare">
      <section className="ad-split">
        <Card label="Before · member.today@v2"><div className="ad-thumb ad-thumb-dash"><span /><span /><span /><span /></div></Card>
        <Card label="After · member.today@v1"><div className="ad-thumb ad-thumb-focus"><span /></div></Card>
      </section>
      <Card label="Impact map · prop-001">
        <div className="ad-impact">
          {groups.map((g) => (
            <div key={g}>
              <p className="ad-mono">{g}</p>
              <div className="ad-impact-cells">
                {screens.filter((s) => s.surface === g).map((s) => (
                  <span key={s.id} className={`ad-impact-cell ${touched.has(s.id) ? 'is-hit' : ''}`} title={s.name}>{s.name}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </StudioShell>
  );
}

export function DevStatus() {
  const rows = [
    ['concept', 'Overall direction', 'Not decided'],
    ['hybrid', 'Mix & match selections', 'Not decided'],
    ['screen', 'Screen variants', 'Not decided'],
    ['nomenclature', 'Brand terms', 'Not decided'],
  ];
  return (
    <StudioShell kind="developer" active="dev.status">
      <Card label="Status ledger (mockup — the live ledger is in the Atelier’s Review page)">
        <div className="ad-table-wrap">
        <table className="ad-table">
          <thead><tr><th>Level</th><th>Item</th><th>Status</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r[0]}><td className="ad-mono">{r[0]}</td><td>{r[1]}</td><td><Tag>{r[2]}</Tag></td></tr>)}</tbody>
        </table>
        </div>
      </Card>
      <div className="ad-row">
        <Btn small kind="secondary">design-decisions.json</Btn>
        <Btn small kind="secondary">design-review.md</Btn>
        <Btn small kind="secondary">selected-direction.md</Btn>
      </div>
      <Note>Mock buttons. Real exports live in the Atelier’s Review &amp; export page.</Note>
    </StudioShell>
  );
}
