'use client';

import { useState } from 'react';
import { decisionChoices, nomenclature, statusLabels, type NomenclatureTerm } from '@adequate/mock-content';
import { useReview } from '@/lib/review-store';
import { termDecision } from '@/lib/derive';
import { StatusChip } from './StatusChip';

function TermRow({ term }: { term: NomenclatureTerm }) {
  const { current, decide } = useReview();
  const d = termDecision(current, term.id);
  const label = d?.value || term.term;
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  return (
    <li className="at-term">
      <div className="at-term-main">
        <div>
          <p className="at-term-name">{label}</p>
          {d?.value ? <p className="at-small at-muted">Originally “{term.term}”</p> : null}
          <p className="at-small at-muted">{term.meaning}</p>
        </div>
        {d ? <StatusChip status={d.status} /> : <span className="at-chip">Not decided</span>}
      </div>
      <div className="at-row">
        {decisionChoices.map((s) => (
          <button key={s} type="button" className="at-btn at-btn-sm" aria-pressed={d?.status === s} data-tone={statusLabels[s].tone} onClick={() => decide({ level: 'nomenclature', conceptId: null, targetId: term.id, status: s, value: d?.value ?? null })}>
            {s === 'approved' ? 'Keep this name' : statusLabels[s].label}
          </button>
        ))}
        <button type="button" className="at-btn at-btn-sm" aria-expanded={editing} onClick={() => (setEditing(!editing), setDraft(label))}>
          Suggest a different name
        </button>
      </div>
      {editing ? (
        <form
          className="at-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.trim() || draft.trim() === label) return;
            decide({ level: 'nomenclature', conceptId: null, targetId: term.id, status: 'maybe', value: draft.trim(), comment: `Suggested renaming “${label}” to “${draft.trim()}”` });
            setEditing(false);
          }}
        >
          <label className="vh" htmlFor={`rename-${term.id}`}>New name for {label}</label>
          <input id={`rename-${term.id}`} className="at-input" value={draft} onChange={(e) => setDraft(e.target.value)} />
          <button type="submit" className="at-btn at-btn-sm at-btn-primary">Save suggestion</button>
        </form>
      ) : null}
    </li>
  );
}

export function NomenclaturePanel() {
  return (
    <section className="at-panel" id="names" aria-labelledby="names-title">
      <h2 className="at-h2" id="names-title">The words we use</h2>
      <p className="at-sub">These names are metaphors, not proven mathematics. Keep, change, or drop any of them — or suggest your own words.</p>
      <ul className="at-terms">
        {nomenclature.map((t) => (
          <TermRow key={t.id} term={t} />
        ))}
      </ul>
    </section>
  );
}
