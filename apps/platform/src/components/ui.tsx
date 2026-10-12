'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ApiError } from './api';

export function ReviewNotice() { return <p className="review-notice" role="note">Review proposal · this screen’s layout and terminology await owner approval.</p>; }
export function ErrorNotice({ error, retry }: { error: Error | null; retry?: () => void }) {
  if (!error) return null;
  return <div className="error-notice" role="alert"><p>{error.message}</p>{error instanceof ApiError && error.traceId ? <p className="mono">Reference: {error.traceId}</p> : null}{retry ? <button type="button" className="button secondary" onClick={retry}>Try again</button> : null}</div>;
}
export function Loading() { return <p className="muted" role="status">Loading…</p>; }
export function Empty({ children }: { children: ReactNode }) { return <div className="empty-state">{children}</div>; }
export function Card({ index, title, className = '', children }: { index?: string; title?: string; className?: string; children: ReactNode }) {
  return <section className={`card ${className}`} data-card-direction="living-manifesto">{index ? <span className="card-index" aria-hidden="true">{index}</span> : null}{title ? <h2 className="card-label">{title}</h2> : null}{children}</section>;
}
export function ContentCards({ items }: { items: { id: string; slug: string; title: string; kind: string; provenance: string }[] }) {
  return <div className="content-grid">{items.map((item, index) => <Card key={item.id} index={String(index + 1).padStart(2, '0')}><p className="eyebrow">{item.kind}</p><h2><Link href={`/content/${encodeURIComponent(item.slug)}`}>{item.title}</Link></h2><ProvenanceLabel provenance={item.provenance} /></Card>)}</div>;
}
export function ProvenanceLabel({ provenance }: { provenance: string }) { const labels: Record<string, string> = { founder_original: 'Founder original · reviewed publication', user_authored: 'Contributor-authored · reviewed publication', ai_assisted: 'AI-assisted · reviewed publication', placeholder: 'Placeholder · unapproved' }; return <p className="badge">{labels[provenance] ?? 'Source provenance unavailable'}</p>; }
export function Rings({ count = 5 }: { count?: number }) { return <div className="radial-rings" aria-hidden="true">{Array.from({ length: count }, (_, index) => <span key={index} style={{ width: `${100 - index * (85 / count)}%`, height: `${100 - index * (85 / count)}%` }} />)}<i /></div>; }

export function AiSuggestion({ result }: { result: unknown }) {
  const data = result as { label?: string; source?: string; output?: { title?: string; sections?: { heading: string; text: string }[]; draft?: string; summary?: string; tags?: string[] } };
  const output = data.output;
  return <div className="ai-output"><p className="badge">{data.source === 'mock' ? 'Mock AI suggestion · local test output' : 'AI-generated suggestion'} · never saved automatically</p>{data.label ? <p className="muted">{data.label}</p> : null}{output?.title ? <h3>{output.title}</h3> : null}{output?.sections?.map((section, index) => <section key={index}><h3>{section.heading}</h3><p className="preserve">{section.text}</p></section>)}{output?.draft ? <p className="preserve">{output.draft}</p> : null}{output?.summary ? <p className="preserve">{output.summary}</p> : null}{output?.tags?.length ? <p>{output.tags.join(' · ')}</p> : null}<p className="muted">Review this suggestion yourself. Your original work remains unchanged.</p></div>;
}
