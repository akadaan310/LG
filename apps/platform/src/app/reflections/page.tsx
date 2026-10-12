import type { Metadata } from 'next';
import { PlatformApp } from '../../components/PlatformApp';
export const metadata: Metadata = { title: 'Private reflections', alternates: { canonical: '/reflections' } };
export default function Page() { return <PlatformApp route="reflections" />; }
