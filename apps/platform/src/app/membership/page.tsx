import type { Metadata } from 'next';
import { PlatformApp } from '../../components/PlatformApp';
export const metadata: Metadata = { title: 'Membership', alternates: { canonical: '/membership' } };
export default function Page() { return <PlatformApp route="membership" />; }
