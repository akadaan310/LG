'use client';

import { useEffect, useRef, useState } from 'react';
import { copy } from '@adequate/mock-content';
import {
  Badge, Btn, Card, Constellation, ConstellationLabels, Display, Eyebrow, Hand, Icon, Lead, Mark, Note,
  Progress, Rings, Stamp, Tag, Toggle, Wave, deviceClass, useScreen,
} from './kit';
import { AppShell } from './shells';

type V = { v: 'v1' | 'v2' };
const m = copy.members;

/* ——————————————————— Today ——————————————————— */

export function MemberToday({ v }: V) {
  const { concept, navigate, width } = useScreen();
  const [answer, setAnswer] = useState('');
  const [saved, setSaved] = useState(false);
  if (v === 'v1') {
    return (
      <AppShell active="member.today" title="Today">
        <section className="ad-today-focus">
          {concept.id === 'resonance-atlas' ? <p className="ad-mono ad-coord">YOU ARE HERE · TODAY · PRESENT MOMENT</p> : <Eyebrow>Good morning, {m.name}</Eyebrow>}
          <Display size={width < 600 ? 'l' : 'xl'}>{m.todayQuestion}</Display>
          {saved ? (
            <div className="ad-saved">
              {concept.id === 'living-manifesto' ? <Stamp>Noted</Stamp> : <Icon name="check" />}
              <p>Kept in your journal (demo — stored nowhere).</p>
              <Btn kind="ghost" small onClick={() => (setSaved(false), setAnswer(''))}>Write another</Btn>
            </div>
          ) : (
            <form className="ad-form" onSubmit={(e) => (e.preventDefault(), setSaved(true))}>
              <label>
                <span className="ad-visually-hidden">Your answer</span>
                <textarea rows={3} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Take your time. There is no wrong answer." />
              </label>
              <div className="ad-row">
                <button type="submit" className="ad-btn ad-btn-primary"><span>Keep this</span></button>
                <Btn kind="ghost" small>Skip today — that’s fine</Btn>
              </div>
            </form>
          )}
          <Badge kind="concept" />
        </section>
      </AppShell>
    );
  }
  return (
    <AppShell active="member.today" title="Today">
      <section className="ad-dash">
        <Card className="ad-dash-q" label="Today’s question">
          <p className="ad-display ad-display-m">{m.todayQuestion}</p>
          <Btn small onClick={() => navigate?.('member.mirror')}>Reflect</Btn>
        </Card>
        <Card className="ad-dash-listen" label="Listen · 6 min">
          <Wave bars={32} />
          <p>{copy.recordings[0].title}</p>
        </Card>
        <Card className="ad-dash-path" label="Your path">
          {concept.id === 'resonance-atlas' ? <Rings count={4} /> : null}
          <p>Exploring: <strong>{m.pathOptions[0].title}</strong></p>
          <Btn small kind="secondary" onClick={() => navigate?.('member.pathways')}>Open Pathways</Btn>
        </Card>
        <Card className="ad-dash-circle" label="Circle · Tue 7:30am">
          <p>{m.circles[0].name}</p>
          <Note>{m.circles[0].size} seats · hosted</Note>
          <span className="ad-tier ad-tier-circle">Circle</span>
        </Card>
        <Card className="ad-dash-week" label="This week">
          <ul className="ad-week" aria-label="Days you reflected (no streaks, no scores)">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <li key={i} className={[0, 2, 3].includes(i) ? 'is-on' : ''}>{d}</li>
            ))}
          </ul>
          <Note>Just a record, never a streak. Missing days mean nothing about you.</Note>
        </Card>
      </section>
      <Badge kind="synthetic" />
    </AppShell>
  );
}

/* ——————————————————— Mirror ——————————————————— */

export function MemberMirror({ v }: V) {
  const { concept } = useScreen();
  const [step, setStep] = useState(0);
  const panes: [string, string[], string][] = [
    ['Strengths', m.strengths, 'What is already true and good?'],
    ['Assumptions', m.assumptions, 'What might you be assuming?'],
    ['Choices', m.choices, 'What could you choose, gently?'],
  ];
  return (
    <AppShell active="member.mirror" title="Adequacy Mirror" root={false}>
      {v === 'v1' ? (
        <section className="ad-mirror-panes">
          {panes.map(([title, items, q], i) => (
            <Card key={title} index={String(i + 1).padStart(2, '0')} className="ad-pane">
              <h3 className="ad-h3">{title}</h3>
              <Note>{q}</Note>
              <ul className="ad-pills">
                {items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
              <Btn kind="ghost" small><Icon name="plus" /> Add</Btn>
            </Card>
          ))}
        </section>
      ) : (
        <section className="ad-unfold">
          <Progress value={(step + 1) / panes.length} label={`Card ${step + 1} of ${panes.length}`} />
          <div className="ad-unfold-stage">
            <Card key={step} className="ad-unfold-card" index={String(step + 1).padStart(2, '0')}>
              <Eyebrow>{panes[step][0]}</Eyebrow>
              <p className="ad-display ad-display-m">{panes[step][2]}</p>
              <ul className="ad-pills">
                {panes[step][1].map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
              {concept.id === 'golden-human' ? <Hand>you can come back to this any time</Hand> : null}
            </Card>
          </div>
          <div className="ad-row ad-center">
            <Btn kind="secondary" small onClick={() => setStep((s) => Math.max(0, s - 1))}>Back</Btn>
            <Btn small onClick={() => setStep((s) => Math.min(panes.length - 1, s + 1))}>{step === panes.length - 1 ? 'Done' : 'Turn over'}</Btn>
          </div>
        </section>
      )}
      <Badge kind="synthetic" />
    </AppShell>
  );
}

/* ——————————————————— Pathways ——————————————————— */

export function MemberPathways({ v }: V) {
  const { concept, width } = useScreen();
  const [chosen, setChosen] = useState<number | null>(null);
  const opts = m.pathOptions;
  return (
    <AppShell active="member.pathways" title="Pathways" root={false}>
      <section className="ad-section-tight">
        <Eyebrow>A choice you’re holding</Eyebrow>
        <Display as="h2" size={width < 600 ? 'm' : 'l'}>Should I stay in my role or try something new?</Display>
        <Note>Pathways never tells you what to do. It helps you see.</Note>
      </section>
      {v === 'v1' ? (
        <section className="ad-branches">
          <svg viewBox="0 0 300 120" className="ad-branch-svg" aria-hidden preserveAspectRatio="none">
            {[50, 150, 250].map((x, i) => (
              <path key={x} className={`ad-draw ${chosen === i ? 'is-chosen' : ''}`} d={`M150 120 C 150 70, ${x} 70, ${x} 8`} fill="none" strokeWidth={chosen === i ? 3 : 1.5} style={{ animationDelay: `${i * 160}ms` }} />
            ))}
            <circle cx="150" cy="116" r="5" fill="var(--c-accent)" />
          </svg>
          <div className="ad-branch-cards">
            {opts.map((o, i) => (
              <button key={o.title} type="button" className={`ad-card ad-branch ${chosen === i ? 'is-chosen' : ''}`} aria-pressed={chosen === i} onClick={() => setChosen(i)}>
                <span className="ad-h3">{o.title}</span>
                {o.notes.map((n) => (
                  <span key={n} className="ad-note">{n}</span>
                ))}
                {chosen === i ? (concept.id === 'living-manifesto' ? <Stamp>Chosen</Stamp> : <span className="ad-chosen"><Icon name="check" /> Exploring this</span>) : null}
              </button>
            ))}
          </div>
          <p className="ad-center ad-note">You are here — every path starts from the present.</p>
        </section>
      ) : (
        <section className="ad-compare-cols">
          {opts.map((o, i) => (
            <Card key={o.title} index={String(i + 1).padStart(2, '0')} className={chosen === i ? 'is-chosen' : ''}>
              <h3 className="ad-h3">{o.title}</h3>
              <dl className="ad-procon">
                <dt>What it gives</dt>
                <dd>{o.notes[0]}</dd>
                <dt>What it asks</dt>
                <dd>{o.notes[1]}</dd>
              </dl>
              <Btn small kind={chosen === i ? 'primary' : 'secondary'} onClick={() => setChosen(i)}>{chosen === i ? 'Exploring' : 'Explore this'}</Btn>
            </Card>
          ))}
        </section>
      )}
      <Badge kind="synthetic" />
    </AppShell>
  );
}

/* ——————————————————— Voice ——————————————————— */

export function MemberVoice({ v }: V) {
  const [rec, setRec] = useState(false);
  const [secs, setSecs] = useState(0);
  const t = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (rec) t.current = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => {
      if (t.current) clearInterval(t.current);
    };
  }, [rec]);
  return (
    <AppShell active="member.voice" title="Voice to Purpose" root={false}>
      <p className="ad-demo-banner" role="note">Demo only — nothing is recorded, transcribed, or sent to AI.</p>
      {v === 'v1' ? (
        <section className="ad-voice">
          <p className="ad-display ad-display-m ad-center">What’s on your mind?</p>
          <div className="ad-voice-stage">
            <Wave playing={rec} progress={0} bars={40} label="Simulated voice rings — nothing is recorded" />
          </div>
          <button type="button" className={`ad-recbtn ${rec ? 'is-rec' : ''}`} aria-pressed={rec} onClick={() => setRec(!rec)}>
            <Icon name="mic" />
            <span>{rec ? `Listening (simulated) · 0:${String(secs).padStart(2, '0')}` : 'Tap to speak (simulated)'}</span>
          </button>
          {!rec && secs > 0 ? (
            <Card label="Choose one thing">
              <p>From what you said, what is one small thing you want to do?</p>
              <div className="ad-row"><Tag active>Call my sister</Tag><Tag>Rest tonight</Tag><Tag>Write it down</Tag></div>
              <Note>Suggestions here are pre-written demo options, not AI.</Note>
            </Card>
          ) : null}
        </section>
      ) : (
        <section className="ad-voice-prompt">
          <Card label="Prompt">
            <p className="ad-display ad-display-m">If today went well, what would you have done on purpose?</p>
          </Card>
          <label className="ad-form">
            <span className="ad-visually-hidden">Your reflection</span>
            <textarea rows={6} placeholder="Type here, or tap the microphone to speak (demo)…" />
          </label>
          <div className="ad-row">
            <button type="button" className="ad-iconbtn ad-iconbtn-lg" aria-label="Speak (simulated)" onClick={() => setRec(!rec)}><Icon name="mic" /></button>
            {rec ? <Wave playing bars={24} /> : null}
            <Btn>Turn into one action</Btn>
          </div>
          <span className="ad-tier ad-tier-plus">Plus</span>
        </section>
      )}
    </AppShell>
  );
}

/* ——————————————————— Living Book ——————————————————— */

export function MemberBook({ v }: V) {
  const { concept, width } = useScreen();
  const [done, setDone] = useState(false);
  return (
    <AppShell active="member.book" title="Living Book" root={false}>
      <article className={`ad-reader ${v === 'v1' && width >= 700 ? 'has-margin' : ''}`}>
        <div className="ad-reader-text">
          <p className="ad-mono">Chapter 2 · {copy.book.chapters[1]}</p>
          <h2 className="ad-display ad-display-l">{copy.book.chapters[1]}</h2>
          <Badge kind="placeholder" />
          <p className="ad-dropcap">{copy.book.excerpt}</p>
          <p>
            <mark className="ad-highlight">Concept sentence: you were never asked to earn the ground beneath your feet.</mark> The rest of the paragraph continues here as placeholder text for reading rhythm and measure.
          </p>
          {v === 'v2' ? (
            <Card className="ad-exercise" label="Pause · 2 minutes">
              <p className="ad-h3">Name one thing you have been trying to earn that might already be yours.</p>
              {done ? <p><Icon name="check" /> Kept in your journal (demo)</p> : <Btn small onClick={() => setDone(true)}>I’ve thought about it</Btn>}
            </Card>
          ) : null}
          <p>Placeholder text continues. The Living Book will hold LG’s approved chapters, with optional audio narration if recording rights and consent are in place.</p>
        </div>
        {v === 'v1' ? (
          <aside className="ad-reader-margin" aria-label="Your notes">
            {concept.id === 'golden-human' ? <Hand>“this one stopped me” — Jordan</Hand> : <Card label="Your note"><p>“This one stopped me.”</p></Card>}
            <Note>Margin notes are private to you.</Note>
          </aside>
        ) : null}
      </article>
    </AppShell>
  );
}

/* ——————————————————— Convergence ——————————————————— */

export function MemberConvergence({ v }: V) {
  const { width } = useScreen();
  return (
    <AppShell active="member.convergence" title="Convergence" root={false}>
      <section className="ad-section-tight">
        <Eyebrow>Last 7 days · synthetic</Eyebrow>
        <Display as="h2" size={width < 600 ? 'm' : 'l'}>What keeps coming up?</Display>
        <Note>What happened stays separate from what it might mean. You decide the meaning.</Note>
      </section>
      {v === 'v1' ? (
        <section className="ad-lanes">
          <div className="ad-lane-head"><span className="ad-mono">What happened</span><span className="ad-mono">What I think it means</span></div>
          {m.reflections.map((r, i) => (
            <div key={r.date} className="ad-lane-row" style={{ animationDelay: `${i * 120}ms` }}>
              <span className="ad-lane-date ad-mono">{r.date}</span>
              <Card className="ad-lane-fact"><p>{r.fact}</p></Card>
              <Card className="ad-lane-meaning"><p><em>{r.meaning}</em></p><span className="ad-note">Interpretation · yours</span></Card>
            </div>
          ))}
        </section>
      ) : (
        <section className="ad-constellation-wrap">
          <Constellation labels={m.themes} height={width < 600 ? 200 : 300} />
          <ConstellationLabels labels={m.themes} />
          <Note>Lines connect themes you named more than once. It is a picture, not a diagnosis.</Note>
        </section>
      )}
      <span className="ad-tier ad-tier-plus">Plus</span>
      <Badge kind="synthetic" />
    </AppShell>
  );
}

/* ——————————————————— Together ——————————————————— */

export function MemberTogether({ v }: V) {
  const [joined, setJoined] = useState<string | null>(null);
  return (
    <AppShell active="member.together" title="Adequate Together" root={false}>
      <p className="ad-demo-banner" role="note">Demo only — no real people, no real messages.</p>
      {v === 'v1' ? (
        <section className="ad-circles">
          {m.circles.map((c) => (
            <Card key={c.name} label={c.time}>
              <h3 className="ad-h3">{c.name}</h3>
              <p>{c.host} · {c.size}</p>
              <Btn small kind={joined === c.name ? 'primary' : 'secondary'} onClick={() => setJoined(c.name)}>{joined === c.name ? 'Seat saved (demo)' : 'Join (demo)'}</Btn>
            </Card>
          ))}
          <Note>Circles are optional, moderated, and small. You can leave any time.</Note>
        </section>
      ) : (
        <section className="ad-room">
          <Card label="Morning Circle · hosted">
            <p className="ad-display ad-display-m">Today’s prompt: something you did without needing to earn it.</p>
          </Card>
          <ul className="ad-room-notes">
            {m.circleNotes.map((n, i) => (
              <li key={i} className="ad-card">
                <span className="ad-note">{n.who} · synthetic</span>
                <p>{n.text}</p>
              </li>
            ))}
          </ul>
          <div className="ad-row">
            <input className="ad-input" placeholder="Share if you want to (demo)" aria-label="Share a note (demo)" />
            <Btn small>Share</Btn>
          </div>
          <Note>Host can hide anything unkind. Listening is a full way to take part.</Note>
        </section>
      )}
      <span className="ad-tier ad-tier-circle">Circle</span>
    </AppShell>
  );
}

/* ——————————————————— Profile, preferences, onboarding ——————————————————— */

export function MemberProfile() {
  return (
    <AppShell active="member.profile" title="Your journal">
      <section className="ad-section-tight">
        <div className="ad-profile-head">
          <span className="ad-avatar" aria-hidden>J</span>
          <div>
            <p className="ad-h3">{m.name}</p>
            <Note>{m.note}</Note>
            <span className="ad-tier ad-tier-free">Free plan</span>
          </div>
        </div>
      </section>
      <ol className="ad-history">
        {m.reflections.map((r) => (
          <li key={r.date} className="ad-card">
            <span className="ad-mono">{r.date}</span>
            <p>{r.fact}</p>
          </li>
        ))}
      </ol>
      <Card label="Your data">
        <p>Export or delete everything, any time.</p>
        <div className="ad-row"><Btn small kind="secondary">Export (demo)</Btn><Btn small kind="ghost">Delete my data (demo)</Btn></div>
      </Card>
    </AppShell>
  );
}

export function MemberPreferences() {
  return (
    <AppShell active="member.preferences" title="Preferences" root={false}>
      <section className="ad-prefs">
        <Card label="Reminders">
          <Toggle label="A gentle morning question" defaultOn />
          <Toggle label="New recordings from LG" />
          <Toggle label="Circle reminders" />
          <Note>No streaks, no guilt messages, ever.</Note>
        </Card>
        <Card label="Reading & motion">
          <Toggle label="Larger text" />
          <Toggle label="Reduce motion" />
          <Toggle label="High contrast" />
        </Card>
        <Card label="Privacy">
          <Toggle label="Keep reflections on this device only" defaultOn />
          <Note>Demo switches — they change nothing.</Note>
        </Card>
      </section>
    </AppShell>
  );
}

export function MemberOnboarding({ v }: V) {
  const { concept, width, navigate } = useScreen();
  const [step, setStep] = useState(0);
  const steps = [
    ['Welcome.', 'You don’t have to earn your place here.'],
    ['How it works', 'Small reflections, recordings, and tools for the present moment. Free at its heart.'],
    ['One promise', 'No scores, no streaks, no pressure. You decide what growth means.'],
  ];
  const device = deviceClass(width);
  return (
    <div className={`ad ad-onboarding ad-onboarding-${device}`}>
      <div className="ad-onb-inner">
        <Mark size={44} />
        {v === 'v1' ? (
          <>
            <div className="ad-onb-dots" aria-label={`Step ${step + 1} of 3`}>
              {steps.map((_, i) => <span key={i} className={i === step ? 'is-on' : ''} />)}
            </div>
            <div key={step} className="ad-onb-step">
              <Display size={device === 'phone' ? 'l' : 'xl'}>{steps[step][0]}</Display>
              <Lead>{steps[step][1]}</Lead>
            </div>
            <div className="ad-row">
              {step > 0 ? <Btn kind="ghost" onClick={() => setStep(step - 1)}>Back</Btn> : null}
              <Btn onClick={() => (step < 2 ? setStep(step + 1) : navigate?.('member.today'))}>{step < 2 ? 'Continue' : 'Begin'}</Btn>
            </div>
          </>
        ) : (
          <div className="ad-onb-convo">
            <p className="ad-onb-bubble">Welcome. Before anything else — you are already enough here.</p>
            {step >= 1 ? <p className="ad-onb-bubble">What brings you to ADEQUATE today?</p> : null}
            {step >= 1 ? (
              <div className="ad-row ad-wrap">
                {['A fresh start', 'A hard decision', 'Curiosity', 'LG’s words'].map((o) => (
                  <button key={o} type="button" className="ad-tag ad-tag-btn" onClick={() => setStep(2)}>{o}</button>
                ))}
              </div>
            ) : (
              <Btn onClick={() => setStep(1)}>Hello</Btn>
            )}
            {step >= 2 ? (
              <>
                <p className="ad-onb-bubble">Thank you. Let’s begin with one gentle question.</p>
                <Btn onClick={() => navigate?.('member.today')}>Go to Today</Btn>
              </>
            ) : null}
            {concept.id === 'golden-human' ? <Hand>no account needed to look around</Hand> : null}
          </div>
        )}
        <Badge kind="concept" />
      </div>
    </div>
  );
}
