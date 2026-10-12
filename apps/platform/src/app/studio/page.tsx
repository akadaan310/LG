import type { Metadata } from 'next';
import { PlatformApp } from '../../components/PlatformApp';
export const metadata: Metadata = { title: 'Founder Studio', alternates: { canonical: '/studio' } };
export default function Page() { return <PlatformApp route="studio" />; }
