import { concepts, conceptById, type ConceptId } from '@adequate/design-tokens';
import { hybridSlots, nomenclature, screens, type DecisionStatus } from '@adequate/mock-content';
import type { Decision, ReviewState } from './review-store';
import { decisionKey } from './review-store';

export function currentMap(state: ReviewState): Map<string, Decision> {
  const m = new Map<string, Decision>();
  for (const d of state.decisions) m.set(decisionKey(d), d);
  return m;
}

export function favoriteConcept(cur: Map<string, Decision>): ConceptId | null {
  const d = cur.get('favorite|overall');
  return d && d.status === 'approved' && d.conceptId ? d.conceptId : null;
}

export function hybridSelections(cur: Map<string, Decision>): Record<string, ConceptId | null> {
  const out: Record<string, ConceptId | null> = {};
  for (const s of hybridSlots) {
    const d = cur.get(`hybrid|${s.id}`);
    out[s.id] = d && d.status === 'approved' ? d.conceptId : null;
  }
  return out;
}

export function conceptReaction(cur: Map<string, Decision>, c: ConceptId): Decision | undefined {
  return cur.get(`concept|${c}|overall|-`);
}

export function screenVariantDecisions(cur: Map<string, Decision>, screenId: string): Decision[] {
  return [...cur.values()].filter((d) => d.level === 'screen' && d.targetId === screenId);
}

export function termDecision(cur: Map<string, Decision>, termId: string): Decision | undefined {
  return cur.get(`nomenclature|${termId}`);
}

export function termLabel(cur: Map<string, Decision>, termId: string): string {
  const d = termDecision(cur, termId);
  return d?.value || nomenclature.find((t) => t.id === termId)?.term || termId;
}

export interface OpenItem {
  id: string;
  kind: 'concept' | 'favorite' | 'hybrid' | 'screen' | 'nomenclature' | 'proposal';
  label: string;
  href: string;
  status: DecisionStatus | null;
}

const RESOLVED: DecisionStatus[] = ['approved', 'rejected', 'love', 'not-for-me'];

/** Everything that has not received an explicit decision. Silence never counts as approval. */
export function unresolvedItems(state: ReviewState): OpenItem[] {
  const cur = currentMap(state);
  const out: OpenItem[] = [];
  for (const c of concepts) {
    const d = conceptReaction(cur, c.id);
    if (!d || !RESOLVED.includes(d.status)) out.push({ id: `concept:${c.id}`, kind: 'concept', label: `First feeling about ${c.letter} · ${c.name}`, href: '/', status: d?.status ?? null });
  }
  if (!favoriteConcept(cur)) out.push({ id: 'favorite', kind: 'favorite', label: 'Favourite direction overall', href: '/', status: null });
  for (const s of hybridSlots) {
    const d = cur.get(`hybrid|${s.id}`);
    if (!d || d.status !== 'approved') out.push({ id: s.id, kind: 'hybrid', label: `Mix & match · ${s.name}`, href: '/#mix', status: d?.status ?? null });
  }
  for (const s of screens.filter((x) => x.priority)) {
    const ds = screenVariantDecisions(cur, s.id);
    if (!ds.some((d) => d.status === 'approved')) {
      out.push({ id: `screen:${s.id}`, kind: 'screen', label: `Screen · ${s.name}`, href: `/compare/?screen=${s.id}`, status: ds.length ? ds[ds.length - 1].status : null });
    }
  }
  for (const t of nomenclature) {
    const d = termDecision(cur, t.id);
    if (!d || !['approved', 'rejected'].includes(d.status)) out.push({ id: t.id, kind: 'nomenclature', label: `Name · ${termLabel(cur, t.id)}`, href: '/#names', status: d?.status ?? null });
  }
  for (const p of state.proposals) {
    const d = cur.get(`proposal|${p.id}`);
    if (!d || !['approved', 'rejected'].includes(d.status)) out.push({ id: p.id, kind: 'proposal', label: `Founder Voice proposal ${p.id}`, href: '/voice/', status: d?.status ?? null });
  }
  return out;
}

export function describeTarget(d: Decision): string {
  const concept = d.conceptId ? `${conceptById[d.conceptId].letter} · ${conceptById[d.conceptId].name}` : '';
  switch (d.level) {
    case 'concept':
      return `Overall feeling — ${concept}`;
    case 'favorite':
      return `Favourite direction — ${concept}`;
    case 'hybrid': {
      const slot = hybridSlots.find((s) => s.id === d.targetId)?.name ?? d.targetId;
      return d.conceptId ? `Mix & match: ${slot} from ${concept}` : `Mix & match: ${slot} (cleared)`;
    }
    case 'screen': {
      const s = screens.find((x) => x.id === d.targetId);
      const v = s?.variants.find((x) => x.id === d.variantId);
      return `${s?.name ?? d.targetId} — “${v?.name ?? d.variantId}” in ${concept}`;
    }
    case 'feature':
      return `Signature moment “${conceptById[d.conceptId!]?.signatureMoments.find((m) => `feature:${m.id}` === d.targetId)?.title ?? d.targetId}” — ${concept}`;
    case 'component':
      return `Component “${conceptById[d.conceptId!]?.components.find((c) => `component:${c.id}` === d.targetId)?.name ?? d.targetId}” — ${concept}`;
    case 'nomenclature':
      return `Name “${nomenclature.find((t) => t.id === d.targetId)?.term ?? d.targetId}”${d.value ? ` → “${d.value}”` : ''}`;
    case 'proposal':
      return `Founder Voice proposal ${d.targetId}`;
  }
}
