import { Suspense } from 'react';
import { CompareView } from '@/components/CompareView';

export default function ComparePage() {
  return (
    <Suspense fallback={<main className="at-page">Loading…</main>}>
      <CompareView />
    </Suspense>
  );
}
