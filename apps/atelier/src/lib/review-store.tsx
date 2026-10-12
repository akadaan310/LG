'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import type { ConceptId } from '@adequate/design-tokens';
import type { Author, DecisionStatus } from '@adequate/mock-content';

export const STORAGE_KEY = 'adequate.atelier.review.v1';
export const PREFS_KEY = 'adequate.atelier.prefs.v1';
export const SCHEMA = 'adequate.design-review';
export const SCHEMA_VERSION = 1;

export type DecisionLevel =
  | 'concept' // overall reaction to a whole direction
  | 'favorite' // the favoured concept overall
  | 'hybrid' // mix-and-match slot → concept
  | 'screen' // a screen variant within a concept
  | 'feature' // a signature moment / feature within a concept
  | 'component' // an individual component within a concept
  | 'nomenclature' // a brand term
  | 'proposal'; // a Founder Voice proposal

export interface Decision {
  /** Deterministic, sequential id: d-0001, d-0002 … */
  id: string;
  seq: number;
  timestamp: string;
  author: Author;
  level: DecisionLevel;
  conceptId: ConceptId | null;
  /** Screen id, slot id, component id, term id, proposal id, or "overall" */
  targetId: string;
  /** Screen variant id (e.g. public.home@v2) when relevant */
  variantId: string | null;
  status: DecisionStatus;
  emotionTags: string[];
  comment: string;
  /** Free value, e.g. a proposed new name for a term */
  value: string | null;
}

export interface Proposal {
  /** Deterministic, sequential id: p-0001 … */
  id: string;
  createdAt: string;
  author: Author;
  text: string;
  source: 'typed-or-pasted-locally';
  impact: string;
  impactNote: string;
  surfaceId: string;
  conceptId: ConceptId | null;
  provenance: string;
}

export interface ReviewState {
  schema: typeof SCHEMA;
  schemaVersion: typeof SCHEMA_VERSION;
  createdAt: string;
  updatedAt: string;
  author: Author;
  nextSeq: number;
  nextProposal: number;
  decisions: Decision[];
  redo: Decision[];
  proposals: Proposal[];
}

export type DecisionInput = Omit<Decision, 'id' | 'seq' | 'timestamp' | 'author' | 'emotionTags' | 'comment' | 'value' | 'variantId' | 'conceptId'> &
  Partial<Pick<Decision, 'emotionTags' | 'comment' | 'value' | 'variantId' | 'conceptId'>>;

const pad = (n: number) => String(n).padStart(4, '0');

export function emptyState(now = new Date().toISOString()): ReviewState {
  return {
    schema: SCHEMA,
    schemaVersion: SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    author: 'LG',
    nextSeq: 1,
    nextProposal: 1,
    decisions: [],
    redo: [],
    proposals: [],
  };
}

/**
 * The "slot" a decision occupies. The latest decision in a slot is its current status;
 * earlier ones remain visible in history.
 */
export function decisionKey(d: Pick<Decision, 'level' | 'conceptId' | 'targetId' | 'variantId'>): string {
  if (d.level === 'hybrid' || d.level === 'favorite' || d.level === 'nomenclature' || d.level === 'proposal') {
    return `${d.level}|${d.targetId}`;
  }
  return `${d.level}|${d.conceptId ?? '-'}|${d.targetId}|${d.variantId ?? '-'}`;
}

type Action =
  | { type: 'hydrate'; state: ReviewState }
  | { type: 'decide'; input: DecisionInput }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'author'; author: Author }
  | { type: 'propose'; proposal: Omit<Proposal, 'id' | 'createdAt' | 'author' | 'source' | 'provenance'> }
  | { type: 'removeProposal'; id: string }
  | { type: 'reset' };

function reducer(state: ReviewState, action: Action): ReviewState {
  const now = new Date().toISOString();
  switch (action.type) {
    case 'hydrate':
      return action.state;
    case 'decide': {
      const i = action.input;
      const d: Decision = {
        id: `d-${pad(state.nextSeq)}`,
        seq: state.nextSeq,
        timestamp: now,
        author: state.author,
        level: i.level,
        conceptId: i.conceptId ?? null,
        targetId: i.targetId,
        variantId: i.variantId ?? null,
        status: i.status,
        emotionTags: i.emotionTags ?? [],
        comment: i.comment ?? '',
        value: i.value ?? null,
      };
      return { ...state, updatedAt: now, nextSeq: state.nextSeq + 1, decisions: [...state.decisions, d], redo: [] };
    }
    case 'undo': {
      if (!state.decisions.length) return state;
      const last = state.decisions[state.decisions.length - 1];
      return { ...state, updatedAt: now, decisions: state.decisions.slice(0, -1), redo: [last, ...state.redo] };
    }
    case 'redo': {
      if (!state.redo.length) return state;
      const [first, ...rest] = state.redo;
      return { ...state, updatedAt: now, decisions: [...state.decisions, first], redo: rest };
    }
    case 'author':
      return { ...state, author: action.author };
    case 'propose': {
      const p: Proposal = {
        ...action.proposal,
        id: `p-${pad(state.nextProposal)}`,
        createdAt: now,
        author: state.author,
        source: 'typed-or-pasted-locally',
        provenance: `Captured locally in the Atelier by ${state.author}. Not AI-generated. Not yet approved for public use.`,
      };
      return { ...state, updatedAt: now, nextProposal: state.nextProposal + 1, proposals: [...state.proposals, p] };
    }
    case 'removeProposal':
      return { ...state, updatedAt: now, proposals: state.proposals.filter((p) => p.id !== action.id) };
    case 'reset':
      return { ...emptyState(now), author: state.author };
  }
}

const AUTHORS = new Set(['LG', 'Engineer']);
const STATUSES = new Set(['love', 'maybe', 'not-for-me', 'approved', 'rejected', 'deferred']);
const LEVELS = new Set(['concept', 'favorite', 'hybrid', 'screen', 'feature', 'component', 'nomenclature', 'proposal']);

/** Validates an imported or stored review file. Throws a friendly error on anything unexpected. */
export function parseReviewState(raw: unknown): ReviewState {
  const fail = (m: string): never => {
    throw new Error(`This file can't be loaded: ${m}`);
  };
  if (!raw || typeof raw !== 'object') fail('it is not a review file.');
  const r = raw as Record<string, unknown>;
  // Accept either a bare state or a full design-decisions.json export with a `state` field.
  const s = (r.state && typeof r.state === 'object' ? r.state : r) as Record<string, unknown>;
  if (s.schema !== SCHEMA) fail('it was not exported from the ADEQUATE Design Atelier.');
  if (s.schemaVersion !== SCHEMA_VERSION) fail(`unsupported version ${String(s.schemaVersion)}.`);
  if (!Array.isArray(s.decisions) || !Array.isArray(s.proposals)) fail('decisions or proposals are missing.');
  for (const d of s.decisions as Decision[]) {
    if (typeof d.id !== 'string' || typeof d.seq !== 'number') fail('a decision is missing its id.');
    if (!AUTHORS.has(d.author)) fail(`decision ${d.id} has an unknown author.`);
    if (!STATUSES.has(d.status)) fail(`decision ${d.id} has an unknown status.`);
    if (!LEVELS.has(d.level)) fail(`decision ${d.id} has an unknown level.`);
    if (typeof d.timestamp !== 'string' || typeof d.targetId !== 'string') fail(`decision ${d.id} is incomplete.`);
  }
  const decisions = s.decisions as Decision[];
  const proposals = s.proposals as Proposal[];
  const maxSeq = decisions.reduce((m, d) => Math.max(m, d.seq), 0);
  const maxProp = proposals.reduce((m, p) => Math.max(m, Number(p.id.slice(2)) || 0), 0);
  return {
    schema: SCHEMA,
    schemaVersion: SCHEMA_VERSION,
    createdAt: String(s.createdAt ?? new Date().toISOString()),
    updatedAt: String(s.updatedAt ?? new Date().toISOString()),
    author: AUTHORS.has(s.author as string) ? (s.author as Author) : 'LG',
    nextSeq: Math.max(Number(s.nextSeq) || 0, maxSeq + 1),
    nextProposal: Math.max(Number(s.nextProposal) || 0, maxProp + 1),
    decisions,
    redo: Array.isArray(s.redo) ? (s.redo as Decision[]) : [],
    proposals,
  };
}

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode) — review continues in memory */
  }
}

interface ReviewApi {
  state: ReviewState;
  hydrated: boolean;
  storageAvailable: boolean;
  current: Map<string, Decision>;
  decide: (input: DecisionInput) => void;
  undo: () => void;
  redo: () => void;
  setAuthor: (a: Author) => void;
  propose: (p: Omit<Proposal, 'id' | 'createdAt' | 'author' | 'source' | 'provenance'>) => void;
  removeProposal: (id: string) => void;
  importState: (s: ReviewState) => void;
  reset: () => void;
  get: (k: Pick<Decision, 'level' | 'conceptId' | 'targetId' | 'variantId'>) => Decision | undefined;
}

const ReviewContext = createContext<ReviewApi | null>(null);

export function ReviewProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => emptyState('1970-01-01T00:00:00.000Z'));
  const [hydrated, setHydrated] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);

  useEffect(() => {
    try {
      window.localStorage.setItem('__adequate_probe', '1');
      window.localStorage.removeItem('__adequate_probe');
    } catch {
      setStorageAvailable(false);
    }
    const raw = safeGet(STORAGE_KEY);
    let next = emptyState();
    if (raw) {
      try {
        next = parseReviewState(JSON.parse(raw));
      } catch {
        /* corrupt local copy — start fresh rather than invent data */
      }
    }
    dispatch({ type: 'hydrate', state: next });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) safeSet(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const current = useMemo(() => {
    const m = new Map<string, Decision>();
    for (const d of state.decisions) m.set(decisionKey(d), d);
    return m;
  }, [state.decisions]);

  const decide = useCallback((input: DecisionInput) => dispatch({ type: 'decide', input }), []);
  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const redo = useCallback(() => dispatch({ type: 'redo' }), []);
  const setAuthor = useCallback((author: Author) => dispatch({ type: 'author', author }), []);
  const propose = useCallback<ReviewApi['propose']>((proposal) => dispatch({ type: 'propose', proposal }), []);
  const removeProposal = useCallback((id: string) => dispatch({ type: 'removeProposal', id }), []);
  const importState = useCallback((s: ReviewState) => dispatch({ type: 'hydrate', state: s }), []);
  const reset = useCallback(() => dispatch({ type: 'reset' }), []);
  const get = useCallback<ReviewApi['get']>((k) => current.get(decisionKey(k)), [current]);

  const api = useMemo<ReviewApi>(
    () => ({ state, hydrated, storageAvailable, current, decide, undo, redo, setAuthor, propose, removeProposal, importState, reset, get }),
    [state, hydrated, storageAvailable, current, decide, undo, redo, setAuthor, propose, removeProposal, importState, reset, get],
  );

  return <ReviewContext.Provider value={api}>{children}</ReviewContext.Provider>;
}

export function useReview(): ReviewApi {
  const ctx = useContext(ReviewContext);
  if (!ctx) throw new Error('useReview must be used inside ReviewProvider');
  return ctx;
}
