import { statusLabels, type DecisionStatus } from '@adequate/mock-content';

const toneClass = { yes: 'at-chip-yes', soft: 'at-chip-soft', no: 'at-chip-no', later: 'at-chip-later' } as const;

export function StatusChip({ status }: { status: DecisionStatus }) {
  const s = statusLabels[status];
  return <span className={`at-chip ${toneClass[s.tone]}`}>{s.label}</span>;
}
