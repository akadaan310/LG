'use client';

import Link from 'next/link';
import { concepts } from '@adequate/design-tokens';
import { ConceptCard } from '@/components/ConceptCard';
import { HybridPanel } from '@/components/HybridPanel';
import { NomenclaturePanel } from '@/components/NomenclaturePanel';
import { StorageNote } from '@/components/StorageNote';
import { useReview } from '@/lib/review-store';
import { unresolvedItems } from '@/lib/derive';

export default function AtelierHome() {
  const { state } = useReview();
  const open = unresolvedItems(state).length;
  return (
    <main className="at-page">
      <section className="at-hello">
        <div>
          <h1>Welcome to the ADEQUATE Design Atelier.</h1>
          <p>
            Three very different ways ADEQUATE could look, sound and feel. Nothing here is decided until you decide it — and
            “none of these” is always an allowed answer. Take your time, trust your first feeling, and say it in your own words.
          </p>
        </div>
        <div className="at-callout">
          <strong>How this works</strong>
          <span>1 · Give each direction a first feeling: Love, Maybe, or Not for me.</span>
          <span>2 · Explore any of them on desktop, iPad, and phone.</span>
          <span>3 · Mix & match parts you like from different directions.</span>
          <span>4 · Everything you choose is saved on this device and can be exported.</span>
          <span className="at-row" style={{ marginTop: 6 }}>
            <Link className="at-btn at-btn-sm at-btn-primary" href="/present/">Start guided review</Link>
            <Link className="at-btn at-btn-sm" href="/review/">{open} things still open</Link>
          </span>
        </div>
      </section>

      <section aria-labelledby="board-title">
        <div className="at-section-head" style={{ marginBottom: 16 }}>
          <div>
            <h2 className="at-h2" id="board-title">The three directions</h2>
            <p className="at-sub">All copy is concept copy, not LG’s words. All member data is synthetic. Portraits are placeholders.</p>
          </div>
        </div>
        <div className="at-board">
          {concepts.map((c) => (
            <ConceptCard key={c.id} concept={c} />
          ))}
        </div>
      </section>

      <HybridPanel />
      <NomenclaturePanel />

      <section className="at-next" aria-label="Next steps">
        <Link href="/present/" className="at-panel"><b>Present together →</b><span className="at-muted">Big buttons, arrow keys and swipe. Built for sitting side by side.</span></Link>
        <Link href="/compare/" className="at-panel"><b>Compare side by side →</b><span className="at-muted">Any two directions or variants, at any screen size.</span></Link>
        <Link href="/voice/" className="at-panel"><b>Founder Voice →</b><span className="at-muted">Write an idea and the feeling it should create; attach it to a screen.</span></Link>
        <Link href="/review/" className="at-panel"><b>Review & export →</b><span className="at-muted">History, undo, unresolved items, and handoff files.</span></Link>
      </section>
      <StorageNote />
    </main>
  );
}
