'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { authors } from '@adequate/mock-content';
import { useReview } from '@/lib/review-store';
import { usePrefs, type MotionPref } from '@/lib/prefs';

const links: [string, string][] = [
  ['/', 'Atelier'],
  ['/concept/golden-human/', 'A · Golden'],
  ['/concept/resonance-atlas/', 'B · Atlas'],
  ['/concept/living-manifesto/', 'C · Manifesto'],
  ['/compare/', 'Compare'],
  ['/present/', 'Present'],
  ['/voice/', 'Founder Voice'],
  ['/review/', 'Review & export'],
];

export function TopBar() {
  const path = usePathname();
  const { state, undo, redo, setAuthor } = useReview();
  const { motion, setMotion } = usePrefs();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  const norm = (p: string) => (p.endsWith('/') ? p : `${p}/`);
  return (
    <header className="at-top">
      <Link href="/" className="at-brand">
        <b>ADEQUATE</b>
        <span>Design Atelier</span>
      </Link>
      <nav className="at-nav" aria-label="Atelier">
        {links.map(([href, label]) => (
          <Link key={href} href={href} aria-current={norm(path ?? '/') === norm(href) ? 'page' : undefined}>
            {label}
          </Link>
        ))}
      </nav>
      <div className="at-tools">
        <div className="at-seg" role="group" aria-label="Who is deciding?">
          {authors.map((a) => (
            <button key={a} type="button" aria-pressed={state.author === a} onClick={() => setAuthor(a)} title={`Decisions are recorded as ${a}`}>
              {a}
            </button>
          ))}
        </div>
        <label className="at-hide-sm at-small at-muted" htmlFor="motion-pref">Motion</label>
        <select id="motion-pref" className="at-select at-hide-sm" value={motion} onChange={(e) => setMotion(e.target.value as MotionPref)}>
          <option value="system">Follow device</option>
          <option value="on">On</option>
          <option value="off">Reduced</option>
        </select>
        <button type="button" className="at-iconbtn" onClick={undo} disabled={!state.decisions.length} aria-label="Undo last decision" title="Undo (Ctrl/⌘+Z)">
          ↶ <span className="at-hide-sm">Undo</span>
        </button>
        <button type="button" className="at-iconbtn at-hide-sm" onClick={redo} disabled={!state.redo.length} aria-label="Redo" title="Redo (Ctrl/⌘+Shift+Z)">
          ↷
        </button>
      </div>
    </header>
  );
}
