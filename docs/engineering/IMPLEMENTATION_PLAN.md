# ADEQUATE operational platform implementation plan

> For agentic workers: execute focused implementation tasks with test-first checks and independent review. User explicitly authorizes immediate implementation of this directive; no additional design-process approval is required.

**Goal:** Extend the existing approved design foundations into working authenticated web/native flows backed by locally verified Supabase policies, with optional inference and explicit owner gates.

**Architecture:** Preserve both design previews. A dynamic Next application and separate Expo product consume platform-neutral Zod contracts/tokens. User-scoped Supabase requests enforce RLS; atomic database publication functions protect state/version/audit invariants. AI uses consent, typed validation and a mock/private gateway adapter; no AI permissions or publishing.

**Stack:** TypeScript, Next.js, Expo/React Native, Supabase/PostgreSQL, Zod, Node test runner/tsx and Playwright.

**Spec:** `docs/source/ADEQUATE_CODEX_FULL_ENGINEERING_DIRECTIVE.md`.

## Global constraints

- Exact supplied dark/light tokens; Space Grotesk and IBM Plex Mono; 12/14/16/19/23/30/40/56/76 scale.
- Six A variants, B cross-direction slots, C navigation/cards/Studio; favorite, motion, terminology and other screens stay open.
- No invented LG text, quotations, biography, recordings, rights or prices. No charges, public launch or Oracle deployment.
- Remote Supabase requires a confirmed target. Service secrets stay server-side. Private content is never logged.
- Manual reflection/edit/search/playback remain useful when inference fails. Community disabled.

## Review focus

1. Member B guessing member A UUIDs: RLS must deny reads, edits, private media and reassignment.
2. An editor or AI trying to publish without founder approval/rights: atomic transition must deny.
3. Revoked/deleted users and stale access tokens: active-account guard must deny sensitive access.
4. Inference timeout/malformed output: graceful typed failure with no reflection mutation.
5. Empty libraries, missing exports/media and unconfigured services: honest actionable states, no synthetic substitutions.

## Tasks and interfaces

### 1. Shared contracts and application scaffold

Files: `packages/domain/src/{index,schemas,tokens}.ts`, `apps/platform/{package.json,next.config.mjs,tsconfig.json}`, root scripts/lockfile.
Produces: validated reflection/content/preferences/auth/media schemas; approved tokens; content state and provenance types. Tests reject blank/oversized input and unauthorized content state transitions. Run `npm test` and shared typecheck.
- [x] Write failing input/transition tests, run red, implement contracts, run green.

### 2. Persistence and authorization

Files: `supabase/config.toml`, CLI-created migrations, rollback, policy fixtures/test runner. Tables: profiles/preferences/roles/consents/entitlements; content/versions/tags/media; reflections/bookmarks/resume; pathways/progress; ideas/reviews/publications; AI tasks/flags/audit/rate counters. No community tables.
Produces: owner-scoped tables, immutable revisions/audit; `transition_content` and `rollback_content`; role authorization; private rights-aware storage. Local fixtures only. Tests exercise cross-user isolation, role escalation, anonymous drafts, stale approval, state machine and signed-media boundaries. Empty seed for deployment.
- [x] Author failing SQL security scenarios, generate migration through CLI, implement, run policy tests and rollback/reapply.

### 3. Application API

Files: `apps/platform/src/lib/**`, `src/app/api/**`, middleware; API_CONTRACTS doc. Consumes shared schemas and database tables. All JSON envelopes `{data}` or `{error:{code,message},traceId}`. Auth uses email/password verification, recovery, session refresh/logout; web cookies plus native bearer tokens. API paths defined below are stable.
Produces: content discovery/detail; member profile/preferences/consent/reflection CRUD/export, bookmarks/resume/progress, account deletion; Studio editing/version/review/publication; private media; gated optional AI.
- [x] Test auth/CSRF/request limits and input failures first; implement user-scoped queries and database workflow RPCs; run tests and real local HTTP integration.

### 4. Web experience

Files: `apps/platform/src/app` pages (excluding api), `src/components/**`, styles. Consumes HTTP contracts, no mock-content imports. Public routes `/`, `/story`, `/principle`, `/listen`, `/membership`, `/library`, `/content/[slug]`, `/privacy`, `/auth`; member `/today`, `/reflections`, `/saved`, `/pathways`, `/preferences`; `/studio`. Unapproved pages visibly flagged review and server-gated where appropriate. SEO, accessible audio, loading/error/empty states. No invented content.
- [x] Add behavioral/browser acceptance checks, implement selected structures and functional member/editor forms, verify responsive/keyboards and actual local accounts.

### 5. Optional inference and infrastructure

Files: `packages/ai/**`, `infrastructure/oracle/**`, infrastructure docs. `runTask({task,input,context})` returns validated labeled output without granting permissions. Seven specified contracts, deterministic discovery where possible, mock default, private TLS gateway deadlines/bounded queues/circuit breaker, no private logs. Prepare access request, secure deployment assets and CPU benchmark harness; deployment blocked.
- [x] Test consent/role/malformed responses/timeout/queue; implement adapters and gateway; run mock integration/benchmarks only and label those results.

### 6. Native continuity

Files: `apps/mobile/**`; keep native-preview intact. Shared contract/theme import, licensed bundled fonts, secure session persistence, deep links, authenticated Today/reflections/content/audio/preferences with reconnect/offline-safe private drafts. Do not reuse DOM components. Test typecheck/web export; real-device evidence explicitly blocked if unavailable.
- [x] Test draft ownership/reconnect logic; implement native app, verify build/export, record device gap.

### 7. Verification, CI and operations

Files: `.github/workflows`, `tests/**`, engineering architecture/threat/runbook/acceptance docs, `.env.example`. CI lint/typecheck/build/unit/RLS/integration/browser/security. Collect actual dependency scan, backup/rollback drill, local HTTP acceptance and screenshots. Independent whole-branch review and fixes, coherent commits. Acceptance scenario table reports PASS/FAIL/BLOCKED with exact evidence and next action.
- [x] Run baseline then new checks; review changes; record gates and verifiable limitations; commit stages without merging or launching.

## Stable HTTP contract

GET `/api/health`; GET `/api/content?q=&slug=` and `/api/content/:id` published/authorized content; GET `/api/session` account/role/configuration. POST `/api/auth/{signup,login,recover,logout}`, GET `/api/auth/callback`, POST `/api/auth/password`.

GET/PATCH `/api/profile`; GET/PUT `/api/preferences`; GET/PUT `/api/consents` `{purpose,granted}`; GET/POST `/api/reflections`, PATCH/DELETE `/api/reflections/:id`, GET `/api/export`; GET/POST `/api/bookmarks` `{content_id}`, DELETE `/api/bookmarks/:id`; GET/PUT `/api/playback` `{content_id,position_seconds}`; GET `/api/pathways`; PUT `/api/progress`; DELETE `/api/account` `{confirmation:"DELETE"}`.

GET/POST `/api/studio/content`, PATCH `/api/studio/content/:id`; POST `/api/studio/content/:id/transition` `{state,scheduled_at?}`; POST `/api/studio/content/:id/rollback` `{version}`; GET `/api/studio/content/:id/versions`; GET/POST `/api/studio/ideas`; GET `/api/studio/audit`; POST `/api/media/upload` multipart (file/content_id/rights_notes); PATCH `/api/media/:id` approval/transcript/chapters; GET `/api/media/:id/access`; POST `/api/ai` `{task,input}`. UI must use these exact paths or coordinate contract changes.

## Execution record

Local implementation and independent review completed. External approval/deployment/device requirements are tracked as BLOCKED or FAIL in ACCEPTANCE_REPORT, not inferred completed from these implementation checkboxes. Four integration regressions found in real Auth/API traffic were fixed; media publication concurrency, version identity and deletion lifecycle were also hardened after review.
