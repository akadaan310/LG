'use client';

import { useState } from 'react';
import { brand, copy, nomenclature } from '@adequate/mock-content';
import {
  Atmosphere, Badge, Btn, Card, Constellation, Display, Eyebrow, Hand, Icon, Lead, Note, Portrait,
  RevealLines, Rings, Stamp, Tag, Wave, useScreen,
} from './kit';
import { PublicPage } from './shells';

type V = { v: 'v1' | 'v2' };

/* ——————————————————— Homepage ——————————————————— */

function HeroThreshold() {
  const { concept, navigate } = useScreen();
  const id = concept.id;
  return (
    <section className={`ad-hero ad-hero-threshold ad-hero-${id}`}>
      <Atmosphere />
      <div className="ad-hero-inner">
        {id === 'resonance-atlas' ? <p className="ad-mono ad-coord">N 00°00′ · YOU ARE HERE · PRESENT MOMENT</p> : null}
        <Eyebrow>{brand.expansion}</Eyebrow>
        <Display size="xxl">
          <RevealLines lines={copy.heroLines} accentIndex={1} />
        </Display>
        <Lead>{copy.heroLead}</Lead>
        <div className="ad-row">
          <Btn onClick={() => navigate?.('member.onboarding')}>Begin free</Btn>
          <Btn kind="secondary" onClick={() => navigate?.('public.listen')}>Listen to LG</Btn>
        </div>
        <Badge kind="concept" />
        {id === 'golden-human' ? <Hand>a place to begin again →</Hand> : null}
      </div>
      {id === 'resonance-atlas' ? (
        <div className="ad-hero-orbit" aria-hidden>
          <Rings count={6} />
        </div>
      ) : null}
    </section>
  );
}

function ManifestoStrip() {
  const { concept } = useScreen();
  return (
    <section className="ad-section ad-manifesto">
      <Eyebrow>Manifesto</Eyebrow>
      <ol className="ad-manifesto-lines">
        {copy.manifesto.map((l, i) => (
          <li key={i} style={{ animationDelay: `${i * 160}ms` }}>
            {concept.id === 'resonance-atlas' ? <span className="ad-mono">{String(i + 1).padStart(2, '0')} —</span> : null}
            {l}
          </li>
        ))}
      </ol>
      <Badge kind="concept" />
    </section>
  );
}

function PrinciplesGrid() {
  return (
    <section className="ad-section">
      <Eyebrow>The Adequacy Principle</Eyebrow>
      <Display as="h2" size="l">Worth first. Growth by choice.</Display>
      <div className="ad-grid ad-grid-3">
        {copy.principles.slice(0, 3).map((p) => (
          <Card key={p.n} index={p.n}>
            <h3 className="ad-h3">{p.title}</h3>
            <p>{p.body}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function ListenTeaser() {
  const [playing, setPlaying] = useState(false);
  return (
    <section className="ad-section ad-listen-teaser">
      <div>
        <Eyebrow>Listening room</Eyebrow>
        <Display as="h2" size="l">Hear it in his voice.</Display>
        <Note>Placeholder recording. No audio plays in this prototype; LG’s recordings need permission before use.</Note>
      </div>
      <div className="ad-player">
        <button type="button" className="ad-playbtn" aria-label={playing ? 'Pause (simulated)' : 'Play (simulated)'} onClick={() => setPlaying(!playing)}>
          <Icon name={playing ? 'pause' : 'play'} />
        </button>
        <div className="ad-player-body">
          <p className="ad-player-title">{copy.recordings[0].title}</p>
          <Wave playing={playing} progress={playing ? 0.5 : 0.2} />
        </div>
        <span className="ad-mono ad-player-time">{copy.recordings[0].length}</span>
      </div>
    </section>
  );
}

function ChaptersHero() {
  const { navigate, concept } = useScreen();
  return (
    <section className={`ad-hero ad-hero-chapters ad-hero-${concept.id}`}>
      <Atmosphere />
      <div className="ad-chapters-grid">
        <Portrait tall />
        <div className="ad-chapters-copy">
          <Eyebrow>Meet LG · founder of ADEQUATE</Eyebrow>
          <Display size="xl">
            <RevealLines lines={['Always remember:', 'everyone is', 'adequate.']} accentIndex={2} />
          </Display>
          <Lead>{copy.heroLead}</Lead>
          <Badge kind="concept" />
          <ol className="ad-chapter-index">
            {[
              ['01', 'Listen', 'Recordings in LG’s voice', 'public.listen'],
              ['02', 'Read', 'The Principle & the book', 'public.principle'],
              ['03', 'Try', 'A free reflection today', 'member.today'],
              ['04', 'Gather', 'Circles & workshops', 'public.together'],
            ].map(([n, t, d, to]) => (
              <li key={n}>
                <button type="button" className="ad-chapter-link" onClick={() => navigate?.(to)}>
                  <span className="ad-chapter-n">{n}</span>
                  <span className="ad-chapter-t">{t}</span>
                  <span className="ad-chapter-d">{d}</span>
                  <Icon name="back" />
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export function PublicHome({ v }: V) {
  return (
    <PublicPage active="public.home">
      {v === 'v1' ? (
        <>
          <HeroThreshold />
          <ManifestoStrip />
          <PrinciplesGrid />
          <ListenTeaser />
        </>
      ) : (
        <>
          <ChaptersHero />
          <ListenTeaser />
          <ManifestoStrip />
        </>
      )}
    </PublicPage>
  );
}

/* ——————————————————— Story ——————————————————— */

export function PublicStory({ v }: V) {
  const { concept } = useScreen();
  return (
    <PublicPage active="public.story">
      {v === 'v1' ? (
        <article className="ad-section ad-letter">
          <div className="ad-letter-main">
            <Eyebrow>Founder story</Eyebrow>
            <Display size="xl">A letter from LG</Display>
            <Badge kind="placeholder" />
            <p className="ad-dropcap">
              This letter is a placeholder. When LG is ready, this page will hold his story in his own words — exactly as he tells it, reviewed and approved by him before anyone else reads it. Nothing here is a quotation.
            </p>
            {copy.manifesto.map((l, i) => (
              <p key={i}>{l}</p>
            ))}
            <Note>Lines above are concept copy for layout, not LG’s words.</Note>
          </div>
          <aside className="ad-letter-margin" aria-label="Margin notes">
            <Portrait />
            {concept.id === 'golden-human' ? <Hand>margin note: room for LG’s handwriting or a scanned page</Hand> : <Note>Margin: photographs, dates, recordings.</Note>}
          </aside>
        </article>
      ) : (
        <section className="ad-section">
          <Eyebrow>Founder story</Eyebrow>
          <Display size="xl">Moments that made the message</Display>
          <Badge kind="placeholder" />
          <ol className="ad-timeline">
            {copy.storyMoments.map((m, i) => (
              <li key={i} className="ad-timeline-item" style={{ animationDelay: `${i * 140}ms` }}>
                <span className="ad-timeline-dot" aria-hidden />
                <Card index={String(i + 1).padStart(2, '0')}>
                  <h3 className="ad-h3">{m.title}</h3>
                  <p>{m.body}</p>
                  <div className="ad-mini-player"><Icon name="play" /><Wave bars={28} /><span className="ad-mono">--:--</span></div>
                </Card>
              </li>
            ))}
          </ol>
        </section>
      )}
    </PublicPage>
  );
}

/* ——————————————————— Principle ——————————————————— */

export function PublicPrinciple({ v }: V) {
  const [ring, setRing] = useState(0);
  const items = copy.principles;
  return (
    <PublicPage active="public.principle">
      {v === 'v1' ? (
        <section className="ad-section ad-geometry">
          <div>
            <Eyebrow>Geometry of Growth</Eyebrow>
            <Display size="xl">Growth widens from a steady centre.</Display>
            <Lead>Tap a ring. The centre — your worth — never moves. Each ring is a way of growing from it.</Lead>
            <Card className="ad-ring-card" index={items[ring].n}>
              <h3 className="ad-h3" key={ring}>{items[ring].title}</h3>
              <p>{items[ring].body}</p>
            </Card>
            <Note>A metaphor, not a scientific model. Concept copy.</Note>
          </div>
          <Rings count={5} labels={items.map((p) => p.title)} active={ring} onPick={setRing} />
        </section>
      ) : (
        <section className="ad-section">
          <Eyebrow>The Adequacy Principle</Eyebrow>
          <Display size="xl">Stated plainly.</Display>
          <dl className="ad-qa">
            {items.map((p) => (
              <div key={p.n} className="ad-qa-item">
                <dt><span className="ad-qa-n">{p.n}</span> {p.title}?</dt>
                <dd>{p.body}</dd>
              </div>
            ))}
          </dl>
          <div className="ad-terms">
            {nomenclature.map((t) => (
              <Tag key={t.id}>{t.term}</Tag>
            ))}
          </div>
          <Badge kind="concept" />
        </section>
      )}
    </PublicPage>
  );
}

/* ——————————————————— Tools ——————————————————— */

export function PublicTools({ v }: V) {
  const [sel, setSel] = useState(0);
  const t = copy.tools[sel];
  return (
    <PublicPage active="public.tools">
      {v === 'v1' ? (
        <section className="ad-section ad-tools">
          <div>
            <Eyebrow>Tools for the present moment</Eyebrow>
            <Display size="l">Small tools. Real choices.</Display>
            <ul className="ad-toollist" role="tablist" aria-label="Tools">
              {copy.tools.map((tool, i) => (
                <li key={tool.id}>
                  <button type="button" role="tab" aria-selected={sel === i} className={`ad-toolitem ${sel === i ? 'is-active' : ''}`} onClick={() => setSel(i)}>
                    <span className="ad-toolname">{tool.name}</span>
                    <span className="ad-toolline">{tool.line}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="ad-devicepreview" role="tabpanel" aria-label={t.name}>
            <div className="ad-mini-phone">
              <div className="ad-mini-screen" key={t.id}>
                <Eyebrow>{t.name}</Eyebrow>
                <p className="ad-mini-q">{t.id === 'today' ? copy.members.todayQuestion : t.line}</p>
                {t.id === 'voice' ? <Wave bars={24} /> : t.id === 'convergence' ? <Constellation labels={copy.members.themes} height={120} /> : <div className="ad-mini-lines"><span /><span /><span /></div>}
              </div>
            </div>
            <Badge kind="demo" />
          </div>
        </section>
      ) : (
        <section className="ad-section">
          <Eyebrow>A day with ADEQUATE</Eyebrow>
          <Display size="l">From morning to evening, gently.</Display>
          <ol className="ad-day">
            {[
              ['Morning', 'Today', copy.members.todayQuestion],
              ['Midday', 'Pathways', 'Holding a choice? Lay out the paths without a verdict.'],
              ['Afternoon', 'Voice to Purpose', 'Say it out loud on a walk. Pick one thing to do.'],
              ['Evening', 'Adequacy Mirror', 'Notice one strength you used today.'],
              ['Weekly', 'Convergence', 'See what keeps coming up — facts and meanings kept apart.'],
            ].map(([time, tool, line], i) => (
              <li key={time} style={{ animationDelay: `${i * 120}ms` }}>
                <span className="ad-day-time ad-mono">{time}</span>
                <Card>
                  <h3 className="ad-h3">{tool}</h3>
                  <p>{line}</p>
                </Card>
              </li>
            ))}
          </ol>
          <Badge kind="concept" />
        </section>
      )}
    </PublicPage>
  );
}

/* ——————————————————— Listen ——————————————————— */

export function PublicListen({ v }: V) {
  const [playing, setPlaying] = useState(false);
  const [sel, setSel] = useState(0);
  return (
    <PublicPage active="public.listen">
      {v === 'v1' ? (
        <section className="ad-section ad-listen-focus">
          <Atmosphere />
          <Eyebrow>Listening room</Eyebrow>
          <Display size="xl">{copy.recordings[sel].title.replace('Placeholder recording · ', '')}</Display>
          <div className="ad-listen-stage">
            <Wave playing={playing} progress={playing ? 0.55 : 0.15} bars={64} />
          </div>
          <div className="ad-row ad-center">
            <button type="button" className="ad-playbtn ad-playbtn-lg" aria-label={playing ? 'Pause (simulated)' : 'Play (simulated)'} onClick={() => setPlaying(!playing)}>
              <Icon name={playing ? 'pause' : 'play'} />
            </button>
          </div>
          <Note>Simulated player — no audio, no fabricated speech. Real recordings require LG’s permission and rights clearance.</Note>
        </section>
      ) : (
        <section className="ad-section">
          <Eyebrow>Listening room</Eyebrow>
          <Display size="l">The wall of recordings</Display>
          <div className="ad-grid ad-grid-3 ad-wall">
            {copy.recordings.map((r, i) => (
              <button key={r.id} type="button" className={`ad-card ad-recording ${sel === i ? 'is-active' : ''}`} onClick={() => setSel(i)} aria-pressed={sel === i}>
                <span className="ad-card-index" aria-hidden>{String(i + 1).padStart(2, '0')}</span>
                <span className="ad-recording-art" aria-hidden><Wave bars={20} progress={sel === i ? 0.6 : 0} /></span>
                <span className="ad-h3">{r.title.replace('Placeholder recording · ', '')}</span>
                <span className="ad-mono">{r.length} · placeholder</span>
              </button>
            ))}
          </div>
          <Note>All titles are placeholders. No audio is included.</Note>
        </section>
      )}
    </PublicPage>
  );
}

/* ——————————————————— Library ——————————————————— */

export function PublicLibrary({ v }: V) {
  const [page, setPage] = useState(0);
  const b = copy.book;
  return (
    <PublicPage active="public.library">
      {v === 'v1' ? (
        <section className="ad-section">
          <Eyebrow>Library</Eyebrow>
          <Display size="l">{b.title}</Display>
          <Note>{b.subtitle}</Note>
          <div className="ad-book">
            <div className="ad-book-page ad-book-left">
              <p className="ad-mono">Chapter {page + 1}</p>
              <h3 className="ad-display ad-display-m">{b.chapters[page]}</h3>
            </div>
            <div className="ad-book-page ad-book-right" key={page}>
              <p className="ad-dropcap">{b.excerpt}</p>
            </div>
          </div>
          <div className="ad-row ad-center">
            <Btn kind="secondary" small onClick={() => setPage((p) => Math.max(0, p - 1))}>Previous page</Btn>
            <span className="ad-mono">{page + 1} / {b.chapters.length}</span>
            <Btn kind="secondary" small onClick={() => setPage((p) => Math.min(b.chapters.length - 1, p + 1))}>Turn page</Btn>
          </div>
          <Badge kind="placeholder" />
        </section>
      ) : (
        <section className="ad-section ad-shelf-layout">
          <div className="ad-shelf">
            {['First book', 'Essays I', 'Workbook', 'Audio edition'].map((t, i) => (
              <div key={t} className={`ad-spine ad-spine-${i}`}>
                <span>{t}</span>
              </div>
            ))}
          </div>
          <div>
            <Eyebrow>Library</Eyebrow>
            <Display size="l">{b.title}</Display>
            <ol className="ad-chapters">
              {b.chapters.map((c, i) => (
                <li key={c}><span className="ad-mono">{String(i + 1).padStart(2, '0')}</span> {c}</li>
              ))}
            </ol>
            <Btn>Read a sample chapter</Btn>
            <Badge kind="placeholder" />
          </div>
        </section>
      )}
    </PublicPage>
  );
}

/* ——————————————————— Together ——————————————————— */

export function PublicTogether({ v }: V) {
  return (
    <PublicPage active="public.together">
      {v === 'v1' ? (
        <section className="ad-section">
          <Eyebrow>Workshops & circles</Eyebrow>
          <Display size="l">Grow alongside others — if you want to.</Display>
          <div className="ad-calendar">
            {copy.members.circles.map((c, i) => (
              <Card key={c.name} index={String(i + 1).padStart(2, '0')}>
                <p className="ad-mono">{c.time}</p>
                <h3 className="ad-h3">{c.name}</h3>
                <p>{c.host} · {c.size} seats</p>
                <Btn small kind="secondary">Save a seat (demo)</Btn>
              </Card>
            ))}
            <Card label="Workshop">
              <p className="ad-mono">Date TBD</p>
              <h3 className="ad-h3">Placeholder workshop with LG</h3>
              <p>Speaking engagements and workshops — details to be confirmed.</p>
            </Card>
          </div>
          <Badge kind="synthetic" />
        </section>
      ) : (
        <section className="ad-section">
          <Eyebrow>How a circle works</Eyebrow>
          <Display size="l">Small. Hosted. Kind.</Display>
          <ol className="ad-steps">
            {[
              ['Choose a circle', 'Up to 12 people, organised around a theme and a time that suits you.'],
              ['Meet with a host', 'Trained hosts keep the space safe. Hosts, not gurus.'],
              ['Share only what you want', 'Listening is a full way to take part. Nothing is required.'],
            ].map(([t, d], i) => (
              <li key={t}>
                <span className="ad-step-n">{i + 1}</span>
                <h3 className="ad-h3">{t}</h3>
                <p>{d}</p>
              </li>
            ))}
          </ol>
          <Badge kind="concept" />
        </section>
      )}
    </PublicPage>
  );
}

/* ——————————————————— Membership ——————————————————— */

export function PublicMembership({ v }: V) {
  const tiers = copy.tiers;
  return (
    <PublicPage active="public.membership">
      <section className="ad-section">
        <Eyebrow>Membership</Eyebrow>
        <Display size="l">{v === 'v1' ? 'Honest, simple plans.' : 'The heart of it is free.'}</Display>
        <p className="ad-demo-banner" role="note">Demo only — prices are proposals, nothing can be purchased here.</p>
        {v === 'v1' ? (
          <div className="ad-grid ad-grid-3 ad-tiers">
            {tiers.map((t) => (
              <Card key={t.id} className={`ad-tiercard ${t.id === 'plus' ? 'is-featured' : ''}`} label={t.name}>
                <p className="ad-price"><span className="ad-display ad-display-l">{t.price}</span> <span className="ad-note">{t.cadence}</span></p>
                <p>{t.line}</p>
                <ul className="ad-checks">
                  {t.features.map((f) => (
                    <li key={f}><Icon name="check" /> {f}</li>
                  ))}
                </ul>
                <Btn kind={t.id === 'plus' ? 'primary' : 'secondary'}>{t.id === 'free' ? 'Begin free' : `Preview ${t.name}`}</Btn>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <Card className="ad-free-hero" label="Free · forever">
              <Display as="h3" size="m">Everything you need to remember your worth.</Display>
              <ul className="ad-checks ad-checks-inline">
                {tiers[0].features.map((f) => (
                  <li key={f}><Icon name="check" /> {f}</li>
                ))}
              </ul>
              <Btn>Begin free</Btn>
            </Card>
            <p className="ad-ladder-intro">When you want to go deeper:</p>
            <ol className="ad-ladder">
              {tiers.slice(1).map((t, i) => (
                <li key={t.id} style={{ marginInlineStart: `${i * 8}%` }}>
                  <span className="ad-h3">{t.name}</span>
                  <span>{t.line}</span>
                  <span className="ad-mono">{t.price} {t.cadence}</span>
                </li>
              ))}
            </ol>
          </>
        )}
        <Note>{copy.hardship}</Note>
      </section>
    </PublicPage>
  );
}

/* ——————————————————— FAQ ——————————————————— */

export function PublicFaq({ v }: V) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <PublicPage>
      <section className="ad-section">
        <Eyebrow>Questions</Eyebrow>
        <Display size="l">Honest answers.</Display>
        {v === 'v1' ? (
          <div className="ad-accordion">
            {copy.faqs.map((f, i) => (
              <div key={f.q} className={`ad-acc-item ${open === i ? 'is-open' : ''}`}>
                <h3>
                  <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)} className="ad-acc-btn">
                    <span>{f.q}</span>
                    <Icon name="plus" />
                  </button>
                </h3>
                <div className="ad-acc-panel" hidden={open !== i}>
                  <p>{f.a}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="ad-interview">
            {copy.faqs.map((f) => (
              <div key={f.q} className="ad-interview-item">
                <p className="ad-interview-q">{f.q}</p>
                <p className="ad-interview-a">{f.a}</p>
              </div>
            ))}
          </div>
        )}
        <Badge kind="concept" />
      </section>
    </PublicPage>
  );
}

/* ——————————————————— About ——————————————————— */

export function PublicAbout({ v }: V) {
  const [sent, setSent] = useState(false);
  return (
    <PublicPage>
      <section className="ad-section ad-about">
        <div>
          <Eyebrow>About & contact</Eyebrow>
          <Display size="l">{v === 'v1' ? 'Get in touch.' : 'Write a letter.'}</Display>
          <p>ADEQUATE is a founder-led personal-development brand created by LG. Legal status, biography and contact details are placeholders pending confirmation.</p>
          <Badge kind="placeholder" />
        </div>
        {sent ? (
          <Card><Stamp>Not sent</Stamp><p>This is a mockup — nothing was sent anywhere.</p><Btn small kind="secondary" onClick={() => setSent(false)}>Back</Btn></Card>
        ) : (
          <form className={`ad-form ${v === 'v2' ? 'ad-form-letter' : ''}`} onSubmit={(e) => (e.preventDefault(), setSent(true))}>
            {v === 'v2' ? <p className="ad-letter-salutation">Dear ADEQUATE,</p> : null}
            {v === 'v1' ? (
              <label>Your name<input type="text" placeholder="Name" /></label>
            ) : null}
            <label>{v === 'v1' ? 'Message' : <span className="ad-visually-hidden">Your letter</span>}<textarea rows={v === 'v1' ? 4 : 7} placeholder={v === 'v1' ? 'How can we help?' : 'Write as much or as little as you like…'} /></label>
            {v === 'v2' ? <label className="ad-letter-sign">Signed,<input type="text" placeholder="Your name" /></label> : null}
            <button type="submit" className="ad-btn ad-btn-primary"><span>{v === 'v1' ? 'Send (demo)' : 'Seal the letter (demo)'}</span></button>
          </form>
        )}
      </section>
    </PublicPage>
  );
}

export function PublicPrivacy() {
  return (
    <PublicPage>
      <section className="ad-section ad-narrow">
        <Eyebrow>Privacy & accessibility</Eyebrow>
        <Display size="l">Our plain promises</Display>
        <ol className="ad-promises">
          {[
            'Your reflections are yours. We will never sell them.',
            'You can export or delete your data at any time.',
            'Nothing scores or ranks you as a person.',
            'Any AI use will be clearly labelled and optional — it will never pretend to be LG.',
            'We design for screen readers, keyboard use, larger text and reduced motion.',
          ].map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ol>
        <Card label="Placeholder">
          <p>The full privacy policy, terms and accessibility statement will be written with legal review. This page is a design placeholder.</p>
        </Card>
        <Badge kind="concept" />
      </section>
    </PublicPage>
  );
}
