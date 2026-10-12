'use client';

import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';
import { useResource, type ContentRow } from './api';
import { AudioPlayer } from './AudioPlayer';
import { Card, ContentCards, Empty, ErrorNotice, Loading, ProvenanceLabel, ReviewNotice, Rings } from './ui';

export function PublicViews({ route, slug }: { route: string; slug?: string }) {
  const library = useResource<ContentRow[]>(route === 'privacy' ? null : `/api/content${slug ? `?slug=${encodeURIComponent(slug)}` : ''}`);
  const interactive = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [ring, setRing] = useState(0);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const results = useResource<ContentRow[]>(route === 'library' ? `/api/content?q=${encodeURIComponent(search)}` : null);
  const items = library.data ?? [];
  const section = items.filter((item) => item.kind === route);
  if (route === 'privacy') return <article className="section narrow"><ReviewNotice /><p className="eyebrow">Privacy</p><h1>Your information and controls</h1><p>Reflections are private to your account. Optional AI assistance requires your explicit consent. You can edit or remove reflections, export your account data, manage consent, and request account deletion in preferences.</p><p>The operational privacy policy, retention periods, age policy, and launch terms await owner and legal approval. Registration stays closed until the age policy is configured.</p><Link className="button" href="/preferences">Open privacy controls</Link></article>;
  const status = <><ErrorNotice error={library.error} retry={library.reload} />{library.loading ? <Loading /> : null}</>;
  if (route === 'home') {
    const opening = items.find((item) => item.kind === 'home');
    const recording = items.find((item) => item.kind === 'audio');
    return <div data-approved-screen="public.home@v2" data-screen="public.home" data-variant="v2" data-structure="golden-human" data-opening="resonance-atlas">
      <section className="chapters-hero">
        <div className="portrait-placeholder"><Rings count={6} /><p className="mono">Portrait reserved</p><p>No approved founder image supplied.</p></div>
        <div className="chapters-copy"><p className="eyebrow">ADEQUATE · founder platform</p>{opening ? <><ProvenanceLabel provenance={opening.provenance} /><h1>{opening.title}</h1><p className="lead preserve">{opening.body}</p></> : <><span className="badge">Content pending founder approval</span><h1>The opening awaits LG’s words.</h1><p className="lead">This space is reserved for approved founder content.</p></>}{status}
          <ol className="chapter-index">{[['Listen', 'Authorized recordings', '/listen'], ['Read', 'Published principle and writing', '/principle'], ['Reflect', 'Your private reflections', '/today'], ['Membership', 'Access and approval status', '/membership']].map(([title, detail, href], index) => <li key={href}><Link href={href}><span className="chapter-number">{String(index + 1).padStart(2, '0')}</span><strong>{title}</strong><span className="muted">{detail}</span><span aria-hidden="true">↗</span></Link></li>)}</ol>
        </div>
      </section>
      <section className="section listen-teaser"><div><p className="eyebrow">Listening room</p><h2>One voice</h2><p>Recordings appear after publication and rights verification.</p><Link href="/listen">Open the listening room →</Link></div>{recording ? <AudioPlayer content={recording} /> : <Empty>No authorized recording has been published.</Empty>}</section>
      <section className="section manifesto"><p className="eyebrow">Manifesto</p><h2>Reserved for LG’s approved words.</h2><p className="muted">No manifesto text has been approved for this page.</p><Link href="/library">Browse published material →</Link></section>
    </div>;
  }
  if (route === 'story') return <section className="section" data-approved-screen="public.story@v2" data-screen="public.story" data-variant="v2" data-structure="golden-human"><p className="eyebrow">Founder story</p><h1>Moments</h1><p className="lead">LG’s story appears here only in reviewed, published material.</p>{status}<ol className="timeline">{section.length ? section.map((item, index) => <li key={item.id}><Card index={String(index + 1).padStart(2, '0')}><h2><Link href={`/content/${item.slug}`}>{item.title}</Link></h2><ProvenanceLabel provenance={item.provenance} /><p className="preserve">{item.body}</p></Card></li>) : <li><Card index="01"><h2>Story awaiting approval</h2><p>No approved biography, chronology, quotation, or photograph has been supplied.</p></Card></li>}</ol></section>;
  if (route === 'principle') return <section className="section geometry" data-approved-screen="public.principle@v1" data-screen="public.principle" data-variant="v1" data-structure="golden-human"><div><p className="eyebrow">Geometry of Growth</p><h1>The principle</h1><p className="lead">Select a ring to read published principle material.</p>{status}<Card index={String(ring + 1).padStart(2, '0')}><div id="ring-panel" role="tabpanel" aria-labelledby={`ring-tab-${ring}`} tabIndex={0}>{section[ring] ? <><ProvenanceLabel provenance={section[ring].provenance} /><h2>{section[ring].title}</h2><p className="preserve">{section[ring].body}</p></> : <><h2>Ring {String(ring + 1).padStart(2, '0')}</h2><p>Approved principle text has not been published for this ring.</p></>}</div></Card><p className="muted">The geometry is a visual metaphor. Founder text remains subject to approval.</p></div><div className="ring-selector" role="tablist" aria-label="Principle rings" onKeyDown={(event) => { if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? 4 : (ring + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : 4)) % 5; setRing(next); document.getElementById(`ring-tab-${next}`)?.focus(); } }}><Rings />{interactive ? [0, 1, 2, 3, 4].map((index) => <button id={`ring-tab-${index}`} key={index} role="tab" aria-selected={ring === index} aria-controls="ring-panel" tabIndex={ring === index ? 0 : -1} className={ring === index ? 'ring-tab selected' : 'ring-tab'} onClick={() => setRing(index)}><span>Ring {String(index + 1).padStart(2, '0')}</span></button>) : <p role="status">Loading ring controls…</p>}</div></section>;
  if (route === 'listen') {
    const recordings = items.filter((item) => item.kind === 'audio');
    return <section className="section listen-focus" data-approved-screen="public.listen@v1" data-screen="public.listen" data-variant="v1" data-structure="golden-human" data-sound="resonance-atlas"><p className="eyebrow">Listening room</p><h1>One voice</h1>{recordings[0] ? <ProvenanceLabel provenance={recordings[0].provenance} /> : null}<div className="voice-stage"><Rings count={6} />{recordings[0] ? <h2>{recordings[0].title}</h2> : <p>No authorized recording is available.</p>}</div>{status}{recordings[0] ? <AudioPlayer content={recordings[0]} /> : <><button className="play-button" aria-label="Playback unavailable: no approved recording" disabled>▶</button><p className="muted">Playback becomes available when a real recording is published with verified rights.</p></>}{recordings.length > 1 ? <ContentCards items={recordings.slice(1)} /> : null}</section>;
  }
  if (route === 'membership') return <section className="section" data-approved-screen="public.membership@v1" data-screen="public.membership" data-variant="v1" data-structure="golden-human"><p className="eyebrow">Membership</p><h1>Side by side</h1><p className="lead">The comparison structure is approved. Names, pricing, entitlements, and policies await owner approval.</p>{status}{section.length ? <ContentCards items={section} /> : <div className="membership-grid">{['01', '02', '03'].map((index) => <Card key={index} index={index} title={`Membership column ${index}`}><h2>Terms pending</h2><p>Approved plan details have not been supplied.</p><p className="mono">No prices or payments enabled</p></Card>)}</div>}<Link className="button" href="/auth">Sign in to an existing account</Link></section>;
  if (route === 'library') return <section className="section"><ReviewNotice /><p className="eyebrow">Published library</p><h1>Read and listen</h1><form className="search-form" onSubmit={(event) => { event.preventDefault(); setSearch(query); }}><label htmlFor="library-search">Search published content</label><div className="row"><input id="library-search" type="search" maxLength={200} value={query} onChange={(event) => setQuery(event.target.value)} /><button className="button" type="submit">Search</button></div></form><ErrorNotice error={results.error} retry={results.reload} />{results.loading ? <Loading /> : results.data?.length ? <ContentCards items={results.data} /> : !results.error ? <Empty>{search ? 'No published content matches this search.' : 'The published library is empty.'}</Empty> : null}</section>;
  if (route === 'content') return <section className="section narrow"><ReviewNotice />{status}{items[0] ? <ContentDetail item={items[0]} /> : !library.loading && !library.error ? <Empty>This content is unavailable or is not published for your account.</Empty> : null}</section>;
  return null;
}

function ContentDetail({ item }: { item: ContentRow }) {
  const detail = useResource<ContentRow>(`/api/content/${encodeURIComponent(item.id)}`);
  return <article><p className="eyebrow">{item.kind} · published</p><h1>{item.title}</h1><ProvenanceLabel provenance={item.provenance} /><div className="content-body preserve">{item.body}</div><ErrorNotice error={detail.error} retry={detail.reload} />{item.kind === 'audio' || detail.data?.media?.length ? <AudioPlayer content={detail.data ?? item} /> : null}<SaveButton contentId={item.id} /></article>;
}
function SaveButton({ contentId }: { contentId: string }) {
  const [saved, setSaved] = useState(false); const [error, setError] = useState<Error | null>(null); const [busy, setBusy] = useState(false);
  return <div className="space-top"><button type="button" className="button secondary" disabled={busy || saved} onClick={async () => { setBusy(true); setError(null); try { const { api } = await import('./api'); await api('/api/bookmarks', { method: 'POST', body: JSON.stringify({ content_id: contentId }) }); setSaved(true); } catch (reason) { setError(reason as Error); } finally { setBusy(false); } }}>{saved ? 'Saved to your account' : busy ? 'Saving…' : 'Save content'}</button><ErrorNotice error={error} /></div>;
}
