import type { Metadata } from 'next';
import { PlatformApp } from '../../components/PlatformApp';
export const metadata: Metadata = { title: 'Founder story', alternates: { canonical: '/story' } };
export default function Page() { return <PlatformApp route="story" />; }
