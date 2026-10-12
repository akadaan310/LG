# ADEQUATE — Final End-to-End Codex Engineering Directive

**Repository:** https://github.com/akadaan310/LG  
**Atelier:** https://atelier-ruby-eight.vercel.app/  
**Lead implementation agent:** Codex  
**Date:** 2026-10-12

## Mission

Turn the existing ADEQUATE design atelier into a secure, operational, full-stack, mobile-ready creator-led experience platform for LG. **Do the engineering, not another design exercise.** Inspect the real repository, preserve existing work, implement in reviewable stages, and run actual tests. Treat the approved design exports as binding. Never present prototype copy, synthetic member data, or AI-authored text as LG's approved words.

## First actions — mandatory

1. Clone and audit `akadaan310/LG`: README, Pre-PRD, engineering handoff, Next.js/Expo projects, all variants, components, tokens, decision ledger, deployment config, CI, tests, and recent history.
2. Review the live Atelier for visual reference. Read `design-review.md`, `selected-direction.md`, and the third Markdown export when available; ask for any missing file rather than inventing its contents.
3. Write `docs/engineering/REPOSITORY_AUDIT.md`, `APPROVAL_TRACEABILITY.md`, and `IMPLEMENTATION_PLAN.md`. Map each approved decision to components and tests. Then immediately execute the plan; do not stop at documentation.
4. Preserve the Atelier as a reproducible design reference. Work on a feature branch with coherent commits and migration history.
5. Use connected Supabase and other authorized integrations only after identifying the correct target project. Do not touch unrelated resources.

## Approved design — exact source of truth

**Resonance Atlas (B)** supplies homepage opening, lettering/type, colors/light, symbols, member Today direction, and sound/voice visuals. **Living Manifesto (C)** supplies navigation, reflection cards, and Founder Studio feel. **Golden Human (A)** supplies six explicitly approved screen variants:

- `public.home@v2` — Chapters
- `public.story@v2` — Moments
- `public.principle@v1` — Geometry of Growth
- `public.listen@v1` — One voice
- `public.membership@v1` — Side by side
- `member.today@v2` — Home base

Do not interpret the negative overall rating for A as revoking these specific selections. Favorite overall and motion are **open**. Additional screens (Adequacy Mirror, Pathways, Convergence, Welcome, Idea capture, Words & meaning, Proposal board) and all terminology decisions are **unapproved**. Implement proposals behind review flags, not as approved final designs.

### Exact design tokens

```json
{
  "dark": {"bg":"#0A0D16","surface":"#11172A","surfaceAlt":"#182036","ink":"#ECE8DF","inkMuted":"#A3A9BC","accent":"#F2A93B","onAccent":"#140D02","accentText":"#F5BA61","accent2":"#7CCFC4","line":"#28324D","focus":"#FFD08A"},
  "light": {"bg":"#EEF0F5","surface":"#FFFFFF","surfaceAlt":"#E2E6EF","ink":"#0E1322","inkMuted":"#47506A","accent":"#C27410","onAccent":"#140D02","accentText":"#94560A","accent2":"#1F7A70","line":"#C6CCDA","focus":"#8A4B00"}
}
```

Typography: Space Grotesk display/body; IBM Plex Mono accent; scale 12, 14, 16, 19, 23, 30, 40, 56, 76 px. Bundle licensed fonts for iOS/Android. Ensure keyboard accessibility, reduced motion, contrast, and responsive fidelity. Do not replace the design with generic SaaS UI.

## Full product scope

### Public
Build the approved homepage, founder story, principle, listening room, membership comparison, and content discovery. Real responsive navigation, real published content, SEO/metadata, shareable URLs, accessible audio and transcript display, content states, and clear sign-in/join flows. Use placeholders only when labeled and not published as founder material.

### Members
Authentication and onboarding; member Today; saved content; playback resume; private reflections (create/edit/delete/export); optional AI-assisted reflection structuring; editorial pathways and progress; search; preferences, privacy, account deletion, consent management, accessible error/loading/empty states. Any community/circles functionality must remain gated until moderation and governance are approved.

### Founder Studio
Founder/editor-only content management: drafts, ideas, version history, recording library, transcripts, chapters, rights metadata, editorial proposals, review decisions, preview-as-member, scheduling, publish/unpublish, rollback, audit logs, AI-assisted drafts with explicit labeling. Content states: draft → review → approved → scheduled → published → archived. LG remains final authority for his voice, likeness, biography, words, recordings and brand claims.

### Web/mobile
Extend existing Next.js and Expo foundations when justified by repository audit. Share design tokens, domain types, Zod schemas and API contracts; do not force web DOM components into React Native. Support session persistence, deep links, accessible audio controls, real-device testing, native fonts, offline-safe drafts where appropriate, and graceful reconnect.

## Supabase persistence and authorization

Discover the correct Supabase project and request confirmation if ambiguous. Create version-controlled, reversible migrations and separate dev/staging/production environments. Design justified tables for profiles, preferences, roles, consents, membership/entitlements, content/versioning/tags, media/rights, pathways/progress, reflections, bookmarks, Founder Studio drafts/reviews/publications, AI tasks, feature flags and audit events. Add community entities only after approval.

Enforce RLS on private/user-owned data; test cross-user isolation, unpublished content protection, and role escalation denial. Never expose service-role credentials in client code. Restrict private media with signed access, verified rights and server-side authorization. Build reliable auth/session refresh, recovery, logout and revocation. Billing must be integration-ready but **no live charges** without owner approval; use verified webhooks and idempotent entitlement updates when enabled.

## Oracle Inference Gateway — always-on 24 GB VM

Abed reports an Oracle Always Free VM with approximately **24 GB RAM**, intended for always-on open-model inference. **Access is not yet supplied.** At the point actual Oracle work becomes necessary, create `docs/infrastructure/ORACLE_ACCESS_REQUEST.md` and ask Abed for the precise SSH/network/credential details through a secure channel. He will obtain them. Do not invent tokens, alter unrelated workloads, or assume CPU/GPU specs.

Architecture:

```text
Next.js / Expo
  → authenticated typed application API
  → authorization + consent + rate limits
  → AI task router + structured validation
  → private Oracle inference gateway
  → warm, CPU-oriented small open-weight model
  → validated response + audit metadata
  → application experience
```

Use CPU-first benchmarking: inspect OCPU count, architecture, RAM headroom, disk and network. Compare llama.cpp GGUF, Ollama and suitable CPU-compatible runtimes. Evaluate appropriately licensed quantized instruction models around 0.5B–3B parameters, not multiple oversized models. Keep the primary model resident in memory; systemd restart-on-boot; separate liveness/readiness; bounded queues, concurrency, cancellation, request deadlines, circuit breaker, versioned model registry, metrics and graceful restarts. **24 GB RAM does not guarantee GPU-like throughput.** Benchmark warm time-to-first-token, tokens/sec, p50/p95 latency, memory, CPU saturation and recovery before setting service targets.

Typed task contracts: `reflection.structure`, `idea.organize`, `content.discover`, `founder.draft`, `copy.adapt`, `transcript.summarize`, `recommendation.explain`. Route simple deterministic tasks to conventional code or database queries. Use retrieval only over authorized published/private-to-requester material. Separate speech transcription from language generation and benchmark it independently. Validate all model JSON. Model output never grants permissions, publishes content, executes arbitrary tools or becomes an LG quotation. Never infer or score a person's worth or emotional vulnerability. External AI fallback requires explicit privacy/consent controls; when Oracle fails, manual reflections, drafts, search and playback must remain functional.

Secure gateway using restricted network ingress, TLS and authenticated service-to-service communication. No publicly exposed raw Ollama/admin port. No private reflection content in logs by default. Implement a local mock adapter first, so application development continues while awaiting Oracle access.

## Audio and media

Implement rights-aware audio upload/storage, publication metadata, transcripts and chapter markers, accessible play/pause/seek, resume/bookmarks, responsive waveforms styled with Resonance Atlas, signed URLs for restricted media, and explicit recording/likeness rights. Do not assume three discussed audio recordings are in the repository or cleared for publication. Transcript corrections and approvals must be available to founder/editor roles.

## Security, privacy, ethics

Least privilege everywhere. Input/output schema validation, CSRF protections where applicable, secure headers, SSRF prevention for remote-media ingestion, upload scanning/type/size limits, dependency scanning, abuse/rate controls, auditability, consent, retention/export/deletion workflows, and secrets management. AI assistance must be optional and transparent. Avoid manipulative engagement optimization, mental-health diagnoses, hidden profiling, and claims of nonprofit status unless verified. Establish age policy and any additional minor-safety controls before launch.

## Observability and operations

Structured logs with trace IDs (no sensitive payloads), error tracking, web vitals, API/database/inference latency, model queue depth, Oracle RAM/CPU/disk, uptime probes, alerts, backup/restore drills, migration rollback, deployment and incident runbooks. Document actual hosting costs and resource ceilings. Configure CI for lint, typecheck, unit, integration, RLS/security, end-to-end and visual regression tests. Test mobile on supported devices or explicitly identify gaps.

## Implementation milestones

**M0 — Repository and approval audit:** inspect code and exported design decisions, document baseline, set traceability and architecture decisions.

**M1 — Design system and navigation:** implement exact tokens, selected screens, reusable accessible components, responsive behavior, visual regression baselines and Expo parity.

**M2 — Supabase foundation:** migrations, auth, roles, RLS, storage, seed data, typed APIs, integration/security tests.

**M3 — Public product:** homepage, founder story, principle, listening room, membership and published content flows with proper SEO/accessibility.

**M4 — Member experience:** onboarding, Today, reflections, saved content, pathways/progress, preferences, privacy controls.

**M5 — Founder Studio:** drafts, ideas, rights, transcripts, content approval/publishing, preview and rollback, audit trails.

**M6 — AI gateway:** task schemas, mocked adapter, policy/consent routing, fallback, benchmarking harness; then request Oracle access and deploy only after explicit authorization.

**M7 — Native and production hardening:** Expo integration, real-device testing, performance, monitoring, backups, threat review, load tests, accessibility, deployment rehearsals.

**M8 — Owner acceptance:** show real working flows, design traceability, test results, blocked approvals and production readiness. Do not declare launch complete without explicit authorization.

## Mandatory acceptance scenarios

1. Every approved screen matches its selected variant and selected cross-direction tokens; unapproved choices remain marked open.
2. New member signs up, verifies identity, signs in, uses Today, saves content, creates/edits/deletes a private reflection, signs out and back in; data persists correctly.
3. A second member cannot read or alter the first member's reflections, private media or account data.
4. Founder creates a draft, attaches authorized media, previews it, approves and publishes it, then unpublishes and rolls back; audit history remains intact.
5. Listening room plays an authorized recording with accessible controls and a transcript when available; missing audio does not appear as real.
6. AI tasks produce schema-valid results from the mock and later the authorized Oracle node; unavailable inference degrades gracefully without losing data.
7. Oracle restarts recover the warm model, authenticated routing and readiness checks; untrusted clients cannot access inference administration.
8. CI runs successfully, RLS tests pass, visual regression is reviewed, and supported web/native targets are validated.
9. Billing, LG content/identity/rights, nonprofit wording, unselected designs, Oracle deployment and public launch remain blocked until their explicit approval gates are met.

## Final deliverables

Provide working source and commits; Supabase migrations and policy tests; documented API contracts; web and native build instructions; `.env.example` with no secrets; Oracle access request and gateway deployment scripts; test and benchmark reports; architecture and threat model; content provenance and approval traceability; production runbook; and `docs/engineering/ACCEPTANCE_REPORT.md` with **PASS / FAIL / BLOCKED** per scenario, evidence and exact next action.

**Execution instruction:** Begin repository audit now, then implement end-to-end. Ask only for truly blocking approvals or credentials. Do not substitute mock screens for functional product flows. Do not claim deployment, approvals, model performance or tests that have not actually occurred. Finish the engineering work and report verifiable results.
