import { concepts, type ConceptId } from '@adequate/design-tokens';
import { ExploreView } from '@/components/ExploreView';

export function generateStaticParams() {
  return concepts.map((c) => ({ id: c.id }));
}

export default async function ConceptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ExploreView conceptId={id as ConceptId} />;
}
