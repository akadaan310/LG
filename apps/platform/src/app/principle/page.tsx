import type { Metadata } from 'next';
import { PlatformApp } from '../../components/PlatformApp';
export const metadata: Metadata = { title: 'The principle', alternates: { canonical: '/principle' } };
export default function Page() { return <PlatformApp route="principle" />; }
