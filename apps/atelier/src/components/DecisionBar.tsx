'use client';

import { useEffect, useState } from 'react';
import type { ConceptId } from '@adequate/design-tokens';
import { decisionChoices, emotionTags, statusLabels, type DecisionStatus } from '@adequate/mock-content';
import { useReview, type DecisionLevel } from '@/lib/review-store';
import { StatusChip } from './StatusChip';

export interface DecisionBarProps {
  level: DecisionLevel;
  conceptId: ConceptId | null;
  targetId: string;
  variantId?: string | null;
  title: string;
  prompt?: string;
  choices?: DecisionStatus[];
  /** Hide tags & notes for a compact bar */
  compact?: boolean;
}

export function DecisionBar({ level, conceptId, targetId, variantId = null, title, prompt, choices = decisionChoices, compact }: DecisionBarProps) {
  const { get, decide, state } = useReview();
  const current = get({ level, conceptId, targetId, variantId });
  const [tags, setTags] = useState<string[]>(current?.emotionTags ?? []);
  const [note, setNote] = useState(current?.comment ?? '');
  const [open, setOpen] = useState(false);

  // When the target changes, load what was last recorded for it.
  useEffect(() => {
    setTags(current?.emotionTags ?? []);
    setNote(current?.comment ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, conceptId, targetId, variantId, current?.id]);

  const record = (status: DecisionStatus) =>
    decide({ level, conceptId, targetId, variantId, status, emotionTags: tags, comment: note.trim() });

  const toggleTag = (t: string) => setTags((xs) => (xs.includes(t) ? xs.filter((x) => x !== t) : [...xs, t]));
  const dirty = current && (note.trim() !== current.comment || tags.join('|') !== current.emotionTags.join('|'));

  return (
    <div className="at-decide">
      <div className="at-decide-head">
        <span className="at-decide-title">{title}</span>
        {current ? <StatusChip status={current.status} /> : <span className="at-chip">Not decided yet</span>}
      </div>
      {prompt ? <p className="at-prompt">{prompt}</p> : null}
      <div className="at-choices" role="group" aria-label={`Decision for ${title}`}>
        {choices.map((s) => (
          <button key={s} type="button" data-tone={statusLabels[s].tone} aria-pressed={current?.status === s} onClick={() => record(s)}>
            {statusLabels[s].label}
          </button>
        ))}
      </div>
      {!compact ? (
        <>
          <button type="button" className="at-btn at-btn-sm" aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? 'Hide feelings & notes' : 'Add a feeling or a note'}
            {tags.length || note ? ` (${tags.length + (note ? 1 : 0)})` : ''}
          </button>
          {open ? (
            <>
              <div className="at-tags" role="group" aria-label="How does it feel?">
                {emotionTags.map((t) => (
                  <button key={t} type="button" aria-pressed={tags.includes(t)} onClick={() => toggleTag(t)}>
                    {t}
                  </button>
                ))}
              </div>
              <label className="vh" htmlFor={`note-${level}-${targetId}-${variantId}`}>Note</label>
              <textarea id={`note-${level}-${targetId}-${variantId}`} className="at-note" placeholder="Say it however it comes — no design words needed." value={note} onChange={(e) => setNote(e.target.value)} />
              <div className="at-row">
                {current ? (
                  <button type="button" className="at-btn at-btn-sm at-btn-primary" disabled={!dirty} onClick={() => record(current.status)}>
                    Save with “{statusLabels[current.status].label}”
                  </button>
                ) : (
                  <span className="at-small at-muted">Pick a choice above to save your feelings and note with it.</span>
                )}
              </div>
            </>
          ) : null}
        </>
      ) : null}
      {current ? (
        <p className="at-last">
          {current.id} · {current.author} · {new Date(current.timestamp).toLocaleString()} {state.author !== current.author ? `· now deciding as ${state.author}` : ''}
        </p>
      ) : null}
    </div>
  );
}
