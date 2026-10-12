# Repository audit — 2026-10-12

Baseline: `akadaan310/LG`, commit `1afe763`; clean clone. Earlier commits `6a44a13` (Atelier) and `db42b74` (source spec). No AGENTS.md was found. Work proceeds on `feat/adequate-operational-platform` in a fresh checkout; no existing user edits were present.

The repository has a Next.js 15 static-export Atelier with review/compare/presentation screens and browser-local decision history, a separately installed Expo SDK 57 design preview, shared concept tokens, and synthetic content. README and DESIGN_HANDOFF explicitly identify all previews as design-only. There are no operational auth, persistence, API, billing, inference, migrations or production secrets. The checked-in native browser export is retained. No CI or unit/security tests existed; the Atelier has a Playwright smoke script. Root and native lockfiles exist.

Reviewed README, DESIGN_HANDOFF, both source directives, workspace manifests, token systems, screen registry/public/member/shell components, export generator, Next static configuration and recent git history. The live Atelier returned HTTP 200 (93,855-byte HTML); browser visual inspection is tracked separately in the acceptance report.

Missing: `design-review.md`, `selected-direction.md`, and the stated third Markdown export. README actually names `design-decisions.json` as its third export. These records live in the reviewer's local browser and are not retrievable from the deployed static site. Their locations and the discrepancy have been requested. The supplied engineering directive is the available authority, without invented decision IDs, authors or timestamps.

The connected Supabase inventory contains only `NetGovComEduGovOrgEduGovComNet` (`fjlonsmwjdxoybaisalh`, Canada Central). Nothing in the repository associates it with ADEQUATE. Target confirmation was requested; no linked remote migration or resource mutation is authorized until identified. Local testing proceeds independently. Oracle access is absent. No real recordings, portraits, biography, approved founder words or cleared rights are supplied.

Architecture decision: keep `apps/atelier` and `apps/native-preview` reproducible as references. Add `apps/platform` as the dynamic Next application, `apps/mobile` for operational Expo, `packages/domain` for contracts and approved hybrid tokens, `packages/ai` for validated optional inference, and versioned `supabase` migrations. Public content starts empty. Synthetic fixtures belong only in isolated tests.

Baseline verification and subsequent build/security results are recorded in ACCEPTANCE_REPORT; repository documentation's historical claims are not treated as this session's test evidence.
