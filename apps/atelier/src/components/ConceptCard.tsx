'use client';

import Link from 'next/link';
import type { ConceptSystem } from '@adequate/design-tokens';
import { quickReactions, statusLabels } from '@adequate/mock-content';
import { useReview } from '@/lib/review-store';
import { favoriteConcept } from '@/lib/derive';
import { usePrefs } from '@/lib/prefs';
import { ScreenPreview, viewportById } from './ScreenPreview';

export function ConceptCard({ concept }: { concept: ConceptSystem }) {
  const { get, decide, current } = useReview();
  const { modeFor } = usePrefs();
  const reaction = get({ level: 'concept', conceptId: concept.id, targetId: 'overall', variantId: null });
  const fav = favoriteConcept(current) === concept.id;
  const c = concept.color[modeFor(concept.id)];
  const t = concept.typography;

  return (
    <article className={`at-concept ${fav ? 'is-fav' : ''}`} aria-labelledby={`title-${concept.id}`}>
      <div className="at-concept-hero">
        <ScreenPreview conceptId={concept.id} screenId="public.home" variant="v1" viewport={viewportById.desktop} thumbnail label={`${concept.name} homepage preview`} />
        <div className="at-concept-phone">
          <ScreenPreview conceptId={concept.id} screenId="member.today" variant="v1" viewport={viewportById.ios} thumbnail label={`${concept.name} phone preview`} />
        </div>
      </div>
      <div className="at-concept-body">
        <div className="at-concept-title">
          <span className="at-letter" aria-hidden>{concept.letter}</span>
          <h2 id={`title-${concept.id}`}>{concept.name}</h2>
        </div>
        <p className="at-concept-tag">{concept.tagline}</p>
        <div className="at-descriptors">
          {concept.descriptors.map((d) => (
            <span key={d} className="at-chip">{d}</span>
          ))}
        </div>
        <div className="at-specimen" style={{ background: c.bg, color: c.ink }}>
          <span className="at-specimen-aa" style={{ fontFamily: `"${t.display.family}", ${t.display.fallback}`, textTransform: t.displayCase }}>Aa</span>
          <span className="at-specimen-lines">
            <span style={{ fontFamily: `"${t.display.family}", ${t.display.fallback}` }}>{t.display.family} — headlines</span>
            <span style={{ fontFamily: `"${t.body.family}", ${t.body.fallback}` }}>{t.body.family} — reading</span>
            <span style={{ fontFamily: `"${t.accent.family}", ${t.accent.fallback}`, color: c.accentText }}>{t.accent.family} — accents</span>
          </span>
        </div>
        <div className="at-swatches" aria-label="Colour palette">
          {[c.bg, c.surfaceAlt, c.ink, c.accent, c.accent2].map((x, i) => (
            <span key={i} style={{ background: x }} title={x} />
          ))}
        </div>
        <p className="at-promise"><strong>It promises:</strong> {concept.emotionalPromise}</p>
        <div className="at-quick" role="group" aria-label={`Your first feeling about ${concept.name}`}>
          {quickReactions.map((s) => (
            <button
              key={s}
              type="button"
              data-tone={statusLabels[s].tone}
              aria-pressed={reaction?.status === s}
              onClick={() => decide({ level: 'concept', conceptId: concept.id, targetId: 'overall', status: s })}
            >
              {statusLabels[s].short}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="at-fav"
          aria-pressed={fav}
          onClick={() =>
            fav
              ? decide({ level: 'favorite', conceptId: null, targetId: 'overall', status: 'deferred', comment: `Unmarked ${concept.letter} as favourite` })
              : decide({ level: 'favorite', conceptId: concept.id, targetId: 'overall', status: 'approved' })
          }
        >
          {fav ? '★ My favourite overall (tap to unmark)' : '☆ Make this my favourite overall'}
        </button>
        <div className="at-concept-actions">
          <Link className="at-btn at-btn-primary" href={`/concept/${concept.id}/`}>Explore</Link>
          <Link className="at-btn" href={`/compare/?a=${concept.id}`}>Compare</Link>
        </div>
      </div>
    </article>
  );
}
