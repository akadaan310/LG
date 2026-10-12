import { Suspense } from 'react';
import { FullPreview } from '@/components/FullPreview';

export default function PreviewPage() {
  return (
    <Suspense fallback={null}>
      <FullPreview />
    </Suspense>
  );
}
