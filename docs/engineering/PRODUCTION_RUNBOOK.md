# Production runbook — preparation, not launch authorization

## Build and local rehearsal

Node 24, npm and Docker are required. `npm ci`; `npm run check` verifies retained Atelier. `npm run product:typecheck`, `npm run product:lint`, `npm test`, `npm run test:gateway`, `npm run verify:source`, `npm audit --omit=dev --audit-level=high`, `npm run product:build`. Start product with `npm run product:dev` or `npm run product:start` (port 3100). See DATABASE.md for local stack and security tests. `.env.example` contains no credentials. Missing backend configuration produces honest unavailable states.

Native: install separately with `npm ci --prefix apps/mobile --no-workspaces`, typecheck and `npm run export:web --prefix apps/mobile`. Physical-device steps and limits are in MOBILE.md. Native preview export remains separate.

## Environment and release gates

Use distinct development/staging/production Supabase projects; confirm the target ref before linking or applying migrations. Keep publishable keys client-side and all inference/scanner/billing credentials server-side. Rotate secrets through the hosting secret manager. Keep signup blocked until an age policy and consent language are approved; Auth configuration must enforce the same gate against direct SDK signups. Configure verified email delivery, allowed redirect URLs, recovery and MFA for privileged roles. Grant the first founder through a reviewed administrator SQL operation, never user metadata.

Before release: review source exports and screenshot differences; clear content/identity/rights approvals; integrate upload antivirus scanning; define retention and deletion deadlines; approve any paid billing; validate devices/accessibility; run production restore and deployment rehearsals; obtain explicit public-launch authorization. CI configuration exists; a local passing suite does not claim GitHub Actions has run.

## Migrations, backups and rollback

Run migrations first on a disposable local database, then confirmed staging. Run RLS tests before app rollout. Snapshot database and private object manifests before migration; avoid sensitive records in build artifacts. Use `pg_dump` with a secret-manager connection string, encrypt backups, and define owner-approved retention. Restore into a separate staging project and check row counts, RLS and rights states before promoting. Supplied rollback SQL is for isolated rehearsal; production rollback may destroy newly written data and requires a reviewed recovery decision. Prefer forward fixes after traffic starts.

## Monitoring and incidents

Probe `/api/health` and authorized critical flows; readiness must include Auth/database response, not only process liveness. Structured API trace IDs support correlation without private payloads. Configure the host's error tracking and dashboards for HTTP error rate/latency, database errors, web vitals and storage access; actual alert destinations/credentials are not supplied. Oracle preparation includes liveness/readiness and CPU/RAM/disk/queue metrics. No deployed dashboard or alert is claimed.

On elevated failures: capture trace IDs and metadata; disable optional inference first; keep manual drafts/reflections intact. Deny publication during rights/security incidents. Rotate compromised service credentials, revoke affected sessions, restore only after validating backups and audit history. Preserve audit trails and notify owners through their approved incident process; no messaging destination is assumed.

## Costs and ceilings

No new paid resources or live charges were created. Actual hosting invoices and traffic are unavailable, so no monthly cost estimate is represented as measured. Oracle's approximately 24 GB RAM is user-reported; CPU, disk and throughput are unknown. Upload limits, queue/deadline bounds and database counter windows are implemented ceilings; tune only from measured staging/VM results. Supabase/hosting plan quotas and backup coverage must be checked on the confirmed target before launch.

## Background workers

Install and maintain ClamAV/signature updates before running `node --env-file=apps/platform/.env.local scripts/scan-recordings.mjs`. It writes private temporary files with mode0600, deletes them after scanning, and only treats scanner exit0 as clean; infected exits are rejected and missing/error scanners remain pending. This session tested the exit protocol and quarantine but had no installed antivirus/signatures, so real malware-engine validation is blocked. Schedule this operator service along with `scripts/publish-scheduled.mjs` and `scripts/delete-private-media.mjs`; all require server-only keys on a confirmed target. No cron or production worker was deployed here.

For a cold local browser check run `npm run product:build` before `npm run test:e2e`; the default test server uses the production build. Development uses `.next-dev`, separate from `.next`, so release builds do not corrupt HMR state. Native dependency audit currently fails on unpatched build-tool advisories: see MOBILE.md; keep the CI gate enabled.

For local Supabase fixture accounts only: run `tests/database/start-local.sh`, `node tests/database/proxy.mjs`, and `node scripts/local-product-env.mjs`. The fixture helper deliberately enables API age/pathway/mock flags only on loopback; it does not constitute owner approval. Run `ADEQUATE_DISPOSABLE_FIXTURES=true node scripts/enable-local-fixtures.mjs` before full CLI local signup tests, and restore the default disabled-signup config afterward. Use `ADEQUATE_DB_CONTAINER=supabase_db_LG` for CLI stacks or `adequate_db` for the minimal stack.
