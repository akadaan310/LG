import { useEffect, useState } from 'react';
import { Pressable, Switch, Text, TextInput, View } from 'react-native';
import { copy } from '@adequate/mock-content';
import { useTheme } from '../theme';
import { Badge, Body, Button, Card, Display, Eyebrow, Label, Pill, Reveal, Rings, Row, ScreenScroll, Wave } from '../ui';

/* Expo React Native design mock screens. Synthetic data, concept copy, no persistence, no network. */

const m = copy.members;
export type Nav = (screen: ScreenId) => void;
export type ScreenId =
  | 'today' | 'mirror' | 'pathways' | 'voice' | 'book' | 'convergence' | 'together' | 'profile' | 'preferences' | 'onboarding';

function Input({ placeholder, multiline }: { placeholder: string; multiline?: boolean }) {
  const t = useTheme();
  return (
    <TextInput
      placeholder={placeholder}
      placeholderTextColor={t.c.inkMuted}
      multiline={multiline}
      accessibilityLabel={placeholder}
      style={{ minHeight: multiline ? 96 : 48, borderWidth: t.border, borderColor: t.concept.id === 'living-manifesto' ? t.c.ink : t.c.line, borderRadius: t.radius.sm, padding: 12, color: t.c.ink, backgroundColor: t.c.surface, fontFamily: t.font.body, fontSize: 16, textAlignVertical: 'top' }}
    />
  );
}

export function Today({ variant, nav }: { variant: 'v1' | 'v2'; nav: Nav }) {
  const t = useTheme();
  const [kept, setKept] = useState(false);
  if (variant === 'v1') {
    return (
      <ScreenScroll>
        <Reveal>{t.concept.id === 'resonance-atlas' ? <Eyebrow>You are here · today</Eyebrow> : <Eyebrow>Good morning, {m.name}</Eyebrow>}</Reveal>
        <Reveal delay={120}><Display size={30}>{m.todayQuestion}</Display></Reveal>
        {kept ? (
          <Card><Body>Kept in your journal (demo — stored nowhere).</Body><Button kind="ghost" title="Write another" onPress={() => setKept(false)} /></Card>
        ) : (
          <>
            <Input placeholder="Take your time. There is no wrong answer." multiline />
            <Row><Button title="Keep this" onPress={() => setKept(true)} /><Button kind="ghost" title="Skip today — that’s fine" /></Row>
          </>
        )}
        <Badge kind="concept" />
      </ScreenScroll>
    );
  }
  return (
    <ScreenScroll>
      <Card label="Today’s question" highlight>
        <Display size={22} style={t.concept.id === 'living-manifesto' ? { color: t.c.onAccent } : undefined}>{m.todayQuestion}</Display>
        <Button title="Reflect" onPress={() => nav('mirror')} />
      </Card>
      <Card label="Listen · 6 min"><Wave /><Body muted>{copy.recordings[0].title}</Body></Card>
      <Card label="Your path"><Body>Exploring: {m.pathOptions[0].title}</Body><Button kind="secondary" title="Open Pathways" onPress={() => nav('pathways')} /></Card>
      <Card label="This week">
        <Row>{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <View key={i} style={{ width: 34, height: 34, borderRadius: t.radius.pill, borderWidth: 1, borderColor: t.c.line, alignItems: 'center', justifyContent: 'center', backgroundColor: [0, 2, 3].includes(i) ? t.c.accent : 'transparent' }}>
            <Text style={{ color: [0, 2, 3].includes(i) ? t.c.onAccent : t.c.ink, fontSize: 13 }}>{d}</Text>
          </View>
        ))}</Row>
        <Body muted>Just a record, never a streak.</Body>
      </Card>
      <Badge kind="synthetic" />
    </ScreenScroll>
  );
}

export function Mirror({ variant }: { variant: 'v1' | 'v2' }) {
  const [step, setStep] = useState(0);
  const panes: [string, string[], string][] = [
    ['Strengths', m.strengths, 'What is already true and good?'],
    ['Assumptions', m.assumptions, 'What might you be assuming?'],
    ['Choices', m.choices, 'What could you choose, gently?'],
  ];
  if (variant === 'v1') {
    return (
      <ScreenScroll>
        {panes.map(([title, items, q], i) => (
          <Reveal key={title} delay={i * 100}>
            <Card index={`0${i + 1}`}>
              <Display size={20}>{title}</Display>
              <Body muted>{q}</Body>
              <Row>{items.map((x) => <Pill key={x}>{x}</Pill>)}</Row>
            </Card>
          </Reveal>
        ))}
        <Badge kind="synthetic" />
      </ScreenScroll>
    );
  }
  const [title, items, q] = panes[step];
  return (
    <ScreenScroll>
      <Label>Card {step + 1} of 3</Label>
      <Reveal key={step}>
        <Card index={`0${step + 1}`} style={{ minHeight: 260 }}>
          <Eyebrow>{title}</Eyebrow>
          <Display size={24}>{q}</Display>
          <Row>{items.map((x) => <Pill key={x}>{x}</Pill>)}</Row>
        </Card>
      </Reveal>
      <Row><Button kind="secondary" title="Back" onPress={() => setStep(Math.max(0, step - 1))} /><Button title={step === 2 ? 'Done' : 'Turn over'} onPress={() => setStep(Math.min(2, step + 1))} /></Row>
    </ScreenScroll>
  );
}

export function Pathways({ variant }: { variant: 'v1' | 'v2' }) {
  const t = useTheme();
  const [chosen, setChosen] = useState<number | null>(null);
  return (
    <ScreenScroll>
      <Eyebrow>A choice you’re holding</Eyebrow>
      <Display size={24}>Should I stay in my role or try something new?</Display>
      <Body muted>Pathways never tells you what to do. It helps you see.</Body>
      {m.pathOptions.map((o, i) => (
        <Pressable key={o.title} accessibilityRole="button" accessibilityState={{ selected: chosen === i }} onPress={() => setChosen(i)}>
          <Card index={variant === 'v2' ? `0${i + 1}` : undefined} highlight={chosen === i} style={variant === 'v1' ? { marginLeft: i * 18 } : undefined}>
            <Display size={19} style={chosen === i && t.concept.id === 'living-manifesto' ? { color: t.c.onAccent } : undefined}>{o.title}</Display>
            {variant === 'v2' ? <><Label>What it gives</Label><Body>{o.notes[0]}</Body><Label>What it asks</Label><Body>{o.notes[1]}</Body></> : o.notes.map((n) => <Body key={n} muted>{n}</Body>)}
            {chosen === i ? <Text style={{ fontWeight: '800', color: t.concept.id === 'living-manifesto' ? t.c.onAccent : t.c.accentText }}>{t.concept.id === 'living-manifesto' ? 'CHOSEN' : '✓ Exploring this'}</Text> : null}
          </Card>
        </Pressable>
      ))}
      <Badge kind="synthetic" />
    </ScreenScroll>
  );
}

export function Voice({ variant }: { variant: 'v1' | 'v2' }) {
  const t = useTheme();
  const [rec, setRec] = useState(false);
  return (
    <ScreenScroll>
      <Badge kind="demo" />
      <Body muted>Nothing is recorded, transcribed, or sent to AI.</Body>
      {variant === 'v1' ? (
        <View style={{ alignItems: 'center', gap: 20, paddingVertical: 20 }}>
          <Display size={26} style={{ textAlign: 'center' }}>What’s on your mind?</Display>
          <Wave active={rec} bars={32} />
          <Pressable accessibilityRole="button" accessibilityState={{ checked: rec }} onPress={() => setRec(!rec)} style={{ minHeight: 64, paddingHorizontal: 28, borderRadius: t.radius.pill, backgroundColor: rec ? t.c.ink : t.c.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: rec ? t.c.bg : t.c.onAccent, fontWeight: '700', fontSize: 16 }}>{rec ? 'Listening (simulated)…' : 'Tap to speak (simulated)'}</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Card label="Prompt"><Display size={22}>If today went well, what would you have done on purpose?</Display></Card>
          <Input placeholder="Type here, or tap the microphone (demo)…" multiline />
          <Row><Button kind="secondary" title={rec ? 'Stop (demo)' : 'Speak (demo)'} onPress={() => setRec(!rec)} /><Button title="Turn into one action" /></Row>
          {rec ? <Wave active /> : null}
        </>
      )}
    </ScreenScroll>
  );
}

export function Book({ variant }: { variant: 'v1' | 'v2' }) {
  const t = useTheme();
  const [done, setDone] = useState(false);
  return (
    <ScreenScroll>
      <Label>Chapter 2 · {copy.book.chapters[1]}</Label>
      <Display size={28}>{copy.book.chapters[1]}</Display>
      <Badge kind="placeholder" />
      <Body style={{ fontSize: 18, lineHeight: 29 }}>{copy.book.excerpt}</Body>
      {variant === 'v1' ? (
        <View style={{ borderLeftWidth: 3, borderLeftColor: t.c.accent2, paddingLeft: 12 }}>
          <Text style={{ fontFamily: t.font.accent, fontSize: t.concept.id === 'golden-human' ? 22 : 14, color: t.c.accent2 }}>“this one stopped me” — Jordan</Text>
        </View>
      ) : (
        <Card label="Pause · 2 minutes" highlight={false}>
          <Body>Name one thing you have been trying to earn that might already be yours.</Body>
          {done ? <Body muted>✓ Kept in your journal (demo)</Body> : <Button title="I’ve thought about it" onPress={() => setDone(true)} />}
        </Card>
      )}
    </ScreenScroll>
  );
}

export function Convergence({ variant }: { variant: 'v1' | 'v2' }) {
  const t = useTheme();
  return (
    <ScreenScroll>
      <Eyebrow>Last 7 days · synthetic</Eyebrow>
      <Display size={26}>What keeps coming up?</Display>
      <Body muted>What happened stays separate from what it might mean.</Body>
      {variant === 'v1'
        ? m.reflections.map((r, i) => (
            <Reveal key={r.date} delay={i * 90}>
              <Row wrap={false} gap={10}>
                <Text style={{ width: 36, fontFamily: t.font.accent, color: t.c.accentText }}>{r.date}</Text>
                <View style={{ flex: 1, gap: 6 }}>
                  <Card><Body>{r.fact}</Body></Card>
                  <Card style={{ backgroundColor: t.c.surfaceAlt, borderStyle: 'dashed' }}><Body style={{ fontStyle: 'italic' }}>{r.meaning}</Body><Label>Interpretation · yours</Label></Card>
                </View>
              </Row>
            </Reveal>
          ))
        : (
          <Card>
            <Rings size={200} count={m.themes.length} />
            <Row>{m.themes.map((x, i) => <Pill key={x}>{`★ 0${i + 1} ${x}`}</Pill>)}</Row>
            <Body muted>A picture, not a diagnosis.</Body>
          </Card>
        )}
    </ScreenScroll>
  );
}

export function Together({ variant }: { variant: 'v1' | 'v2' }) {
  const [joined, setJoined] = useState<string | null>(null);
  return (
    <ScreenScroll>
      <Badge kind="demo" />
      {variant === 'v1'
        ? m.circles.map((c) => (
            <Card key={c.name} label={c.time}>
              <Display size={20}>{c.name}</Display>
              <Body muted>{c.host} · {c.size}</Body>
              <Button kind={joined === c.name ? 'primary' : 'secondary'} title={joined === c.name ? 'Seat saved (demo)' : 'Join (demo)'} onPress={() => setJoined(c.name)} />
            </Card>
          ))
        : (
          <>
            <Card label="Morning Circle · hosted"><Display size={22}>Today’s prompt: something you did without needing to earn it.</Display></Card>
            {m.circleNotes.map((n, i) => <Card key={i}><Label>{n.who} · synthetic</Label><Body>{n.text}</Body></Card>)}
            <Input placeholder="Share if you want to (demo)" />
          </>
        )}
    </ScreenScroll>
  );
}

export function Profile() {
  const t = useTheme();
  return (
    <ScreenScroll>
      <Row gap={14}>
        <View style={{ width: 60, height: 60, borderRadius: t.radius.pill, backgroundColor: t.c.accent, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: t.c.onAccent, fontSize: 26, fontFamily: t.font.display }}>J</Text></View>
        <View><Display size={20}>{m.name}</Display><Body muted>{m.note}</Body></View>
      </Row>
      {m.reflections.map((r) => <Card key={r.date} label={r.date}><Body>{r.fact}</Body></Card>)}
      <Card label="Your data"><Body>Export or delete everything, any time.</Body><Row><Button kind="secondary" title="Export (demo)" /><Button kind="ghost" title="Delete (demo)" /></Row></Card>
    </ScreenScroll>
  );
}

function Pref({ label, initial = false }: { label: string; initial?: boolean }) {
  const t = useTheme();
  const [on, setOn] = useState(initial);
  return (
    <Row wrap={false}>
      <Body style={{ flex: 1 }}>{label}</Body>
      <Switch value={on} onValueChange={setOn} accessibilityLabel={label} trackColor={{ true: t.c.accent, false: t.c.surfaceAlt }} thumbColor={on ? t.c.onAccent : t.c.ink} />
    </Row>
  );
}

export function Preferences() {
  return (
    <ScreenScroll>
      <Card label="Reminders"><Pref label="A gentle morning question" initial /><Pref label="New recordings from LG" /><Pref label="Circle reminders" /><Body muted>No streaks, no guilt messages, ever.</Body></Card>
      <Card label="Reading & motion"><Pref label="Larger text" /><Pref label="Reduce motion" /><Pref label="High contrast" /></Card>
      <Badge kind="demo" />
    </ScreenScroll>
  );
}

export function Onboarding({ variant, nav }: { variant: 'v1' | 'v2'; nav: Nav }) {
  const t = useTheme();
  const [step, setStep] = useState(0);
  useEffect(() => setStep(0), [variant]);
  const steps = [
    ['Welcome.', 'You don’t have to earn your place here.'],
    ['How it works', 'Small reflections, recordings, and tools for the present moment. Free at its heart.'],
    ['One promise', 'No scores, no streaks, no pressure. You decide what growth means.'],
  ];
  const bg = t.concept.id === 'living-manifesto' ? t.c.accent : t.c.bg;
  return (
    <View style={{ flex: 1, backgroundColor: bg, padding: 28, justifyContent: 'center', gap: 20 }}>
      {variant === 'v1' ? (
        <>
          <Row>{steps.map((_, i) => <View key={i} style={{ width: 28, height: 4, borderRadius: 2, backgroundColor: i === step ? t.c.ink : t.c.line }} />)}</Row>
          <Reveal key={step}><Display size={40}>{steps[step][0]}</Display><Body style={{ marginTop: 10, fontSize: 18 }}>{steps[step][1]}</Body></Reveal>
          <Button title={step < 2 ? 'Continue' : 'Begin'} onPress={() => (step < 2 ? setStep(step + 1) : nav('today'))} />
        </>
      ) : (
        <>
          <Display size={28}>Welcome. Before anything else — you are already enough here.</Display>
          {step >= 1 ? <Display size={24}>What brings you to ADEQUATE today?</Display> : <Button title="Hello" onPress={() => setStep(1)} />}
          {step >= 1 ? <Row>{['A fresh start', 'A hard decision', 'Curiosity', 'LG’s words'].map((o) => <Pill key={o} onPress={() => nav('today')}>{o}</Pill>)}</Row> : null}
        </>
      )}
      <Badge kind="concept" />
    </View>
  );
}
