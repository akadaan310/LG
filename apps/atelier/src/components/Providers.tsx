'use client';

import type { ReactNode } from 'react';
import { ReviewProvider } from '@/lib/review-store';
import { PrefsProvider } from '@/lib/prefs';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PrefsProvider>
      <ReviewProvider>{children}</ReviewProvider>
    </PrefsProvider>
  );
}
