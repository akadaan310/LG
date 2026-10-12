# ADEQUATE — Product and Design Atelier


Operational engineering now lives alongside the preserved design reference:

- `apps/platform`: dynamic Next.js web, private member tools, Founder Studio and typed APIs.
- `apps/mobile`: separate Expo member app with native fonts, secure sessions and private offline drafts.
- `packages/domain` / `packages/ai`: shared contracts/tokens and optional validated inference.
- `supabase`: migrations, RLS/storage policies, immutable editorial history and security tests.

```bash
npm ci
cp .env.example apps/platform/.env.local # supply only the confirmed project configuration
npm run product:dev                     # http://localhost:3100
npm run product:build
npm test
```

Start with [ACCEPTANCE_REPORT](docs/engineering/ACCEPTANCE_REPORT.md), [API contracts](docs/engineering/API_CONTRACTS.md), [database setup](docs/engineering/DATABASE.md), [native instructions](docs/engineering/MOBILE.md), and the [production runbook](docs/engineering/PRODUCTION_RUNBOOK.md). Signup, billing, community, unselected designs, real founder material, Oracle deployment and public launch remain gated. No remote Supabase project or Oracle node was changed. The original Atelier documentation below describes the design reference, whose mock content is never imported by the product.

**Always Remember, Everyone Is Adequate.**

A **design-only** review prototype for ADEQUATE. It's built for LG and the engineer to sit together and compare three complete design directions, mix and match parts, and record decisions that can be handed to engineering.

> No backend, database, auth, payments, AI, analytics, network calls or production logic. Every word in the mockups is **concept copy** (not LG's words). All member data is **synthetic**. Portraits are placeholders. No audio is used.

Source documents: [`docs/source/ADEQUATE_Pre-PRD_Full_Product_Spec.md`](docs/source/ADEQUATE_Pre-PRD_Full_Product_Spec.md) (product source of truth) and [`docs/source/ADEQUATE_Claude_Code_Design_Synthesis_Directive.md`](docs/source/ADEQUATE_Claude_Code_Design_Synthesis_Directive.md).

## Run it tonight

Needs Node 20+.

```bash
npm install
npm run dev            # → http://localhost:3000
```

Or run it as a fully static build. After this it works with no network at all:

```bash
npm run build          # static export to apps/atelier/out
npm start              # serves it at http://localhost:3000 (no dependencies)
```

Checks: `npm run check` runs typecheck, lint and build. `npm run smoke` runs an acceptance test against a running server and needs Playwright.

### Native app (Expo React Native)

```bash
npm run native:install
npm run native:start   # scan the QR code with Expo Go on iPhone/Android, or press i / a for simulators
npm run native:typecheck
npm run native:export  # rebuild the browser copy shown at /native/ in the Atelier
```

The native app is a separate project (`apps/native-preview`, Expo SDK 57 / React Native 0.86). It isn't an npm workspace, so React Native and Next.js never share dependency hoisting.

## Routes

| Route | What it's for |
|---|---|
| `/` | **Design Atelier home.** Shows the three directions side by side, each with a homepage thumbnail, phone mockup, type specimen, palette and promise. Gives quick **Love / Maybe / Not for me** buttons, a ☆ favourite, **Mix & match** and **The words we use**. |
| `/concept/golden-human/` `/concept/resonance-atlas/` `/concept/living-manifesto/` | **Explore.** Every screen with its A/B variants at 1440 / 1024 / 1180 / 820 / 390 / 360 plus iOS and Android frames, light/dark, and decisions per variant. The **Design system** tab shows the full spec with computed contrast, and decisions on components and signature moments. |
| `/compare/` | Any two directions/variants side by side (`?screen=&a=&b=&va=&vb=`). On a phone it becomes a ◀ ▶ toggle with swipe. |
| `/present/` | **Presentation mode** for sitting together. Big targets, ← → keys, swipe, `F` for full screen, a progress bar, **Review unresolved** and undo. |
| `/voice/` | **Founder Voice.** LG types or pastes an idea, picks the impact, and attaches it to a screen as a proposal. Optional microphone recording stays in memory only. No AI. |
| `/review/` | Ledger, full history with undo/redo, open items, **exports** and **import**. |
| `/native/` | The real Expo components rendered in the browser (phone and iPad). |
| `/preview/?c=<concept>&s=<screen>&v=v1\|v2` | One mock screen at true browser width, for checking on a real phone or iPad. |

## Review flow for LG

1. On `/`, pick **LG** or **Engineer** at the top right. Every decision records who made it.
2. Give each direction a first feeling: **Love / Maybe / Not for me**. Mark one **favourite overall** if one stands out.
3. In **Mix & match**, take any part (homepage opening, lettering, colours, movement, member home…) from any direction. The summary bar confirms the hybrid, e.g. *hero A · type B · dashboard C*.
4. Open **Present** and walk through the steps together. Each screen shows two ways with gentle prompts. Choices are **Yes, this one / Decide later / No**, plus optional feeling tags and free notes. No design words needed.
5. Use **Founder Voice** whenever an idea comes up.
6. On **Review & export**, download the three files.

Silence never counts as approval. Anything not explicitly chosen stays **open** and appears in the unresolved queue.

## Exports

These are generated in the browser and saved to your Downloads folder:

- **`design-decisions.json`** is the machine-readable record: summary, catalog of IDs and the full re-importable state. Every decision has a deterministic `id` (`d-0001`…), `timestamp`, `author`, `level`, `conceptId`, `targetId`, `variantId`, `status`, `emotionTags`, `comment`.
- **`design-review.md`** is a readable account plus a full history table.
- **`selected-direction.md`** is the engineering brief: approved tokens for colour, type and motion from the chosen sources, approved variant IDs, names, unresolved questions and provenance.

**Import** (Review & export) resumes from a `design-decisions.json`. Review state lives in `localStorage` (`adequate.atelier.review.v1`), so **it is device-specific and not synced**. Export to move it between devices.

## Repository layout

```
apps/atelier            Next.js 15 (static export) — board, explore, compare, present, voice, review
  src/screens/          29 mock screens (public / member / founder / developer), concept-aware, container-query responsive
  src/lib/              review store (append-only log, undo/redo, validation), derivations, exports
  public/native-app/    generated browser build of apps/native-preview (npm run native:export)
apps/native-preview     Expo React Native mock screens (Today, Mirror, Pathways, Voice, Book, Convergence, Together, Profile, Preferences, Onboarding)
packages/design-tokens  the three design systems + WCAG contrast audit + CSS variable generator (shared by web and native)
packages/mock-content   screen catalog & variants, review vocabulary, concept copy, synthetic data
docs/                   source spec, directive, and the design handoff
```

See [`docs/DESIGN_HANDOFF.md`](docs/DESIGN_HANDOFF.md) for the three directions, what is mocked, what was and wasn't verified, and the open design questions.
