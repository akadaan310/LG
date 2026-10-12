'use client';

import { useCallback, useEffect, useState } from 'react';

export class ApiError extends Error {
  constructor(message: string, readonly code: string, readonly traceId?: string) { super(message); }
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    credentials: 'same-origin', cache: 'no-store', ...init,
    headers: { ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.error) throw new ApiError(result?.error?.message ?? 'The request could not be completed. Please try again.', result?.error?.code ?? 'REQUEST_FAILED', result?.traceId);
  if (!result || !('data' in result)) throw new ApiError('The service returned an unexpected response.', 'INVALID_RESPONSE');
  return result.data as T;
}
export function useResource<T>(path: string | null) {
  const [revision, setRevision] = useState(0);
  const key = `${path ?? ''}:${revision}`;
  const [result, setResult] = useState<{ key: string; path: string; data: T | null; error: Error | null } | null>(null);
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    let current = true;
    if (!path) return;
    api<T>(path).then((data) => { if (current) setResult({ key, path, data, error: null }); }).catch((error) => { if (current) setResult((previous) => ({ key, path, data: previous?.path === path ? previous.data : null, error })); });
    return () => { current = false; };
  }, [path, key]);
  return { data: path && result?.path === path ? result.data : null, error: path && result?.key === key ? result.error : null, loading: Boolean(path && result?.key !== key), reload };
}
export type Session = { user: { id: string; email: string } | null; role: 'member' | 'editor' | 'founder' | null; configured: boolean; signup_enabled?: boolean; features?: { pathways?: boolean } };
export type ContentRow = { id: string; title: string; slug: string; body: string; kind: string; audience: string; provenance: string; state: string; version: number; founder_approved: boolean; rights_verified: boolean; media?: MediaRow[] };
export type MediaRow = { id: string; content_id: string; rights_status: string; rights_notes: string; transcript?: string; chapters?: { title: string; start_seconds: number }[]; mime_type?: string; restricted?: boolean; scan_status?: string };
export type ReflectionRow = { id: string; body: string; created_at: string; updated_at: string };
