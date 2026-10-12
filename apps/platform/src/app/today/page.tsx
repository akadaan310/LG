import type { Metadata } from 'next';
import { PlatformApp } from '../../components/PlatformApp';
export const metadata: Metadata = { title: 'Today', alternates: { canonical: '/today' } };
export default function Page() { return <PlatformApp route="today" />; }
