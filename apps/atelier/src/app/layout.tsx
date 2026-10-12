import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
// Fonts are bundled locally from @fontsource (OFL) — no runtime network requests.
import '@fontsource/fraunces/300.css';
import '@fontsource/fraunces/400.css';
import '@fontsource/fraunces/600.css';
import '@fontsource/fraunces/300-italic.css';
import '@fontsource/fraunces/400-italic.css';
import '@fontsource/source-serif-4/400.css';
import '@fontsource/source-serif-4/600.css';
import '@fontsource/caveat/400.css';
import '@fontsource/caveat/600.css';
import '@fontsource/space-grotesk/300.css';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/anton/400.css';
import '@fontsource/archivo/400.css';
import '@fontsource/archivo/600.css';
import '@fontsource/archivo/800.css';
import '@/styles/atelier.css';
import '@/styles/screens.css';
import { Providers } from '@/components/Providers';
import { TopBar } from '@/components/TopBar';

export const metadata: Metadata = {
  title: 'ADEQUATE Design Atelier',
  description: 'Design-only review prototype for ADEQUATE. Concept copy and synthetic data only.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <TopBar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
