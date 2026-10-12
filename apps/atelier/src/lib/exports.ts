import { concepts, conceptById, auditConcept, type ConceptId } from '@adequate/design-tokens';
import { hybridSlots, nomenclature, screens, statusLabels } from '@adequate/mock-content';
import type { ReviewState } from './review-store';
import { currentMap, describeTarget, favoriteConcept, hybridSelections, termLabel, unresolvedItems } from './derive';

const GENERATOR = 'ADEQUATE Design Atelier v0.1 (local, design-only)';

/** design-decisions.json — the machine-readable record. Includes the full log so it can be re-imported. */
export function buildDecisionsJson(state: ReviewState): string {
  const cur = currentMap(state);
  const fav = favoriteConcept(cur);
  const hybrid = hybridSelections(cur);
  const payload = {
    $schema: 'adequate.design-decisions/1',
    generator: GENERATOR,
    exportedAt: new Date().toISOString(),
    notice:
      'Design review record only. Exported from browser localStorage on one device. Not synced. Contains no production data, credentials, or real member data. Silence is never recorded as approval.',
    summary: {
      favoriteConcept: fav,
      hybridSelections: hybrid,
      currentDecisions: [...cur.values()].sort((a, b) => a.seq - b.seq),
      unresolved: unresolvedItems(state).map((u) => ({ id: u.id, kind: u.kind, label: u.label, status: u.status })),
    },
    catalog: {
      concepts: concepts.map((c) => ({ id: c.id, letter: c.letter, name: c.name })),
      screens: screens.map((s) => ({ id: s.id, surface: s.surface, name: s.name, variants: s.variants.map((v) => ({ id: v.id, name: v.name })) })),
      hybridSlots: hybridSlots.map((s) => ({ id: s.id, name: s.name })),
      nomenclature: nomenclature.map((t) => ({ id: t.id, term: t.term })),
    },
    state,
  };
  return JSON.stringify(payload, null, 2);
}

/** design-review.md — a readable account of everything that was decided, by whom, and when. */
export function buildReviewMarkdown(state: ReviewState): string {
  const cur = currentMap(state);
  const fav = favoriteConcept(cur);
  const L: string[] = [];
  L.push('# ADEQUATE — Design review record', '');
  L.push(`Exported ${new Date().toLocaleString()} · ${GENERATOR}`, '');
  L.push('> Local review state from one device. All copy in the prototype is concept copy (not LG’s words); all member data is synthetic. Nothing is approved unless it says so explicitly below.', '');
  L.push('## First feelings', '');
  for (const c of concepts) {
    const d = cur.get(`concept|${c.id}|overall|-`);
    L.push(`- **${c.letter} · ${c.name}** — ${d ? `${statusLabels[d.status].label} (${d.author}, ${d.id})${d.comment ? ` — “${d.comment}”` : ''}` : '_no feeling recorded yet_'}`);
  }
  L.push('', `**Favourite overall:** ${fav ? `${conceptById[fav].letter} · ${conceptById[fav].name}` : '_not chosen_'}`, '');
  L.push('## Mix & match', '');
  const hy = hybridSelections(cur);
  for (const s of hybridSlots) L.push(`- ${s.name}: ${hy[s.id] ? `${conceptById[hy[s.id]!].letter} · ${conceptById[hy[s.id]!].name}` : '_open_'}`);
  L.push('', '## Screens', '');
  for (const s of screens) {
    const ds = [...cur.values()].filter((d) => d.level === 'screen' && d.targetId === s.id);
    if (!ds.length) continue;
    L.push(`### ${s.name} (\`${s.id}\`)`);
    for (const d of ds) L.push(`- ${describeTarget(d)} — **${statusLabels[d.status].label}** · ${d.author} · ${d.id}${d.emotionTags.length ? ` · feels: ${d.emotionTags.join(', ')}` : ''}${d.comment ? ` — “${d.comment}”` : ''}`);
    L.push('');
  }
  const comp = [...cur.values()].filter((d) => d.level === 'component' || d.level === 'feature');
  if (comp.length) {
    L.push('## Components & signature moments', '');
    for (const d of comp) L.push(`- ${describeTarget(d)} — **${statusLabels[d.status].label}** · ${d.author}${d.comment ? ` — “${d.comment}”` : ''}`);
    L.push('');
  }
  L.push('## Words', '');
  for (const t of nomenclature) {
    const d = cur.get(`nomenclature|${t.id}`);
    L.push(`- ${termLabel(cur, t.id)}${d?.value ? ` (was “${t.term}”)` : ''} — ${d ? statusLabels[d.status].label : '_open_'}`);
  }
  L.push('', '## Founder Voice proposals', '');
  if (!state.proposals.length) L.push('_None captured._');
  for (const p of state.proposals) {
    const d = cur.get(`proposal|${p.id}`);
    L.push(`### ${p.id} — attached to \`${p.surfaceId}\`${p.conceptId ? ` in ${conceptById[p.conceptId].name}` : ''}`);
    L.push(`> ${p.text.replace(/\n/g, '\n> ')}`, '');
    L.push(`- Intended impact: ${p.impact}${p.impactNote ? ` — ${p.impactNote}` : ''}`);
    L.push(`- Provenance: ${p.provenance}`);
    L.push(`- Status: ${d ? statusLabels[d.status].label : 'not yet decided'}`, '');
  }
  L.push('## Full history (oldest first)', '');
  L.push('| ID | When | Who | What | Status | Feelings | Note |', '|---|---|---|---|---|---|---|');
  for (const d of state.decisions) {
    L.push(`| ${d.id} | ${d.timestamp} | ${d.author} | ${describeTarget(d).replace(/\|/g, '/')} | ${statusLabels[d.status].label} | ${d.emotionTags.join(', ')} | ${d.comment.replace(/\|/g, '/').replace(/\n/g, ' ')} |`);
  }
  if (state.redo.length) L.push('', `_${state.redo.length} undone decision(s) are not counted above._`);
  return L.join('\n') + '\n';
}

/** selected-direction.md — the engineering-facing brief: approved tokens, variant IDs, open questions, provenance. */
export function buildSelectedDirection(state: ReviewState): string {
  const cur = currentMap(state);
  const fav = favoriteConcept(cur);
  const hy = hybridSelections(cur);
  const L: string[] = [];
  const pickFor = (slot: string): ConceptId | null => hy[slot] ?? fav;
  L.push('# ADEQUATE — Selected design direction (handoff brief)', '');
  L.push(`Generated ${new Date().toISOString()} · ${GENERATOR}`, '');
  L.push('> This brief reflects only explicit decisions recorded in the Atelier. Where nothing was chosen, the item is listed as **open** — Claude did not choose on LG’s behalf. Design phase only: no engineering is authorised by this document.', '');
  L.push('## Direction', '');
  L.push(`- Favourite overall: ${fav ? `**${conceptById[fav].letter} · ${conceptById[fav].name}** (\`${fav}\`)` : '**open**'}`);
  for (const s of hybridSlots) {
    const c = hy[s.id];
    L.push(`- ${s.name}: ${c ? `\`${c}\` (explicit)` : fav ? `\`${fav}\` (inherits favourite — confirm)` : '**open**'}`);
  }
  L.push('', '## Approved tokens', '');
  const paletteFrom = pickFor('slot.palette');
  const typeFrom = pickFor('slot.typography');
  const motionFrom = pickFor('slot.motion');
  if (paletteFrom) {
    const c = conceptById[paletteFrom];
    L.push(`### Colour (from \`${paletteFrom}\`)`, '', '```json', JSON.stringify(c.color, null, 2), '```', '');
    L.push('Computed contrast (default mode):', '');
    for (const a of auditConcept(c, c.defaultMode)) L.push(`- ${a.label}: ${a.ratio}:1 (${a.level}${a.pass ? '' : ' — below target ' + a.required + ':1'})`);
    L.push('');
  } else L.push('- Colour: **open**');
  if (typeFrom) {
    const t = conceptById[typeFrom].typography;
    L.push(`### Typography (from \`${typeFrom}\`)`, '', `- Display: ${t.display.family} → ${t.display.fallback}`, `- Body: ${t.body.family} → ${t.body.fallback}`, `- Accent: ${t.accent.family} → ${t.accent.fallback}`, `- Scale (px): ${t.scale.join(', ')}`, '');
  } else L.push('- Typography: **open**');
  if (motionFrom) {
    const m = conceptById[motionFrom].motion;
    L.push(`### Motion (from \`${motionFrom}\`)`, '', `- ${m.language}`, `- Easing: ${JSON.stringify(m.easing)}`, `- Durations (ms): ${JSON.stringify(m.durations)}`, `- Reduced motion: ${m.reducedMotion}`, '');
  } else L.push('- Motion: **open**');
  const base = fav ? conceptById[fav] : null;
  if (base) L.push(`### Spacing, radii, grid (from favourite \`${base.id}\`)`, '', `- Spacing: ${base.spacing.join(', ')}`, `- Radii: ${JSON.stringify(base.radii)}`, `- Grid: ${base.grid.note}`, '');
  L.push('## Approved screen variants', '');
  const approved = [...cur.values()].filter((d) => d.level === 'screen' && d.status === 'approved');
  if (!approved.length) L.push('_None approved yet._');
  for (const d of approved) L.push(`- \`${d.variantId}\` in \`${d.conceptId}\` — ${describeTarget(d)} (${d.author}, ${d.id})`);
  const comps = [...cur.values()].filter((d) => (d.level === 'component' || d.level === 'feature') && d.status === 'approved');
  if (comps.length) {
    L.push('', '## Approved components & signature moments', '');
    for (const d of comps) L.push(`- \`${d.conceptId}/${d.targetId}\` — ${describeTarget(d)}`);
  }
  L.push('', '## Names', '');
  for (const t of nomenclature) {
    const d = cur.get(`nomenclature|${t.id}`);
    L.push(`- \`${t.id}\`: ${termLabel(cur, t.id)} — ${d ? statusLabels[d.status].label : 'open'}`);
  }
  L.push('', '## Unresolved questions', '');
  const open = unresolvedItems(state);
  if (!open.length) L.push('_Nothing open in the review checklist._');
  for (const u of open) L.push(`- [ ] ${u.label}${u.status ? ` (currently: ${statusLabels[u.status].label})` : ''}`);
  L.push('- [ ] Confirm LG’s legal/brand name, biography, likeness and recording rights (Pre-PRD §12)');
  L.push('- [ ] Verify legal status before any “nonprofit” wording (Pre-PRD §12)');
  L.push('- [ ] Replace all concept copy with LG-approved words; never invent quotes');
  L.push('- [ ] Bundle chosen fonts natively for iOS/Android (Expo preview uses system fallbacks)');
  L.push('', '## Provenance', '');
  L.push(`- Decisions: ${state.decisions.length} recorded (${state.decisions.filter((d) => d.author === 'LG').length} by LG, ${state.decisions.filter((d) => d.author === 'Engineer').length} by Engineer).`);
  L.push('- All prototype copy is concept copy written for review; no LG quotations exist in the prototype.');
  L.push('- Member data is synthetic. Portraits are placeholders. No audio was used.');
  L.push(`- Founder Voice proposals: ${state.proposals.length}, captured locally, not AI-generated.`);
  return L.join('\n') + '\n';
}

export function download(filename: string, content: string, type = 'text/plain') {
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
