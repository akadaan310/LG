import type { Metadata } from 'next';
import { PlatformApp } from '../../components/PlatformApp';
export const metadata: Metadata = { title: 'Published library', alternates: { canonical: '/library' } };
export default function Page() { return <PlatformApp route="library" />; }
