'use client';

import { useLayoutEffect, useRef, useState } from 'react';

const SRC = '/native-app/index.html';

function ScaledFrame({ w, h, label, rounded }: { w: number; h: number; label: string; rounded: number }) {
  const box = useRef<HTMLDivElement>(null);
  const [avail, setAvail] = useState(0);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setAvail(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const pad = 12;
  const scale = avail ? Math.min(1, avail / (w + pad * 2), 760 / (h + pad * 2)) : 0;
  return (
    <figure style={{ margin: 0, display: 'grid', gap: 8 }}>
      <div ref={box} style={{ width: '100%', height: scale ? (h + pad * 2) * scale : 400, position: 'relative' }}>
        {scale ? (
          <div style={{ position: 'absolute', left: '50%', top: 0, width: w + pad * 2, height: h + pad * 2, padding: pad, background: '#111', borderRadius: rounded + pad, transform: `translateX(-50%) scale(${scale})`, transformOrigin: 'top center' }}>
            <iframe title={label} src={SRC} width={w} height={h} style={{ border: 0, borderRadius: rounded, background: '#fff', display: 'block' }} />
          </div>
        ) : null}
      </div>
      <figcaption className="at-small at-muted" style={{ textAlign: 'center' }}>{label}</figcaption>
    </figure>
  );
}

export function NativeView() {
  return (
    <main className="at-page">
      <section style={{ display: 'grid', gap: 8 }}>
        <h1 className="at-h2" style={{ fontSize: 30 }}>Native app components (Expo React Native)</h1>
        <p className="at-sub" style={{ maxWidth: 900 }}>
          These are the actual React Native components from <code>apps/native-preview</code>, compiled for the browser with react-native-web.
          Use the dark “Design preview” bar to switch direction (A/B/C), light/dark and the two ways of each screen. On a real iPhone or Android phone,
          run them with Expo Go (see README). In the browser, phone fonts fall back to system faces, and the iOS/Android navigation differences only show on a device.
        </p>
      </section>
      <div className="at-grid-2" style={{ alignItems: 'start' }}>
        <ScaledFrame w={390} h={844} rounded={44} label="Phone · 390 × 844 (native components via react-native-web)" />
        <ScaledFrame w={820} h={1180} rounded={20} label="iPad portrait · 820 × 1180 — tablet sidebar layout" />
      </div>
    </main>
  );
}
