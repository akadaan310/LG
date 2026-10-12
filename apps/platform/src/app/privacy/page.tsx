import type { Metadata } from 'next';
import { PlatformApp } from '../../components/PlatformApp';
export const metadata: Metadata = { title: 'Privacy', alternates: { canonical: '/privacy' } };
export default function Page() { return <PlatformApp route="privacy" />; }
