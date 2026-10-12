import type { Metadata } from 'next';
import '@fontsource/space-grotesk/300.css';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3100'),
  title: { default: 'ADEQUATE', template: '%s · ADEQUATE' },
  description: 'Approved founder content, listening, and private member reflections. Content and launch subject to owner approval.',
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en" data-theme="dark"><body>{children}</body></html>; }
