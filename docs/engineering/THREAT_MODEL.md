# Threat model

Assets: private reflections/drafts, account sessions, founder recordings/rights, editorial approvals, role/entitlement integrity and inference credentials. Boundaries: browser/native → API → Supabase; API → private inference; Studio → quarantine → publication.

| Threat | Control | Verification / residual risk |
|---|---|---|
| Member guesses another member UUID | ownership RLS with USING/WITH CHECK and server-assigned identity | SQL and local HTTP isolation tests; production configuration needs rehearsal |
| User edits metadata to become founder | protected roles table; no user_metadata authority | SQL role escalation tests |
| Draft/version/audio leak | state/entitlement RLS; private bucket; expiring signed access | SQL policies and media authorization tests; signed URL access lasts until expiry |
| Editor or model publishes | founder-only atomic workflow; approval/rights checks; labeled AI output | publication/security tests |
| Editing approved copy preserves stale approval | trigger clears approval and new revision is retained | transition/version tests |
| Revoked or deleted session reused | active-account/session predicate; logout revocation; deletion purge | local Auth/RLS tests; tokens otherwise remain cryptographically valid until expiry |
| CSRF/open redirect/oversized input | strict origin guard, safe local redirect, bounded body and Zod | unit and HTTP tests |
| Remote URL ingestion SSRF | no remote-ingestion endpoint | source review; future ingestion needs separate URL/IP/redirect controls |
| Malicious upload | allowlisted audio signatures, size limits, quarantine, service-only scan clearance | signature tests; actual AV scanner integration remains launch gate |
| Inference injection/malformed JSON | authorized sources, typed output/reference validation, no tools, deadlines | AI and gateway tests; prompt quality needs owner review |
| Private data in diagnostics | trace/status metadata only; no payload logging | code review; operator logging configuration remains responsibility |
| Public raw model administration | loopback runtime + authenticated private TLS ingress and firewall preparation | gateway tests; actual Oracle network/restart test blocked |
| Abuse across server replicas | database-backed requester counters; Auth provider throttling | policy tests; load targets need actual deployment benchmarks |
| Dependency vulnerability | locked versions, audit in CI, source secret guard | current scan in acceptance report; keep scanning on updates |

No community is enabled. Age policy, moderation/governance, retention periods, legal/brand claims and rights approvals require owner decisions before launch. These are recorded gates, not assumed policies.
