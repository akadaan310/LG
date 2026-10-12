/** Platform-neutral native continuity logic. No member data is logged. */
import { preferencesSchema } from "@adequate/domain";
export function preferenceInput(value: {theme:unknown;ai_enabled:unknown;[field:string]:unknown}) {
  return preferencesSchema.parse({theme:value.theme,ai_enabled:value.ai_enabled});
}
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
export interface Draft {
  ownerId: string;
  body: string;
  editingId: string | null;
  updatedAt: string;
}
const accountId =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export class DraftRepository {
  private owner: string | null = null;
  private generation = 0;
  private tail: Promise<unknown> = Promise.resolve();
  constructor(private storage: StorageAdapter) {}
  private serial<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.tail.then(operation, operation);
    this.tail = next.catch(() => undefined);
    return next;
  }
  async activate(ownerId: string): Promise<void> {
    if (!accountId.test(ownerId))
      throw new Error("A valid signed in account is required.");
    this.owner = ownerId;
    this.generation++;
    await this.tail;
  }
  async read(): Promise<Draft | null> {
    const owner = this.owner,
      generation = this.generation;
    if (!owner) return null;
    await this.tail;
    const raw = await this.storage.getItem(`adequate.draft.${owner}`);
    if (!raw || owner !== this.owner || generation !== this.generation)
      return null;
    try {
      const draft = JSON.parse(raw) as Draft;
      return draft.ownerId === owner &&
        typeof draft.body === "string" &&
        draft.body.length <= 20000 &&
        (draft.editingId === null || accountId.test(draft.editingId)) &&
        typeof draft.updatedAt === "string"
        ? draft
        : null;
    } catch {
      return null;
    }
  }
  save(value: { body: string; editingId: string | null }): Promise<void> {
    const owner = this.owner,
      generation = this.generation;
    if (!owner)
      return Promise.reject(new Error("A signed in account is required."));
    if (value.body.length > 20000)
      return Promise.reject(
        new Error("Reflections are limited to 20,000 characters."),
      );
    return this.serial(async () => {
      if (this.owner !== owner || this.generation !== generation) return;
      const key = `adequate.draft.${owner}`;
      if (!value.body.trim()) {
        await this.storage.removeItem(key);
        return;
      }
      await this.storage.setItem(
        key,
        JSON.stringify({
          ownerId: owner,
          ...value,
          updatedAt: new Date().toISOString(),
        }),
      );
      if (this.owner !== owner || this.generation !== generation)
        await this.storage.removeItem(key);
    });
  }
  async discard(): Promise<void> {
    const owner = this.owner;
    if (owner)
      await this.serial(() =>
        this.storage.removeItem(`adequate.draft.${owner}`),
      );
  }
  async clearAccount(): Promise<void> {
    const owner = this.owner;
    this.owner = null;
    this.generation++;
    if (owner)
      await this.serial(() =>
        this.storage.removeItem(`adequate.draft.${owner}`),
      );
  }
}

/** Small encrypted SecureStore pieces avoid OS value-size ceilings. Manifest changes last. */
export function createChunkStorage(raw: StorageAdapter): StorageAdapter {
  let tail: Promise<unknown> = Promise.resolve(),
    sequence = 0;
  const serial = <T>(fn: () => Promise<T>) => {
    const next = tail.then(fn, fn);
    tail = next.catch(() => undefined);
    return next;
  };
  const readManifest = async (key: string) => {
    const value = await raw.getItem(`${key}.manifest`);
    if (!value) return null;
    try {
      const m = JSON.parse(value) as { version: string; count: number };
      return /^[0-9]+-[0-9]+$/.test(m.version) &&
        Number.isInteger(m.count) &&
        m.count > 0 &&
        m.count <= 1000
        ? m
        : null;
    } catch {
      return null;
    }
  };
  const removePieces = async (
    key: string,
    m: { version: string; count: number } | null,
  ) => {
    if (m)
      for (let i = 0; i < m.count; i++)
        await raw.removeItem(`${key}.${m.version}.${i}`);
  };
  return {
    getItem: (key) =>
      serial(async () => {
        const m = await readManifest(key);
        if (!m) return null;
        let value = "";
        for (let i = 0; i < m.count; i++) {
          const part = await raw.getItem(`${key}.${m.version}.${i}`);
          if (part === null) return null;
          value += part;
        }
        return value;
      }),
    setItem: (key, value) =>
      serial(async () => {
        if (value.length > 200000)
          throw new Error("The secure value exceeds the storage limit.");
        const old = await readManifest(key),
          version = `${Date.now()}-${++sequence}`,
          points = Array.from(value),
          count = Math.max(1, Math.ceil(points.length / 450));
        try {
          for (let i = 0; i < count; i++)
            await raw.setItem(
              `${key}.${version}.${i}`,
              points.slice(i * 450, (i + 1) * 450).join(""),
            );
          await raw.setItem(
            `${key}.manifest`,
            JSON.stringify({ version, count }),
          );
        } catch (error) {
          await removePieces(key, { version, count });
          throw error;
        }
        await removePieces(key, old);
      }),
    removeItem: (key) =>
      serial(async () => {
        const m = await readManifest(key);
        await raw.removeItem(`${key}.manifest`);
        await removePieces(key, m);
      }),
  };
}

export class MobileApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly traceId?: string,
  ) {
    super(message);
  }
}
export function validateEndpoint(
  value: string,
  allowInsecureLocalDev = false,
): URL {
  const url = new URL(value);
  if (url.username || url.password)
    throw new Error("Endpoint credentials must not be embedded in URLs.");
  const host = url.hostname.toLowerCase();
  const octets = host.split(".").map(Number);
  const ipv4 =
    octets.length === 4 &&
    octets.every((part) => Number.isInteger(part) && part >= 0 && part <= 255);
  const local =
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host === "[::1]" ||
    (ipv4 &&
      (octets[0] === 127 ||
        octets[0] === 10 ||
        (octets[0] === 192 && octets[1] === 168) ||
        (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)));
  if (
    url.protocol !== "https:" &&
    !(url.protocol === "http:" && local && allowInsecureLocalDev)
  )
    throw new Error(
      "Use HTTPS. Local HTTP requires an explicit development override.",
    );
  if (url.search || url.hash)
    throw new Error(
      "Endpoint URLs must not contain query strings or fragments.",
    );
  return url;
}
export function validatePublicKey(key: string): void {
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return;
  try {
    const parts = key.split(".");
    if (parts.length === 3) {
      const encoded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const claims = JSON.parse(
        atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "=")),
      ) as { role?: string };
      if (claims.role === "anon") return;
    }
  } catch {
    /* Invalid keys fail closed. */
  }
  throw new Error(
    "Use a Supabase public publishable or legacy anon key; server keys are forbidden in mobile builds.",
  );
}
export function createApiClient(options: {
  baseUrl: string;
  getToken: () => Promise<string | null>;
  transport?: typeof fetch;
  timeoutMs?: number;
  allowInsecureLocalDev?: boolean;
}) {
  const base = validateEndpoint(options.baseUrl, options.allowInsecureLocalDev);
  return async function api<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    if (!/^\/api\//.test(path) || path.includes("\\"))
      throw new MobileApiError("Use an application API path.", "INVALID_PATH");
    const controller = new AbortController();
    const failure = () =>
      new MobileApiError(
        "Connection unavailable. Your unfinished reflection stays on this device.",
        "NETWORK_UNAVAILABLE",
      );
    const timer = setTimeout(
      () => controller.abort(),
      options.timeoutMs ?? 15000,
    );
    const abort = () => controller.abort();
    init.signal?.addEventListener("abort", abort, { once: true });
    const aborted = new Promise<never>((_resolve, reject) =>
      controller.signal.addEventListener("abort", () => reject(failure()), {
        once: true,
      }),
    );
    const request = async () => {
      const token = await options.getToken(),
        headers = new Headers(init.headers);
      if (controller.signal.aborted) throw failure();
      headers.set("x-client-platform", "native");
      headers.set("origin", base.origin);
      if (token) headers.set("authorization", `Bearer ${token}`);
      if (init.body) headers.set("content-type", "application/json");
      let response: Response;
      try {
        response = await (options.transport ?? fetch)(
          new URL(path, base).href,
          { ...init, headers, signal: controller.signal, credentials: "omit" },
        );
      } catch {
        throw failure();
      }
      const result: unknown = await response.json().catch(() => null);
      const envelope = result as {
        data?: T;
        error?: { message?: string; code?: string };
        traceId?: string;
      } | null;
      if (!response.ok || envelope?.error)
        throw new MobileApiError(
          envelope?.error?.message ?? "The request could not be completed.",
          envelope?.error?.code ?? "REQUEST_FAILED",
          envelope?.traceId,
        );
      if (!envelope || typeof envelope !== "object" || !("data" in envelope))
        throw new MobileApiError(
          "The service returned an unexpected response.",
          "INVALID_RESPONSE",
        );
      return envelope.data as T;
    };
    try {
      return await Promise.race([request(), aborted]);
    } finally {
      clearTimeout(timer);
      init.signal?.removeEventListener("abort", abort);
    }
  };
}
export type AuthLink =
  | {
      kind: "session";
      access_token: string;
      refresh_token: string;
      recovery: boolean;
    }
  | { kind: "code"; code: string; recovery: boolean }
  | {
      kind: "otp";
      token_hash: string;
      type:
        | "signup"
        | "email"
        | "recovery"
        | "invite"
        | "magiclink"
        | "email_change";
      recovery: boolean;
    };
export function parseAuthLink(
  value: string,
  callback: string,
): AuthLink | null {
  if (value.length > 18000) return null;
  try {
    const actual = new URL(value),
      expected = new URL(callback);
    if (
      actual.protocol !== expected.protocol ||
      actual.hostname !== expected.hostname ||
      actual.port !== expected.port ||
      actual.pathname !== expected.pathname ||
      actual.username ||
      actual.password
    )
      return null;
    const params = new URLSearchParams(
      actual.hash ? actual.hash.slice(1) : actual.search.slice(1),
    );
    if (params.has("error") || params.has("error_code"))
      throw new MobileApiError(
        "The verification link is invalid or expired. Request another email.",
        "INVALID_LINK",
      );
    const recovery = params.get("type") === "recovery";
    if (params.get("code"))
      return { kind: "code", code: params.get("code")!, recovery };
    const type = params.get("type");
    if (
      params.get("token_hash") &&
      [
        "signup",
        "email",
        "recovery",
        "invite",
        "magiclink",
        "email_change",
      ].includes(type ?? "")
    )
      return {
        kind: "otp",
        token_hash: params.get("token_hash")!,
        type: type as Extract<AuthLink, { kind: "otp" }>["type"],
        recovery,
      };
    const access_token = params.get("access_token"),
      refresh_token = params.get("refresh_token");
    if (access_token && refresh_token)
      return { kind: "session", access_token, refresh_token, recovery };
    return null;
  } catch (error) {
    if (error instanceof MobileApiError) throw error;
    return null;
  }
}
