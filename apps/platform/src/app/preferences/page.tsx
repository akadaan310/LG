import type { Metadata } from 'next';
import { PlatformApp } from '../../components/PlatformApp';
export const metadata: Metadata = { title: 'Preferences', alternates: { canonical: '/preferences' } };
export default function Page() { return <PlatformApp route="preferences" />; }
