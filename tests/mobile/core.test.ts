import test from "node:test";
import assert from "node:assert/strict";
import {
  DraftRepository,
  createChunkStorage,
  createApiClient,
  parseAuthLink,
  validatePublicKey,
} from "../../apps/mobile/src/core";
const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
function memoryStorage() {
  const map = new Map<string, string>();
  return {
    map,
    async getItem(k: string) {
      return map.get(k) ?? null;
    },
    async setItem(k: string, v: string) {
      map.set(k, v);
    },
    async removeItem(k: string) {
      map.delete(k);
    },
  };
}

test("draft is restored for its owner and never presented to another account", async () => {
  const storage = memoryStorage(),
    drafts = new DraftRepository(storage);
  await drafts.activate(A);
  await drafts.save({ body: "A private unfinished thought", editingId: null });
  await drafts.activate(B);
  assert.equal(await drafts.read(), null);
  await drafts.activate(A);
  assert.equal((await drafts.read())?.body, "A private unfinished thought");
});
test("forged ownership in a persisted draft is rejected", async () => {
  const storage = memoryStorage(),
    drafts = new DraftRepository(storage);
  storage.map.set(
    `adequate.draft.${B}`,
    JSON.stringify({
      ownerId: A,
      body: "Private A text",
      editingId: null,
      updatedAt: "2026-10-12T00:00:00Z",
    }),
  );
  await drafts.activate(B);
  assert.equal(await drafts.read(), null);
});
test("logout clears private drafts and makes subsequent saves impossible", async () => {
  const storage = memoryStorage(),
    drafts = new DraftRepository(storage);
  await drafts.activate(A);
  await drafts.save({ body: "private", editingId: null });
  await drafts.clearAccount();
  assert.equal(storage.map.size, 0);
  await assert.rejects(
    drafts.save({ body: "late save", editingId: null }),
    /signed in/i,
  );
  await drafts.activate(A);
  assert.equal(await drafts.read(), null);
});
test("a pending save cannot restore a draft after logout", async () => {
  const storage = memoryStorage();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const delayed = {
    ...storage,
    async setItem(k: string, v: string) {
      await gate;
      await storage.setItem(k, v);
    },
  };
  const drafts = new DraftRepository(delayed);
  await drafts.activate(A);
  const save = drafts.save({ body: "queued private text", editingId: null });
  const logout = drafts.clearAccount();
  release();
  await Promise.all([save, logout]);
  assert.equal(storage.map.size, 0);
});
test("reconnect restores an unfinished draft without automatically submitting it", async () => {
  const storage = memoryStorage();
  const first = new DraftRepository(storage);
  await first.activate(A);
  await first.save({ body: "Offline text", editingId: null });
  const afterReconnect = new DraftRepository(storage);
  await afterReconnect.activate(A);
  assert.equal((await afterReconnect.read())?.body, "Offline text");
  assert.equal(storage.map.size, 1);
});
test("secure chunk storage handles long Unicode drafts and removes all pieces", async () => {
  const raw = memoryStorage(),
    storage = createChunkStorage(raw);
  const value = "Meaning ✨ ".repeat(4000);
  await storage.setItem("session", value);
  assert.equal(await storage.getItem("session"), value);
  assert.ok(
    [...raw.map.values()].every(
      (v) => new TextEncoder().encode(v).length <= 1800,
    ),
  );
  await storage.removeItem("session");
  assert.equal(raw.map.size, 0);
});
test("native API attaches bearer and unwraps actual response data", async () => {
  let observed: Request | undefined;
  const client = createApiClient({
    baseUrl: "https://api.example.test",
    getToken: async () => "a.b.c",
    transport: async (input, init) => {
      observed = new Request(input, init);
      return Response.json({ data: { id: "owned" } });
    },
  });
  assert.deepEqual(await client("/api/reflections"), { id: "owned" });
  assert.equal(observed!.headers.get("authorization"), "Bearer a.b.c");
  assert.equal(observed!.headers.get("x-client-platform"), "native");
});
test("API rejects arbitrary remote paths and malformed success envelopes", async () => {
  const client = createApiClient({
    baseUrl: "https://api.example.test",
    getToken: async () => null,
    transport: async () => Response.json({ fake: "value" }),
  });
  await assert.rejects(client("https://other.example/private"), /API path/i);
  await assert.rejects(client("/api/profile"), /unexpected response/i);
});
test("deep link parser permits exact app callback and recognizes recovery sessions", () => {
  const link = parseAuthLink(
    "adequate://auth/callback#access_token=a.b.c&refresh_token=secret&type=recovery",
    "adequate://auth/callback",
  );
  assert.deepEqual(link, {
    kind: "session",
    access_token: "a.b.c",
    refresh_token: "secret",
    recovery: true,
  });
  assert.equal(
    parseAuthLink(
      "adequate://other/callback#access_token=a.b.c&refresh_token=secret",
      "adequate://auth/callback",
    ),
    null,
  );
  assert.equal(
    parseAuthLink(
      "https://evil.example/?code=secret",
      "adequate://auth/callback",
    ),
    null,
  );
});

test("network errors preserve the local draft for manual reconnect", async () => {
  const storage = memoryStorage(),
    drafts = new DraftRepository(storage);
  await drafts.activate(A);
  await drafts.save({
    body: "Keep this during a connection failure",
    editingId: null,
  });
  const client = createApiClient({
    baseUrl: "https://api.example.test",
    getToken: async () => "a.b.c",
    transport: async () => {
      throw new TypeError("network connection lost");
    },
  });
  await assert.rejects(
    client("/api/reflections", {
      method: "POST",
      body: JSON.stringify({ body: "Keep this during a connection failure" }),
    }),
    (error) =>
      error instanceof Error && /Connection unavailable/.test(error.message),
  );
  assert.equal(
    (await drafts.read())?.body,
    "Keep this during a connection failure",
  );
});
test("an in-flight secure write cannot survive logout after it has started", async () => {
  const storage = memoryStorage();
  let release!: () => void, started!: () => void;
  const gate = new Promise<void>((resolve) => {
      release = resolve;
    }),
    begin = new Promise<void>((resolve) => {
      started = resolve;
    });
  const delayed = {
    ...storage,
    async setItem(k: string, v: string) {
      started();
      await gate;
      await storage.setItem(k, v);
    },
  };
  const drafts = new DraftRepository(delayed);
  await drafts.activate(A);
  const save = drafts.save({ body: "Private active write", editingId: null });
  await begin;
  const clear = drafts.clearAccount();
  release();
  await Promise.all([save, clear]);
  assert.equal(storage.map.size, 0);
});
test("timed-out API requests fail without indefinite busy state", async () => {
  let aborted = false;
  const client = createApiClient({
    baseUrl: "https://api.example.test",
    getToken: async () => null,
    timeoutMs: 10,
    transport: async (_url, init) =>
      new Promise((_resolve, reject) => {
        const watchdog = setTimeout(
          () => reject(new Error("safety watchdog")),
          100,
        );
        init?.signal?.addEventListener("abort", () => {
          aborted = true;
          clearTimeout(watchdog);
          reject(new Error("aborted"));
        });
      }),
  });
  await assert.rejects(client("/api/session"), /Connection unavailable/);
  assert.equal(
    aborted,
    true,
    "transport must actually be cancelled by the request deadline",
  );
});

test("plaintext remote APIs are rejected before retrieving credentials", async () => {
  let accessed = false;
  assert.throws(
    () =>
      createApiClient({
        baseUrl: "http://remote.example",
        getToken: async () => {
          accessed = true;
          return "private.token.value";
        },
      }),
    /HTTPS/,
  );
  assert.equal(accessed, false);
});
test("API URL embedded credentials are rejected", () => {
  assert.throws(
    () =>
      createApiClient({
        baseUrl: "https://operator:secret@api.example.test",
        getToken: async () => null,
      }),
    /credentials/,
  );
});
test("local HTTP requires explicit development override and never permits remote HTTP", () => {
  assert.throws(
    () =>
      createApiClient({
        baseUrl: "http://127.0.0.1:3001",
        getToken: async () => null,
      }),
    /HTTPS/,
  );
  assert.doesNotThrow(() =>
    createApiClient({
      baseUrl: "http://192.168.1.42:3001",
      allowInsecureLocalDev: true,
      getToken: async () => null,
    }),
  );
  assert.throws(
    () =>
      createApiClient({
        baseUrl: "http://remote.example",
        allowInsecureLocalDev: true,
        getToken: async () => null,
      }),
    /HTTPS/,
  );
});

test("mobile rejects both current and legacy server keys", () => {
  assert.throws(
    () => validatePublicKey("sb_" + "secret_" + "a_server_key"),
    /public/,
  );
  const server = [
    "eyJhbGciOiJIUzI1NiJ9",
    Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url"),
    "signature",
  ].join(".");
  assert.throws(() => validatePublicKey(server), /public/);
  const anon = [
    "eyJhbGciOiJIUzI1NiJ9",
    Buffer.from(JSON.stringify({ role: "anon" })).toString("base64url"),
    "signature",
  ].join(".");
  assert.doesNotThrow(() => validatePublicKey(anon));
  assert.doesNotThrow(() =>
    validatePublicKey("sb_publishable_a_public_key_for_testing"),
  );
});
