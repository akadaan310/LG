'use client';

import { createContext, useContext, useId, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { cssVars, type ColorMode, type ConceptId, type ConceptSystem } from '@adequate/design-tokens';
import { brand } from '@adequate/mock-content';

/* ——————————————————— Context ——————————————————— */

export interface ScreenCtx {
  concept: ConceptSystem;
  mode: ColorMode;
  /** 'web' for browser frames; 'ios' / 'android' for native-app frames */
  platform: 'ios' | 'android' | 'web';
  /** Nominal viewport width of the frame being rendered */
  width: number;
  reducedMotion: boolean;
  /** In-frame navigation between mock screens (optional) */
  navigate?: (screenId: string) => void;
}

const Ctx = createContext<ScreenCtx | null>(null);

export function useScreen(): ScreenCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useScreen outside ConceptFrame');
  return c;
}

export function useConceptId(): ConceptId {
  return useScreen().concept.id;
}

export function deviceClass(width: number): 'phone' | 'tablet' | 'desktop' {
  return width < 600 ? 'phone' : width < 1100 ? 'tablet' : 'desktop';
}

/** Applies a concept's tokens and establishes the container for responsive (container-query) layout. */
export function ConceptFrame({ ctx, children, className, style }: { ctx: ScreenCtx; children: ReactNode; className?: string; style?: CSSProperties }) {
  const vars = useMemo(() => cssVars(ctx.concept, ctx.mode), [ctx.concept, ctx.mode]);
  return (
    <Ctx.Provider value={ctx}>
      <div
        className={`ad-root ${className ?? ''}`}
        data-concept={ctx.concept.id}
        data-mode={ctx.mode}
        data-platform={ctx.platform}
        data-device={deviceClass(ctx.width)}
        data-motion={ctx.reducedMotion ? 'off' : 'on'}
        style={{ ...(vars as CSSProperties), ...style }}
      >
        {children}
      </div>
    </Ctx.Provider>
  );
}

/** Round SVG coordinates so server and client render identical strings. */
const r2 = (n: number) => Math.round(n * 100) / 100;

/* ——————————————————— Labels ——————————————————— */

export function Badge({ kind }: { kind: 'concept' | 'demo' | 'placeholder' | 'synthetic' }) {
  const text = {
    concept: 'Concept copy',
    demo: 'Demo only',
    placeholder: 'Placeholder',
    synthetic: 'Synthetic data',
  }[kind];
  return <span className={`ad-badge ad-badge-${kind}`}>{text}</span>;
}

/* ——————————————————— Type ——————————————————— */

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="ad-eyebrow">{children}</p>;
}
export function Display({ children, as = 'h1', size = 'xl' }: { children: ReactNode; as?: 'h1' | 'h2' | 'h3'; size?: 'xxl' | 'xl' | 'l' | 'm' }) {
  const Tag = as;
  return <Tag className={`ad-display ad-display-${size}`}>{children}</Tag>;
}
export function Lead({ children }: { children: ReactNode }) {
  return <p className="ad-lead">{children}</p>;
}
export function Note({ children }: { children: ReactNode }) {
  return <p className="ad-note">{children}</p>;
}
export function Hand({ children }: { children: ReactNode }) {
  return <span className="ad-hand">{children}</span>;
}

/* ——————————————————— Controls ——————————————————— */

export function Btn({ children, kind = 'primary', onClick, small }: { children: ReactNode; kind?: 'primary' | 'secondary' | 'ghost'; onClick?: () => void; small?: boolean }) {
  const id = useConceptId();
  return (
    <button type="button" className={`ad-btn ad-btn-${kind} ${small ? 'ad-btn-sm' : ''}`} onClick={onClick}>
      <span>{children}</span>
      {id === 'living-manifesto' && kind !== 'ghost' ? <span aria-hidden className="ad-btn-arrow">→</span> : null}
    </button>
  );
}

export function Card({ children, className = '', index, label }: { children: ReactNode; className?: string; index?: string; label?: string }) {
  return (
    <div className={`ad-card ${className}`}>
      {label ? <span className="ad-card-label">{label}</span> : null}
      {index ? <span className="ad-card-index" aria-hidden>{index}</span> : null}
      {children}
    </div>
  );
}

export function Tag({ children, active }: { children: ReactNode; active?: boolean }) {
  return <span className={`ad-tag ${active ? 'is-active' : ''}`}>{children}</span>;
}

export function Toggle({ label, defaultOn = false }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button type="button" role="switch" aria-checked={on} className="ad-switch" onClick={() => setOn(!on)}>
      <span className="ad-switch-label">{label}</span>
      <span className="ad-switch-track" data-on={on}>
        <span className="ad-switch-thumb" />
      </span>
    </button>
  );
}

/* ——————————————————— Brand mark ——————————————————— */

export function Mark({ size = 28 }: { size?: number }) {
  const id = useConceptId();
  if (id === 'golden-human') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="ad-mark">
        <circle cx="16" cy="16" r="6.5" fill="var(--c-accent)" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <line key={i} x1={r2(16 + Math.cos(a) * 9.5)} y1={r2(16 + Math.sin(a) * 9.5)} x2={r2(16 + Math.cos(a) * 13)} y2={r2(16 + Math.sin(a) * 13)} stroke="var(--c-accent)" strokeWidth="1.4" strokeLinecap="round" />;
        })}
      </svg>
    );
  }
  if (id === 'resonance-atlas') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="ad-mark">
        <circle cx="16" cy="16" r="13" fill="none" stroke="var(--c-accent)" strokeWidth="1.2" />
        <circle cx="16" cy="16" r="8" fill="none" stroke="var(--c-accent-2)" strokeWidth="1.2" />
        <circle cx="16" cy="16" r="2.5" fill="var(--c-accent)" />
        <circle cx="27.3" cy="9.5" r="2" fill="var(--c-ink)" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="ad-mark">
      <rect x="1" y="1" width="30" height="30" fill="var(--c-ink)" />
      <rect x="7" y="7" width="18" height="18" fill="var(--c-accent)" />
    </svg>
  );
}

export function Wordmark() {
  const id = useConceptId();
  return (
    <span className="ad-wordmark">
      <Mark size={id === 'living-manifesto' ? 22 : 26} />
      <span>{brand.name}</span>
    </span>
  );
}

/* ——————————————————— Imagery placeholders ——————————————————— */

export function Portrait({ label = 'Portrait placeholder — LG to approve real imagery', tall }: { label?: string; tall?: boolean }) {
  const id = useConceptId();
  return (
    <figure className={`ad-portrait ad-portrait-${id} ${tall ? 'is-tall' : ''}`} aria-label={label}>
      <div className="ad-portrait-art" aria-hidden>
        {id === 'golden-human' ? (
          <>
            <div className="ad-sunlight" />
            <svg viewBox="0 0 100 120" className="ad-silhouette">
              <circle cx="50" cy="44" r="17" />
              <path d="M18 120 C 20 84, 34 70, 50 70 C 66 70, 80 84, 82 120 Z" />
            </svg>
          </>
        ) : id === 'resonance-atlas' ? (
          <svg viewBox="0 0 100 100" className="ad-silhouette">
            {[46, 38, 30].map((r) => (
              <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="var(--c-line)" strokeWidth="0.6" />
            ))}
            <circle cx="50" cy="40" r="11" />
            <path d="M28 86 C 30 64, 40 56, 50 56 C 60 56, 70 64, 72 86 Z" />
            <circle cx="50" cy="50" r="46" fill="none" stroke="var(--c-accent)" strokeWidth="0.8" strokeDasharray="2 4" className="ad-spin" />
          </svg>
        ) : (
          <div className="ad-halftone" />
        )}
      </div>
      <figcaption className="ad-portrait-cap">{label}</figcaption>
    </figure>
  );
}

/* ——————————————————— Sound visual (no real audio) ——————————————————— */

function seeded(n: number, seed = 7): number[] {
  const out: number[] = [];
  let x = seed;
  for (let i = 0; i < n; i++) {
    x = (x * 9301 + 49297) % 233280;
    const r = x / 233280;
    out.push(0.25 + 0.75 * Math.abs(Math.sin(i * 0.45) * 0.6 + r * 0.4));
  }
  return out;
}

export function Wave({ playing = false, progress = 0.35, bars = 48, label = 'Audio waveform placeholder — no audio is played' }: { playing?: boolean; progress?: number; bars?: number; label?: string }) {
  const id = useConceptId();
  const hs = useMemo(() => seeded(bars), [bars]);
  if (id === 'golden-human') {
    const pts = hs.map((h, i) => `${r2((i / (bars - 1)) * 300)},${r2(30 - (i % 2 ? 1 : -1) * h * 22)}`).join(' ');
    return (
      <svg viewBox="0 0 300 60" className={`ad-wave ad-wave-gh ${playing ? 'is-playing' : ''}`} role="img" aria-label={label} preserveAspectRatio="none">
        <defs>
          <clipPath id="ghclip">
            <rect x="0" y="0" width={300 * progress} height="60" />
          </clipPath>
        </defs>
        <polyline points={pts} fill="none" stroke="var(--c-line)" strokeWidth="1.6" strokeLinejoin="round" />
        <polyline points={pts} fill="none" stroke="var(--c-accent)" strokeWidth="2" strokeLinejoin="round" clipPath="url(#ghclip)" />
      </svg>
    );
  }
  if (id === 'resonance-atlas') {
    return (
      <svg viewBox="0 0 200 200" className={`ad-wave ad-wave-ra ${playing ? 'is-playing' : ''}`} role="img" aria-label={label}>
        <circle cx="100" cy="100" r="54" fill="none" stroke="var(--c-line)" strokeWidth="1" />
        <circle cx="100" cy="100" r="54" fill="none" stroke="var(--c-accent)" strokeWidth="2" strokeDasharray={`${r2(2 * Math.PI * 54 * progress)} 999`} transform="rotate(-90 100 100)" />
        {hs.map((h, i) => {
          const a = (i / bars) * Math.PI * 2 - Math.PI / 2;
          const r1 = 60;
          const rOut = 60 + h * 30;
          return (
            <line key={i} className="ad-ra-bar" style={{ animationDelay: `${(i % 12) * 60}ms` }} x1={r2(100 + Math.cos(a) * r1)} y1={r2(100 + Math.sin(a) * r1)} x2={r2(100 + Math.cos(a) * rOut)} y2={r2(100 + Math.sin(a) * rOut)} stroke={i % 3 === 0 ? 'var(--c-accent-2)' : 'var(--c-accent)'} strokeWidth="1.6" strokeLinecap="round" />
          );
        })}
        <circle cx="100" cy="100" r="30" fill="none" stroke="var(--c-accent-2)" strokeWidth="0.8" className="ad-pulse" />
      </svg>
    );
  }
  return (
    <div className={`ad-wave ad-wave-lm ${playing ? 'is-playing' : ''}`} role="img" aria-label={label}>
      {hs.map((h, i) => (
        <span key={i} style={{ height: `${r2(h * 100)}%`, animationDelay: `${(i % 8) * 70}ms` }} className={i / bars < progress ? 'is-past' : ''} />
      ))}
    </div>
  );
}

/* ——————————————————— Geometry ——————————————————— */

export function Rings({ count = 5, labels, active, onPick }: { count?: number; labels?: string[]; active?: number; onPick?: (i: number) => void }) {
  return (
    <svg viewBox="0 0 400 400" className="ad-rings" role={onPick ? 'group' : 'img'} aria-label="Geometry of Growth diagram — a metaphor, not a scientific model">
      {Array.from({ length: count }).map((_, i) => {
        const r = 40 + i * 36;
        const isActive = active === i;
        return (
          <g key={i}>
            <circle
              cx="200" cy="200" r={r}
              className={`ad-ring ${isActive ? 'is-active' : ''}`}
              style={{ animationDelay: `${i * 140}ms` }}
              fill="none"
              strokeWidth={isActive ? 3 : 1.2}
            />
            {onPick ? (
              <circle
                cx="200" cy="200" r={r} fill="none" stroke="transparent" strokeWidth="18"
                tabIndex={0} role="button" aria-label={labels?.[i] ?? `Ring ${i + 1}`} aria-pressed={isActive}
                style={{ cursor: 'pointer' }}
                onClick={() => onPick(i)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onPick(i))}
              />
            ) : null}
          </g>
        );
      })}
      <circle cx="200" cy="200" r="10" fill="var(--c-accent)" />
    </svg>
  );
}

export function Constellation({ labels, links = [[0, 1], [1, 2], [2, 3], [1, 3]], height = 260 }: { labels: string[]; links?: [number, number][]; height?: number }) {
  const pts = useMemo(() => {
    const base = [
      [18, 30], [42, 18], [64, 46], [82, 24], [30, 72], [58, 80], [88, 66], [10, 52],
    ];
    return labels.map((_, i) => base[i % base.length]);
  }, [labels]);
  const uid = useId();
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="ad-constellation" style={{ height }} role="img" aria-label={`Constellation of themes: ${labels.join(', ')}`}>
      <defs>
        <radialGradient id={`${uid}-g`}>
          <stop offset="0%" stopColor="var(--c-accent)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--c-accent)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {links.filter(([a, b]) => pts[a] && pts[b]).map(([a, b], i) => (
        <line key={i} className="ad-draw" x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]} stroke="var(--c-accent-2)" strokeWidth="0.35" vectorEffect="non-scaling-stroke" style={{ animationDelay: `${i * 180}ms` }} />
      ))}
      {pts.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="5" fill={`url(#${uid}-g)`} className="ad-twinkle" style={{ animationDelay: `${i * 300}ms` }} />
          <circle cx={x} cy={y} r="1.1" fill="var(--c-ink)" />
        </g>
      ))}
    </svg>
  );
}

export function ConstellationLabels({ labels }: { labels: string[] }) {
  return (
    <ul className="ad-const-labels">
      {labels.map((l, i) => (
        <li key={l}>
          <span className="ad-mono">★ {String(i + 1).padStart(2, '0')}</span> {l}
        </li>
      ))}
    </ul>
  );
}

export function Marquee({ text = brand.expansion }: { text?: string }) {
  const items = Array.from({ length: 6 }).map((_, i) => (
    <span key={i}>
      {text} <b aria-hidden>■</b>{' '}
    </span>
  ));
  return (
    <div className="ad-marquee" aria-label={text}>
      <div className="ad-marquee-track" aria-hidden>
        {items}
        {items}
      </div>
    </div>
  );
}

/** Concept-specific atmospheric background for heroes. */
export function Atmosphere() {
  const id = useConceptId();
  if (id === 'golden-human') return <div className="ad-atmo ad-atmo-gh" aria-hidden><div className="ad-bloom" /><div className="ad-grain" /></div>;
  if (id === 'resonance-atlas')
    return (
      <div className="ad-atmo ad-atmo-ra" aria-hidden>
        <div className="ad-gridlines" />
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="ad-stars">
          {seeded(60, 3).map((h, i) => (
            <circle key={i} cx={r2((i * 37.3) % 100)} cy={r2((i * 61.7) % 100)} r={r2(h * 0.35)} fill="var(--c-ink)" opacity={r2(0.25 + h * 0.5)} className={i % 5 === 0 ? 'ad-twinkle' : ''} style={{ animationDelay: `${i * 90}ms` }} />
          ))}
        </svg>
        <div className="ad-refract" />
      </div>
    );
  return <div className="ad-atmo ad-atmo-lm" aria-hidden><div className="ad-grain" /></div>;
}

/** Hero headline reveal — line by line; motion style differs per concept via CSS. */
export function RevealLines({ lines, accentIndex }: { lines: string[]; accentIndex?: number }) {
  return (
    <span className="ad-reveal">
      {lines.map((l, i) => (
        <span key={i} className={`ad-reveal-line ${i === accentIndex ? 'is-accent' : ''}`} style={{ animationDelay: `${150 + i * 220}ms` }}>
          {l}
        </span>
      ))}
    </span>
  );
}

export function Stamp({ children }: { children: ReactNode }) {
  return <span className="ad-stamp">{children}</span>;
}

export function Progress({ value, label }: { value: number; label: string }) {
  return (
    <div className="ad-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)} aria-label={label}>
      <span style={{ width: `${value * 100}%` }} />
    </div>
  );
}

export function Icon({ name }: { name: 'sun' | 'mirror' | 'path' | 'mic' | 'book' | 'stars' | 'circle' | 'user' | 'bell' | 'home' | 'play' | 'pause' | 'back' | 'menu' | 'close' | 'plus' | 'check' }) {
  const id = useConceptId();
  const sw = id === 'living-manifesto' ? 2.5 : id === 'resonance-atlas' ? 1.5 : 1.3;
  const cap = id === 'living-manifesto' ? 'square' : 'round';
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: sw, strokeLinecap: cap, strokeLinejoin: cap === 'round' ? 'round' : 'miter' } as const;
  const paths: Record<string, ReactNode> = {
    sun: <><circle cx="12" cy="12" r="4" {...p} /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" {...p} /></>,
    home: <path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z" {...p} />,
    mirror: <><ellipse cx="12" cy="10" rx="6" ry="7" {...p} /><path d="M12 17v4M8 21h8" {...p} /></>,
    path: <path d="M12 21V12M12 12 6 5M12 12l6-7M6 5h0M18 5h0" {...p} />,
    mic: <><rect x="9" y="3" width="6" height="11" rx="3" {...p} /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" {...p} /></>,
    book: <path d="M3 5c3-1 6-1 9 1 3-2 6-2 9-1v14c-3-1-6-1-9 1-3-2-6-2-9-1zM12 6v14" {...p} />,
    stars: <><path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z" {...p} /><path d="M18 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" {...p} /></>,
    circle: <><circle cx="8" cy="10" r="3" {...p} /><circle cx="16" cy="10" r="3" {...p} /><path d="M3 20c1-3 3-4 5-4s4 1 5 4M11 20c1-3 3-4 5-4s4 1 5 4" {...p} /></>,
    user: <><circle cx="12" cy="8" r="4" {...p} /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" {...p} /></>,
    bell: <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0" {...p} />,
    play: <path d="M8 5v14l11-7z" {...p} />,
    pause: <path d="M8 5v14M16 5v14" {...p} />,
    back: <path d="M15 5l-7 7 7 7" {...p} />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" {...p} />,
    close: <path d="M6 6l12 12M18 6 6 18" {...p} />,
    plus: <path d="M12 5v14M5 12h14" {...p} />,
    check: <path d="M5 12l5 5 9-10" {...p} />,
  };
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden className="ad-icon">
      {paths[name]}
    </svg>
  );
}
