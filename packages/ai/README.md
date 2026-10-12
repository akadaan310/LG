# Optional AI task router

`@adequate/ai` exports platform-neutral TypeScript server functions. `createTaskRouter()` and `runTask()` default to an explicitly labeled local mock. They never read/write a database, authorize publication, run tools, transcribe speech, mutate input, or treat a proposal as LG's approved words. Use the authenticated application API; do not import service-token configuration into web/native clients.

```ts
import { createTaskRouter, createRemoteAdapter } from '@adequate/ai';

// Keep one router instance per server worker; its queue/circuit state is process-local.
const router = createTaskRouter(); // explicit mock labels; no remote calls
const result = await router.runTask({
  task: 'reflection.structure',
  input: { text: 'Words entered by the requester.' },
  context: {
    requesterId: authenticatedUser.id,
    roles: serverVerifiedRoles,
    consent: storedAiAssistanceConsent === true,
    authorizedSources: [],
  },
  signal: requestAbortSignal,
});
// On result.ok, show result.label with the editable proposal.
// On failure, show result.error.message; keep the original manual form and saved data.
```

The caller constructs context from an authenticated active account, verified role membership, current stored consent and RLS-scoped data. Never accept context, roles, requester ID or source ownership directly from the client request body. All tasks require explicit AI consent; `idea.organize`, `founder.draft`, `copy.adapt`, and `transcript.summarize` require editor/founder role. Application auth, revocation, durable per-user rate limits, trace/audit IDs and retention belong to the application API/database. The package's queue and circuit are additional local bounds, not durable rate limits.

| Task | Input | Validated output |
| --- | --- | --- |
| `reflection.structure` | `{text}` | `{title,sections:[{heading,text}]}` |
| `idea.organize` | `{text}` | `{title,summary,tags}` |
| `content.discover` | `{query,limit?}` | `{items:[{id,title,reason}]}` |
| `founder.draft` | `{brief,sourceIds?}` | `{draft,reviewRequired:true}` |
| `copy.adapt` | `{text,format:'short'|'plain'|'outline'}` | `{draft,reviewRequired:true}` |
| `transcript.summarize` | `{transcript}` | `{summary,chapters:[{title,startSeconds?}]}` |
| `recommendation.explain` | `{contentIds}` | `{explanation,sourceIds}` |

`taskContracts` exposes strict Zod input/output schemas. Text input is bounded at 20,000 characters. `authorizedSources` contains at most 40 `{id,title?,text,visibility:'published'|'private',ownerId?}` records, each up to 12,000 characters and at most 50,000 characters total. Private source `ownerId` must match the authenticated requester. The API should trim authorized excerpts before invoking inference, with a visible limitation when needed. Referenced source/content IDs must be supplied authorized records. No external retrieval or media ingestion occurs. Discovery is deterministic case-insensitive term matching over those sources, bypassing the model entirely; large catalog search belongs in the authorized database query.

Results are either `{ok:true,task,output,source,label,modelVersion?}` or `{ok:false,error:{code,message},manualFallback:true}`. Source is `mock`, `oracle`, or `deterministic`. Even a gateway configured in mock mode returns `source:'mock'`, so it cannot be silently presented as real model output. Labels always mark generated material unapproved. The mock copies requester text or creates a clearly labeled placeholder; it is not a meaningful language-model quality result.

The application defaults to `AI_MODE=disabled`; use `AI_MODE=mock` only for explicitly labeled local checks. The package itself defaults to mock so standalone development does not need Oracle access. Only after approved private gateway configuration (`AI_MODE=oracle`):

```ts
const router = createTaskRouter({
  adapter: createRemoteAdapter({
    endpoint: process.env.ORACLE_GATEWAY_URL!, // exact private https://.../v1/tasks endpoint
    token: process.env.ORACLE_GATEWAY_TOKEN!, // server-only protected secret
  }),
  timeoutMs: 15_000,
  maxConcurrent: 1,
  maxQueued: 8,
});
```

The adapter calls one configured HTTPS endpoint with redirect rejection, a bounded response, abort signal and strict output validation. It never falls back to an external provider. Default deadlines are 15 seconds, concurrency one, queue eight, breaker threshold three failures and cooldown 30 seconds. Cancellation and queue wait count toward the deadline. A noncooperative adapter retains its active slot until the underlying promise settles; timeouts cannot create unlimited underlying work. There are no retries. Error messages exclude raw adapter/runtime exceptions and private text; the package does not log payloads.

Schemas and the system prompt prohibit administrative fields/tools, permission/publish effects and assessment of personal worth or emotional vulnerability. Only authorized source text reaches the model; output remains a reviewable proposal. No mental-health diagnosis or hidden profiling feature exists. Founder/editor review and provenance checks remain mandatory before any persisted editorial use.

Verification: root `npm test` includes `tests/ai/router.test.ts`, plus gateway/benchmark `.mjs` tests; `npm run typecheck -w @adequate/ai`. For standalone Node 20+, use the installed `tsx` runner for TypeScript tests. Oracle deployment, actual model quality/latency and host recovery require the secure access handover and explicit approval documented in `docs/infrastructure/ORACLE_ACCESS_REQUEST.md`.
