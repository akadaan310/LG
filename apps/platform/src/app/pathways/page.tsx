import type { Metadata } from 'next';
import { PlatformApp } from '../../components/PlatformApp';
export const metadata: Metadata = { title: 'Pathways', alternates: { canonical: '/pathways' } };
export default function Page() { return <PlatformApp route="pathways" />; }
