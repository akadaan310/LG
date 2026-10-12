'use client';

import { useReview } from '@/lib/review-store';

export function StorageNote() {
  const { storageAvailable, state, hydrated } = useReview();
  return (
    <p className="at-small at-muted" role="note">
      {storageAvailable
        ? 'Saved only in this browser on this device (localStorage). It is not synced anywhere — export from “Review & export” to keep or share a copy.'
        : 'This browser is not allowing local saving (private mode?). Your choices last only until you close the tab — export before leaving.'}
      {hydrated ? ` · ${state.decisions.length} decisions recorded` : ''}
    </p>
  );
}
