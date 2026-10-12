import type { Metadata } from 'next';
import { PlatformApp } from '../../components/PlatformApp';
export const metadata: Metadata = { title: 'Account access', alternates: { canonical: '/auth' } };
export default async function Page({ searchParams }: { searchParams: Promise<{ mode?: string }> }) { const { mode } = await searchParams; return <PlatformApp route="auth" recovery={mode === 'password'} />; }
