# Operational HTTP contracts

The Next platform serves the paths below through a dynamic Node route handler. Success is `{ "data": ... }`. Failure is `{ "error": { "code": "...", "message": "..." }, "traceId": "uuid" }`. Every response has `Cache-Control: private, no-store` and `X-Trace-Id`. Logs contain trace, method, operation, status and latency only. Database/provider error bodies and submitted private text are never logged.

The API uses a publishable Supabase key and the requester's session for all account, content and storage operations. Configuration accepts `sb_publishable_...` keys or a legacy JWT whose role is `anon`; secret/service-role keys in public configuration are rejected. It verifies `auth.getUser()`, calls `active_account()` and reads `user_roles` from the database. User-editable metadata grants no privileges. RLS remains authoritative for ownership, paid member entitlements, revoked/deleted sessions and editorial content.

## Sessions and mutation protection

- Web: HttpOnly, SameSite=Lax cookies, Secure when HTTPS. The Next `proxy.ts` refreshes the cookie session. Do not cache authenticated responses.
- Native: `Authorization: Bearer <access token>`. The token is validated by Supabase, followed by the same active-account and role checks. The native app owns secure token storage and refresh through Supabase.
- Cookie mutations require `Origin` equal to the canonical application origin and reject `Sec-Fetch-Site: cross-site`. A syntactically valid bearer request is exempt from the origin check and still must pass authentication. Initial native POST login/signup/recovery can omit Origin only with `X-Client-Platform: native`, JSON content type, no Cookie header and no cross-site fetch signal. An explicit browser Origin is checked normally; the native header never exempts cookie-bearing or other non-bearer mutations.
- Set `APP_ORIGIN` to the canonical platform origin. Auth operations reject mismatched request origins; verification/recovery redirects use this origin. No broad CORS allowance is enabled.
- JSON bodies require `application/json`, are streamed with a 256,000-byte limit and then parsed with strict Zod contracts. Actual bytes are checked even when Content-Length is absent or false.
- Auth attempts use a separate server-only service client exclusively for `consume_auth_rate_limit`; it never reads or writes account/content tables. The rate key is an HMAC of operation, normalized email and client address. `AUTH_RATE_LIMIT_SALT` and the service key are required; auth fails closed when durable rate controls are unavailable. `TRUST_PROXY_HEADERS=true` is appropriate only behind a proxy that replaces incoming forwarding headers.
- Authenticated API requests have durable per-account limits: 120/minute, mutations 30/minute, AI 5/minute, upload 5/hour, export 3/hour, deletion 2/hour. A rate denial returns 429 and Retry-After. Supabase auth applies its own provider limits too.

## Stable paths

All input objects are strict: extra fields, especially owner IDs, permissions and publication flags, are rejected. UUIDs identify records; bookmarks are identified by `content_id` because the database uses a composite key.

| Method / path | Input | `data` / authorization |
| --- | --- | --- |
| GET `/api/health` | — | `{status:"ok",configured,community_enabled:false}`; health does not claim database readiness |
| GET `/api/session` | — | `{user:{id,email}\|null,role:"member"\|"editor"\|"founder"\|null,configured,signup_enabled,features:{pathways},ai:{configured,mock}}` |
| POST `/api/auth/signup` | `{email,password}`; password 12–128 chars | `{user,verification_required}`; 201; blocked unless `AGE_POLICY_APPROVED=true` |
| POST `/api/auth/login` | `{email,password}` | `{user,verification_required}`; authenticated cookies for web |
| POST `/api/auth/recover` | `{email}` | Generic message whether or not the email exists |
| GET `/api/auth/callback` | `code` (PKCE), or `token_hash` and an allowed Supabase OTP `type`; optional `next` | 303 same-origin redirect; recovery opens `/auth?mode=password`; external/encoded-slash redirects denied |
| POST `/api/auth/password` | `{password}` | `{updated:true}`; active authenticated account |
| POST `/api/auth/logout` | — | `{signed_out:true}`; global Supabase session revocation |
| GET `/api/content?q=&slug=` | bounded query and slug | Array of published, rights-verified, founder-approved non-placeholder content visible under RLS; latest 100 |
| GET `/api/content/:id` | — | Content object plus `media` array; member/public see cleared, published, verified material; staff may inspect authorized drafts and pending media metadata; 404 when not authorized |
| GET `/api/profile` | — | `{id,display_name,onboarding_completed_at,created_at}`; owner |
| PATCH `/api/profile` | `{display_name,onboarding_completed?}` | Profile; boolean maps to timestamp; owner |
| GET `/api/preferences` | — | `{user_id,theme,ai_enabled,updated_at}`; owner |
| PUT `/api/preferences` | `{theme:"system"\|"dark"\|"light",ai_enabled}` | Preferences; owner |
| GET `/api/consents` | — | Array of `{purpose,granted,updated_at}`; owner |
| PUT `/api/consents` | `{purpose:"ai_processing"\|"external_ai"\|"analytics",granted}` | Stored consent; owner |
| GET `/api/reflections` | — | Owner's reflections, newest 100; body/structured/created/updated fields |
| POST `/api/reflections` | `{body}`; nonblank, ≤20,000 chars | New private reflection; 201 |
| PATCH `/api/reflections/:id` | `{body}` | Updated owner reflection; cross-user or unavailable ID gives 404 |
| DELETE `/api/reflections/:id` | — | `{deleted:true}`; owner only |
| GET `/api/export` | — | `{exported_at,format_version:1,profiles,preferences,consents,reflections,bookmarks,playback_progress,pathway_progress}`; attachment JSON |
| GET `/api/bookmarks` | — | Array `{content_id,created_at,content}`; nested content remains RLS-scoped |
| POST `/api/bookmarks` | `{content_id}` | Upserted bookmark; 201; only readable content |
| DELETE `/api/bookmarks/:content_id` | — | `{deleted:true}`; owner key |
| GET `/api/playback` | — | Array of owner `{user_id,content_id,position_seconds,updated_at}` |
| PUT `/api/playback` | `{content_id,position_seconds}`; 0–86,400 | Owner resume row; content authorization enforced |
| GET `/api/pathways` | — | Array `{id,title,description,pathway_items:[{content_id,position,content}],completed_content_ids:string[]}`; completion comes from owner-scoped progress; active member; blocked until `PATHWAYS_REVIEW_APPROVED=true` |
| PUT `/api/progress` | `{pathway_id,content_id,completed}` | Progress row or `{completed:false}`; owner and readable published pathway/content |
| DELETE `/api/account` | `{confirmation:"DELETE"}` | `{deleted:true}`; private-record purge, profile tombstone and session revocation through atomic database RPC |
| GET `/api/studio/content` | — | Draft/published content array plus `media_assets`; staff only |
| POST `/api/studio/content` | `{title,slug,body,kind,audience,provenance}` | Draft row; 201; staff only |
| PATCH `/api/studio/content/:id` | Any nonempty subset of draft fields, optionally `rights_verified` | Updated content/version; only founder may change rights verification; content edits invalidate approval atomically |
| POST `/api/studio/content/:id/transition` | `{state,scheduled_at?}` | Content returned by atomic transition RPC; founder required for approved/scheduled/published; DB enforces version, rights, scans and state edge |
| POST `/api/studio/content/:id/rollback` | `{version}` | Prior snapshot becomes a new unapproved draft revision; staff only |
| GET `/api/studio/content/:id/versions` | — | Array `{content_id,version,snapshot,created_by,created_at}`; latest 100; staff only |
| GET `/api/studio/ideas` | — | Owner's Studio ideas; staff only |
| POST `/api/studio/ideas` | `{body,ai_assisted?}` | Idea with explicit structured provenance/review metadata; 201; staff only |
| GET `/api/studio/audit` | — | Latest 100 immutable editorial metadata events; staff only |
| POST `/api/media/upload` | Multipart `file`, `content_id`, nonblank `rights_notes` (≤4,000 chars) | `{id,content_id,rights_status:"pending",scan_status:"pending",message}`; 201; staff only |
| PATCH `/api/media/:id` | Optional `rights_status`, `rights_notes`, `transcript`, `chapters`, `restricted` | Staff metadata including rights notes; only founder changes rights status or audience restriction |
| GET `/api/media/:id/access` | — | `{url,expires_at}`; 120-second signed URL produced by requester-scoped storage; pending/unverified and unauthorized media denied |
| POST `/api/ai` | `{task,input}` | Router discriminated result described below; active user, preferences and consent, staff for editorial tasks |

Unconfigured account services return 503 `SERVICE_UNAVAILABLE`. Unconfigured session returns `configured:false`, `user:null` and disabled flags. Typical failures are `INVALID_INPUT`, `AUTH_REQUIRED`, `ACCOUNT_INACTIVE`, `ROLE_REQUIRED`, `CSRF_REJECTED`, `RATE_LIMITED`, `NOT_FOUND`, `OPERATION_DENIED`, `REVIEW_PENDING` and `AGE_POLICY_PENDING`. Provider/database messages are replaced with safe messages. An export pages each owner table in batches below the PostgREST result cap; more than 10,000 rows in any table returns an explicit large-export error and operator action.

## Native auth

Native auth requests send `X-Client-Platform: native`. Successful login/signup adds `session:{access_token,refresh_token,expires_at}\|null`. The server uses a nonpersistent implicit auth client for native signup/recovery, while web uses cookie PKCE. Set deployment-owned `NATIVE_AUTH_REDIRECT_URL=adequate://auth/callback` and add that exact URL to Supabase Auth's redirect allowlist. Client-supplied arbitrary redirects are not accepted. The app validates the deep-link target before consuming session fragments or OTP tokens; it persists tokens in secure storage, refreshes sessions and clears private local state on logout/deletion.

## Media quarantine and rights

Uploads are limited to 25 MiB plus bounded form overhead. MP3/WAV/Ogg/M4A MIME claims must match file signatures; filenames never become storage paths. The API creates owned pending metadata before uploading into the private `recordings` bucket at `<user_id>/<uuid>.<verified extension>`. No remote URL ingestion is implemented.

Signature checks are not malware scanning. An authorized scanner/operator must set scan status to clean through the service-only pipeline. A browser or editor cannot promote scan status. Founder rights verification remains a separate action. Published public **nonrestricted** recordings can obtain a signed URL anonymously through anon RLS; restricted recordings require their appropriate active account/entitlement. Even owners cannot obtain an API URL for pending scans or unverified rights. Metadata responses omit storage paths.

Account deletion attempts owned object removal before removing authorizing metadata. Founder/editor accounts must transfer editorial ownership with the operator before deletion; the API checks this before removing any objects. Published linked recordings may require operator review to preserve the approved publication/audit chain; the API reports this instead of declaring a completed purge. Storage cleanup and retention operations are documented in the database/operations handoff. Signed URLs are short-lived capabilities: session revocation blocks new URL issuance but an already issued URL can remain valid until its 120-second expiry unless its object is removed.

## Optional inference

`AI_MODE=disabled` is the server default. With consent but without a configured router, the API returns `{data:{ok:false,error:{code:"UNAVAILABLE",message:...},manualFallback:true}}`; manual features remain available. `AI_MODE=mock` returns visibly labeled test proposals and never claims LG approval. `AI_MODE=oracle` requires a configured HTTPS private gateway URL and server token; no external fallback is enabled.

All tasks require both `preferences.ai_enabled=true` and granted `ai_processing` consent. The server constructs requester ID, roles and authorized published sources from RLS queries. Clients cannot supply authorization context. Role-gated tasks are `idea.organize`, `founder.draft`, `copy.adapt` and `transcript.summarize`. Tasks accept the schemas exported by `@adequate/ai`:

| Task | Input |
| --- | --- |
| `reflection.structure` | `{text}` |
| `idea.organize` | `{text}` |
| `content.discover` | `{query,limit?}`; deterministic |
| `founder.draft` | `{brief,sourceIds?}` |
| `copy.adapt` | `{text,format:"short"\|"plain"\|"outline"}` |
| `transcript.summarize` | `{transcript}` |
| `recommendation.explain` | `{contentIds}` |

Success is `{ok:true,task,output,source,label,modelVersion?}`. Failure is `{ok:false,error:{code,message},manualFallback:true}`. Retrieval sources are published authorized content, ≤20 rows, ≤12,000 chars per source and ≤50,000 total. Explicit source IDs must belong to this set. Inference never grants permissions, writes a reflection/draft, changes rights, or publishes content. Only task/status/provider/trace metadata is recorded. Proposed AI text stays visibly labeled when the user chooses to copy it into manual work.

These contracts do not authorize remote Supabase migration, Oracle deployment, live billing, public launch or an invented age policy. Review and service flags are disabled unless explicitly configured by the owner; isolated local acceptance settings are not production approval.

## Reproducible API checks

`npm test` includes the pure API guards and request-handler tests. `npx tsx --test tests/api/native-http-check.mts` separately starts a loopback HTTP harness using the actual API source and isolated local Supabase credentials from `apps/platform/.env.local` (or `ADEQUATE_LOCAL_ENV_FILE`). It refuses a remote Supabase URL, creates and cleans a synthetic confirmed test account, verifies native login without Origin returns access/refresh tokens with no cookie, verifies bearer logout revokes subsequent private access, and verifies browser cross-origin/cookie requests cannot use the native exemption. It prints statuses/test results only, never credentials or session tokens. This proves local HTTP behavior; it does not claim a physical-device test or a production deployment.
