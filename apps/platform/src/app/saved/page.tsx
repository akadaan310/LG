import type { Metadata } from 'next';
import { PlatformApp } from '../../components/PlatformApp';
export const metadata: Metadata = { title: 'Saved content', alternates: { canonical: '/saved' } };
export default function Page() { return <PlatformApp route="saved" />; }
