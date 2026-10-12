import type { Metadata } from 'next';
import { PlatformApp } from '../../components/PlatformApp';
export const metadata: Metadata = { title: 'Listening room', alternates: { canonical: '/listen' } };
export default function Page() { return <PlatformApp route="listen" />; }
