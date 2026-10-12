# Database and authorization

The implementation uses Supabase Auth, PostgreSQL RLS, and a private `recordings` bucket. No remote project was linked or changed: the sole connected target was unconfirmed. Production seed is deliberately empty. Test-only accounts, editorial text and recording metadata are transactions in `tests/database/security.sql`; they roll back.

The CLI created four migrations: `20261012104221_operational_foundation.sql`, `20261012110048_serialize_media_publication.sql`, `20261012111627_restrict_editor_media_creation.sql`, and `20261012112727_authorize_service_media_guard.sql`. The second records security review fixes for concurrent media attachment, editorial media history, draft `INSERT RETURNING`, and account/media deletion. The third prevents editors creating an unrestricted asset through INSERT. The fourth grants the already-privileged service role permission to execute the role-check helper used by the media trigger, without conferring founder identity. All four migrations are in the verified local migration ledger.

## Tables and roles

Every public table has RLS and explicit grants. Member records are owner-scoped with matching `USING`/`WITH CHECK` checks: `profiles`, `preferences`, `consents`, `reflections`, `bookmarks`, `playback_progress`, `pathway_progress`. `user_roles` and `entitlements` allow the owner to read but never change their authority. Profile bootstrap always assigns `member`; `raw_user_meta_data` supplies only a bounded display name. Editorial access uses database roles (`founder`, `editor`) rather than editable or stale JWT role metadata.

`content`, `content_versions`, `content_tags`, `media_assets`, `pathways`, `pathway_items`, `studio_ideas`, `reviews`, `publications`, `audit_events`, `ai_tasks`, `feature_flags`, and `rate_counters` support the stable API. Community has no tables. Member audience requires an unexpired entitlement with tier `member`, `supporter`, or `patron`; a new user has `free` and no charge occurs. AI metadata requires `ai_processing` consent, has no input/output payload fields, and confers no editorial permissions. Preferences and consent timestamps are updated by triggers.

Sensitive policies require a nondeleted profile, an unbanned Auth user, and the token's `session_id` matching an unexpired `auth.sessions` row. Session revocation and deletion invalidate access immediately for new database requests. Members cannot reassign record ownership, change roles/entitlements, read other members' records, or resurrect a deletion tombstone. Editors cannot browse members' private reflections or privately owned media.

## Editorial workflow

Client-safe, invoker wrappers call non-exposed, permission-checked functions in `private`, all with a pinned search path and explicit execution grants:

| RPC | Caller and behavior |
| --- | --- |
| `active_account()` | Authenticated; current account/session validity |
| `transition_content(p_content_id, p_state, p_scheduled_at default null)` | Founder/editor; validates the state graph atomically and returns content |
| `rollback_content(p_content_id, p_version)` | Founder; restores earlier text/metadata as a new draft revision, clears rights and approval |
| `consume_rate_limit(p_scope, p_limit, p_window_seconds)` | Authenticated; atomic owner counter |
| `consume_auth_rate_limit(p_key, p_limit, p_window_seconds)` | Server service role only; hashed identity/address key |
| `publish_due_content()` | Server service role only; publishes due approved rows and returns count |
| `delete_own_account()` | Active member; bans/revokes sessions, anonymizes Auth identity and purges private text data |
| `claim_media_deletions(p_limit default 20)` | Server only; claims cleanup jobs with retry leases; linked editorial bytes return `blocked_review` |
| `complete_media_deletion(p_job_id, p_error default null)` | Server only; records retry or purges unlinked metadata after Storage API removal |

Content follows draft → review → approved → scheduled/published → archived, with explicit return-to-draft transitions. Only the founder approves, schedules, publishes, archives, or unpublishes. Draft/review edits require renewed founder approval. The publish transaction requires real, non-placeholder body/provenance, verified content rights, and verified, clean linked media; audio additionally requires an asset. Clients cannot directly update state, approval, version or publication timestamps. A scheduled job cannot grant approval: invalid due rows remain scheduled and record a blocked audit event.

Every text edit and linked media mutation advances the parent revision. Immutable snapshots preserve flat content fields plus a `media_assets` array including transcript, chapters, rights and scan status. Moving an asset invalidates both old and new parent approvals. Metadata-only audit events omit private payloads. Revision, review, publication and audit records reject updates/deletes even under routine administrator queries. Rollback restores **content text/metadata only**; the media snapshot remains available for historical review and does not silently replace stored bytes or restore media rights. The restored draft must be reviewed again.

The media guard locks parent rows in deterministic UUID order before checking publication state. Publication locks the same parents and linked media, so an upload or reassignment cannot race through a stale draft check and attach pending bytes after publication. Conflicting existing-media updates may be aborted by PostgreSQL deadlock detection and should be retried by the caller.

## Storage and deletion

`recordings` is private, accepts listed audio types only, and caps each file at 50 MiB. An editorial uploader first creates pending metadata at `<user UUID>/<asset UUID>.<extension>`. Storage INSERT requires that owned registration. A file replacement needs a new asset, scan and rights approval; client upsert is intentionally unavailable. Only a trusted server scanner can change `scan_status`; only the founder changes verified rights or relaxes `restricted`. Published/scheduled assets cannot be changed, detached or removed.

Quarantined bytes cannot be read or signed, including by founder/editor. Authenticated owners may access their clean private recordings. Anonymous listeners can access only published public, nonrestricted recordings with clean scans and verified rights. Member recordings require a valid entitlement. Storage authorization uses the caller's user-scoped client; service keys are never needed for ordinary content/media access.

Account deletion removes provider identities and email/phone/password/user metadata, retains a banned ID tombstone for audit referential integrity, removes private textual records, and revokes sessions. Remaining file paths enter a durable private cleanup queue. `scripts/delete-private-media.mjs` deletes unlinked private bytes through the Storage API and only then completes metadata deletion. Failed jobs retry; linked editorial recordings require retention review and never get silently deleted. `scripts/publish-scheduled.mjs` runs the due publication RPC. These scripts require an explicitly configured server target and must be scheduled by the operator; they are not deployed here.

Already-issued signed URLs remain bearer access until their short expiry unless Storage removes the bytes. A failed deletion worker therefore leaves a bounded signed-link window; stronger guarantees would require authorization on every media fetch. A real malware scanner, production retention periods, scheduler/cleanup cron deployment, billing webhook entitlement grants, and target-specific Auth/SMTP settings remain launch gates. A founder rights approval never acts as scan clearance.

## Reproduction and evidence

The standard local configuration supports PostgreSQL 17, short JWT lifetime, verified email, refresh rotation, explicit Data API grants, and disabled unrelated services. On a normal Docker host:

```sh
npx supabase start
bash tests/database/run.sh
node tests/database/concurrency.mjs
node tests/database/migration-drill.mjs
```

This workspace's Docker VFS driver exhausted disk space while unpacking the full Supabase PostgreSQL image. Verification used `postgres:17-alpine` with the **actual** GoTrue `v2.197.0` and Storage `v1.79.36` migration sets, PostgREST `v16.4`, and Mailpit `v1.31.3`. It used no stub Auth tables. `tests/database/start-local.sh` reproduces these minimal services; a local HTTP proxy routes port 54321 to Auth 54331, Storage 54332, and REST 54333. Generated local credentials live at `/tmp/adequate-local.env`, outside version control. For the minimal setup:

```sh
ADEQUATE_DB_CONTAINER=adequate_db bash tests/database/run.sh
ADEQUATE_DB_CONTAINER=adequate_db node tests/database/concurrency.mjs
ADEQUATE_DB_CONTAINER=adequate_db node tests/database/migration-drill.mjs
npx supabase db advisors --db-url "$DATABASE_URL" --type security --fail-on warn
npx supabase migration list --db-url "$DATABASE_URL"
```

Actual results: **91 SQL security assertions passed**, **two concurrent INSERT/reattachment tests passed**, and **all four migrations rolled back/reapplied in a disposable schema clone, then the full SQL suite passed**. The concurrency regression first failed because a pending INSERT committed after publication; after parent locking, both mutations waited and were denied. The editor INSERT regression first failed because unrestricted metadata was accepted; it now denies unrestricted creation and permits restricted quarantined creation. Security advisors reported no issues; all local ledger versions matched migration files.

`supabase db lint` was blocked by the vanilla image lacking `plpgsql_check`, not by a reported application type error. Run it on the eventual full Supabase staging project. This is local security evidence; it does not establish hosted project policy configuration, live email delivery, malware scanning, load capacity, or production readiness.

`supabase/rollback/operational_foundation.sql` is a destructive development/staging rollback. It requires a verified backup and refuses to run while `recordings` has objects. Drain bytes through Storage API first. It retains the empty private bucket and secure default privilege changes; reapplying restores all migrations. The drill uses a separate disposable database and does not destroy active integration fixtures.
