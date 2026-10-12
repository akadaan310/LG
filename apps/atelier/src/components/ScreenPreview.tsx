'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { conceptById, type ConceptId } from '@adequate/design-tokens';
import { screenById } from '@adequate/mock-content';
import { ConceptFrame, type ScreenCtx } from '@/screens/kit';
import { RenderScreen } from '@/screens/registry';
import { usePrefs } from '@/lib/prefs';

export interface Viewport {
  id: string;
  label: string;
  w: number;
  h: number;
  kind: 'web' | 'mobile-web' | 'ios' | 'android';
}

export const viewports: Viewport[] = [
  { id: 'desktop', label: 'Desktop 1440', w: 1440, h: 900, kind: 'web' },
  { id: 'laptop', label: 'Laptop 1024', w: 1024, h: 720, kind: 'web' },
  { id: 'ipad-l', label: 'iPad landscape 1180', w: 1180, h: 820, kind: 'web' },
  { id: 'ipad-p', label: 'iPad portrait 820', w: 820, h: 1180, kind: 'web' },
  { id: 'm390', label: 'Mobile web 390', w: 390, h: 844, kind: 'mobile-web' },
  { id: 'm360', label: 'Mobile web 360', w: 360, h: 780, kind: 'mobile-web' },
  { id: 'ios', label: 'iOS app', w: 390, h: 844, kind: 'ios' },
  { id: 'android', label: 'Android app', w: 360, h: 800, kind: 'android' },
];
export const viewportById = Object.fromEntries(viewports.map((v) => [v.id, v])) as Record<string, Viewport>;

const CHROME = {
  web: { top: 0, bottom: 0 },
  'mobile-web': { top: 44 + 40, bottom: 0 },
  ios: { top: 50, bottom: 30 },
  android: { top: 28, bottom: 44 },
} as const;

export interface ScreenPreviewProps {
  conceptId: ConceptId;
  screenId: string;
  variant: 'v1' | 'v2';
  viewport: Viewport;
  /** Thumbnails are inert and non-interactive */
  thumbnail?: boolean;
  /** Max rendered height in CSS px (scale shrinks to fit) */
  maxHeight?: number;
  /** Called when in-frame navigation changes the screen */
  onNavigate?: (screenId: string) => void;
  label?: string;
}

/**
 * Renders a mock screen at a real nominal viewport width, scaled to fit the available space.
 * Responsive behaviour inside uses CSS container queries, so the layout responds to the frame,
 * not to the reviewer's browser window.
 */
export function ScreenPreview({ conceptId, screenId, variant, viewport, thumbnail, maxHeight, onNavigate, label }: ScreenPreviewProps) {
  const prefs = usePrefs();
  const outer = useRef<HTMLDivElement>(null);
  const [avail, setAvail] = useState(0);
  const [stack, setStack] = useState<string[]>([screenId]);
  const [toast, setToast] = useState<string | null>(null);

  // Reset the in-frame history when the requested screen changes from outside.
  useEffect(() => setStack([screenId]), [screenId]);

  useLayoutEffect(() => {
    const el = outer.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setAvail(e.contentRect.width));
    ro.observe(el);
    setAvail(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  const current = stack[stack.length - 1];
  const navigate = useCallback(
    (id: string) => {
      if (!screenById[id]) return;
      setStack((s) => (s[s.length - 1] === id ? s : [...s, id]));
      onNavigate?.(id);
    },
    [onNavigate],
  );
  const back = useCallback(() => {
    setStack((s) => {
      if (s.length > 1) {
        const next = s.slice(0, -1);
        onNavigate?.(next[next.length - 1]);
        return next;
      }
      setToast('At the first screen — on Android, Back would now leave the app (demo).');
      setTimeout(() => setToast(null), 2200);
      return s;
    });
  }, [onNavigate]);

  const chrome = CHROME[viewport.kind];
  const framePad = viewport.kind === 'web' ? 0 : 12;
  const totalW = viewport.w + framePad * 2;
  const totalH = viewport.h + framePad * 2;
  let scale = avail ? Math.min(1, avail / totalW) : 0;
  if (maxHeight) scale = Math.min(scale, maxHeight / totalH);

  const ctx: ScreenCtx = {
    concept: conceptById[conceptId],
    mode: prefs.modeFor(conceptId),
    platform: viewport.kind === 'ios' || viewport.kind === 'android' ? viewport.kind : 'web',
    width: viewport.w,
    reducedMotion: prefs.reducedMotion,
    navigate: thumbnail ? undefined : navigate,
  };
  const variantKey = current === screenId ? variant : 'v1';
  const def = screenById[current];

  return (
    <div ref={outer} className={`sp ${thumbnail ? 'sp-thumb' : ''}`} style={{ height: scale ? totalH * scale : undefined }} aria-label={label ?? `${conceptById[conceptId].name} · ${def?.name} · ${viewport.label}`} role="region">
      {scale ? (
        <div
          className={`sp-device sp-${viewport.kind}`}
          style={{ width: totalW, height: totalH, transform: `scale(${scale})`, padding: framePad }}
          inert={thumbnail || undefined}
        >
          <div className="sp-screen" style={{ width: viewport.w, height: viewport.h }}>
            {viewport.kind === 'ios' ? (
              <div className="sp-status sp-status-ios" style={{ height: chrome.top }}>
                <span>9:41</span>
                <span className="sp-island" aria-hidden />
                <span aria-hidden>●●● ▮</span>
              </div>
            ) : viewport.kind === 'android' ? (
              <div className="sp-status sp-status-android" style={{ height: chrome.top }}>
                <span>9:41</span>
                <span className="sp-punch" aria-hidden />
                <span aria-hidden>▾ ▮</span>
              </div>
            ) : viewport.kind === 'mobile-web' ? (
              <div className="sp-browser" style={{ height: chrome.top }}>
                <div className="sp-status sp-status-ios"><span>9:41</span><span aria-hidden>●●● ▮</span></div>
                <div className="sp-urlbar"><span>adequate · design preview (local mock)</span></div>
              </div>
            ) : null}
            <div className="sp-viewport" style={{ height: viewport.h - chrome.top - chrome.bottom }}>
              <ConceptFrame ctx={ctx} key={`${conceptId}-${current}-${variantKey}`} className="sp-fade">
                <RenderScreen screenId={current} variant={variantKey} />
              </ConceptFrame>
            </div>
            {viewport.kind === 'ios' ? (
              <div className="sp-home" style={{ height: chrome.bottom }}>
                {stack.length > 1 && !thumbnail ? (
                  <button type="button" className="sp-ios-back" onClick={back} aria-label="Back (swipe-back gesture in the real app)">‹ Back</button>
                ) : null}
                <span aria-hidden />
              </div>
            ) : viewport.kind === 'android' ? (
              <div className="sp-navbar" style={{ height: chrome.bottom }}>
                <button type="button" onClick={back} aria-label="Android Back">◁</button>
                <button type="button" onClick={() => navigate('member.today')} aria-label="Android Home (returns to Today in this demo)">○</button>
                <button type="button" aria-label="Recent apps (no-op in demo)">▢</button>
              </div>
            ) : null}
            {toast ? <div className="sp-toast" role="status">{toast}</div> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
