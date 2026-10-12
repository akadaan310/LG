import type { Metadata } from 'next';
import { PlatformApp } from '../../../components/PlatformApp';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; return { title: 'Published content', alternates: { canonical: `/content/${encodeURIComponent(slug)}` } }; }
export default async function ContentPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return <PlatformApp route="content" slug={slug} />; }
