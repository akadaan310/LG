# ADEQUATE — Claude Code Design Synthesis Directive

You are Claude Code acting as a principal creative director, brand strategist, interaction designer, accessibility specialist, and React/React Native prototyping lead. This assignment is **DESIGN ONLY**. Read the companion file `ADEQUATE_Pre-PRD_Full_Product_Spec.md` in full as the product source of truth. If it is absent, request it before inventing product requirements. Do not implement production engineering.

## Mission tonight
Create a beautiful, immediately runnable **ADEQUATE Design Atelier** that LG and the commissioning engineer can review together in person. It must present three genuinely distinct complete brand/design directions, meaningful A/B screen and feature alternatives, and a frictionless side-by-side approval workflow. LG must be able to express feelings, philosophy, and impact without using design vocabulary. The engineer must be able to preserve the approved direction as a machine-readable handoff for the later engineering prompt. Do not defer the board until after a full product build: the comparison and approval board is the first usable milestone.

## Hard scope boundaries
- NO Supabase, databases, server-side business logic, production APIs, authentication, real subscriptions, payments, AI inference, analytics, real voice cloning, web scraping, real community messaging, or app-store integration.
- NO production deployment, live user data, or hidden network calls. Do not fetch fonts or images at runtime if this risks blocking the local demo; bundle permitted assets or use graceful fallbacks.
- Mock screens can navigate, animate, switch variants, simulate responses, demonstrate transitions, and locally persist review choices. These are *visual simulations*, not production workflows.
- No unnecessary backend. Use local static JSON and in-browser state/localStorage for review notes and selections. Include export/import of review decisions as JSON, and export a readable Markdown summary. Make clear localStorage is device-specific, not synced.
- Do not pretend a browser mockup is a native React Native app. Produce actual Expo/React Native design-screen components using shared tokens, plus an interactive web preview of the mobile screens if feasible. No backend is needed for either.
- No invented quotes attributed to LG. Use verified user-supplied language only with provenance labels and require LG approval before public release. All other marketing copy must be visibly labeled 'concept copy'.

## Audience and narrative
ADEQUATE = Always Remember, Everyone Is Adequate. Its founder LG describes adequacy as recognizing what is already inside people, and advocates present-moment agency, human dignity, reflection, and growth. The site must communicate that acceptance does not prohibit change. He is a powerful spoken-word performer and musician, but this first enterprise is his motivational brand; music influences pacing, composition, sound imagery, and storytelling, not a premature music storefront. His faith may inform his personal story, but member-facing tools should be hospitable to people of varied beliefs. Avoid guru worship, manipulative promises, clinical mental-health claims, false scientific certainty, and generic wellness stock aesthetics.

## Art direction: luminous mysticism, without conspiracy branding
Build a sophisticated, symbol-rich aesthetic using prisms, concentric circles, golden geometry, thresholds, star maps, spectral lines, resonant rings, refracted light, and handwritten marginalia. This can feel esoteric and revelatory without asserting LG belongs to the Illuminati or any secret society. Human illumination and dignity are the message. Avoid occult clichés, pyramids with all-seeing eyes as a default motif, empty luxury, gimmicky particles, purple AI gradients, and generic SaaS cards.

Create THREE unmistakably different design systems, each fully expressed in website and mobile surfaces:
A. **THE GOLDEN HUMAN** — warm editorial humanity, paper/ink, tactile typography, sunlight, gold foil restraint, intimate portraiture, journal-like spacing.
B. **THE RESONANCE ATLAS** — midnight/charcoal, constellations, spectral sound-wave geometry, technical elegance, musical rhythm, luminous amber, sophisticated diagrams.
C. **THE LIVING MANIFESTO** — bold experimental typography, kinetic editorial layouts, high-contrast monochrome plus one electric accent, street-poetry energy, humane rawness, carefully controlled motion.

For each define: positioning, emotional promise, typography pairing and font fallback, color tokens (light/dark where relevant), spacing scale, grid, radii, iconography, illustration/photography direction, accessibility contrast, motion language, sound visualizations, component anatomy, copy tone, and 3 distinctive signature moments. The concepts must be substantive, not recolors.

## Brand nomenclature
Use approachable mathematical-poetic vocabulary: The Adequacy Principle, Geometry of Growth, Possibility Fields, Architecture of Becoming, Present Moment, Resonance, Paths, Reflections, Circles. Test these names with LG; make them editable in the review board. These are metaphors or models, not proven mathematics. Never foreground the research label 'Computational Grammar Theory' in the consumer product. Let the depth be visible through clarity and interaction, not jargon.

## The first deliverable: live decision board
On first launch show a welcoming `Design Atelier` home, with a large concept comparison board displaying A/B/C simultaneously: visual hero thumbnails, emotional descriptors, typography and palette, representative phone mockups, and a quick choice: Love / Maybe / Not for me. Every concept has 'Explore' and 'Compare' routes. Support comparing any two variants side by side at desktop width and a swipe/toggle comparison on phones. Allow LG to select a favored concept overall while choosing specific components from other concepts. Make this hybrid selection explicit, not an all-or-nothing vote.

For EACH important screen, provide at least two meaningfully different layout or interaction variants (not mere color changes). Let LG approve/reject/defer at the concept, screen, feature, and individual component level. Record optional free-form notes and quick emotion tags (feels like me, too formal, too complicated, powerful, warmer, clearer, etc.). Provide a gentle, non-leading review mode with prompts such as 'Which one feels more like your voice?' and 'What would you want someone to feel here?' Never treat silence or lack of objection as approval. Provide undo and visible status history. Every review decision must have timestamp, concept ID, screen/component ID, chosen variant, status, comment, and author field selected locally (LG or engineer). No fake approval data.

Make a presentation mode optimized for sitting together tonight: large touch targets, keyboard arrows, swipe gestures, next/previous, full-screen preview, progress indicator, and a 'Review unresolved' queue. Provide a compact 'Founder Voice' panel where LG can type or paste a philosophical idea, select its intended impact, and attach it to a design surface as a proposal. Do not claim this panel uses AI; it is a local capture interface. If device microphone capture is straightforward and permissioned, optionally offer local-only recording with clear state, but don't make it required.

Exports: `design-decisions.json`, `design-review.md`, and a `selected-direction.md` brief with approved tokens, variant IDs, unresolved questions, and explicit provenance. Offer import to resume from a file. Generate deterministic stable IDs. Review state should survive local reloads on the same device.

## Screens to design
Public responsive web: cinematic homepage; founder story/manifesto; philosophy/Principle; tool showcase; audio story/listening room; library/book preview; workshops/community preview; membership pricing; FAQ; about/contact; privacy/accessibility placeholder.
Member responsive web and Expo mobile: Today; Adequacy Mirror; Pathways; Voice to Purpose; Living Book; Convergence; Adequate Together; profile/history; notifications/preferences; onboarding. Use entirely synthetic placeholder member data. Show the free/Plus/Circle product hierarchy visually, without purchase logic.
Founder Studio: voice/idea capture, transcript review, concept cards, interpretation vs exact quote, review questions, proposal board, approval and provenance timeline. Developer review: proposal intake, preview comparison, impact map, status, export. These are visual mockups, not connected systems.

## Responsive and platform matrix
For every major direction, demonstrate desktop web at 1440px, laptop 1024px, tablet/iPad portrait 820px and landscape 1180px, mobile web 390px and 360px; native iOS and Android via Expo components. Honor safe areas, Android back behavior in the demo, touch target minimums, dynamic type, keyboard visibility, scroll behavior, and reduced-motion preferences. Mobile web and native apps may share visual tokens but must have appropriate navigation conventions. Desktop should feel intentionally composed, not simply enlarged mobile. iPad layouts must have purpose-built compositions. Avoid horizontal overflow.

## Motion and microinteractions
Implement real *prototype* animations: hero typography reveal, softly refracted light, tactile press response, screen transitions, variant crossfade, audio waveform placeholder (not fabricated speech playback), reflection-card unfold, pathway branch transitions, journal page movement, and progress cues. Use restrained physics and motion choreography, avoid autoplay sound, respect prefers-reduced-motion, and maintain 60fps on ordinary devices where possible. Simulated interactions must be labeled as demo-only where they could be mistaken for real payments, AI, or account changes.

## Implementation for this design prototype
Use the current repository if one exists; inspect before changing. If starting fresh, create a TypeScript monorepo with `apps/atelier` (Next.js/React web design and decision board), `apps/native-preview` (Expo React Native mock screens), `packages/design-tokens`, and `packages/mock-content` (static data). Use CSS variables/tokens, accessible primitives, and a small coherent component system. Keep it locally runnable with clear README commands. No secrets or API keys. If the environment cannot run Expo, still author valid native components and show their intended designs via the web preview, explicitly documenting what was not verified.

Use CSS/SVG/canvas or legally licensed local assets for visuals. No speculative portrait of LG passed off as real; use a deliberate portrait placeholder until he approves actual imagery. Audio samples are not automatically cleared for public use. If original recordings are present locally, reference them only in a private preview with explicit permission and do not publish them.

## Execution sequence (do not stop at planning)
1. Inspect project, dependencies, and source spec; state brief assumptions.
2. Build the decision board first and ensure it runs locally.
3. Implement three design systems with polished hero and representative dashboard/native mockups.
4. Expand each system to the complete screen matrix; create meaningful A/B variants for priority screens.
5. Build founder review, comments, hybrid selection, export/import, and presentation mode.
6. Add motion, responsive refinement, accessible states, and actual Expo React Native screen components.
7. Run lint/type checks/build and any lightweight visual checks possible. Fix failures.
8. End with exact local launch commands, preview routes, what is mocked, the review flow for LG, exported artifact locations, unresolved design choices, and a clean engineering handoff summary. Do not begin engineering.

## Acceptance tests
- I can sit next to LG, open one URL locally, and immediately compare three credible directions.
- LG can select one hero from A, typography from B, and a member dashboard from C, with clear visual confirmation.
- He can approve, reject, defer, and comment without technical vocabulary.
- The board survives reload, exports a valid machine-readable record, and imports it again.
- Each key public/member/founder surface can be previewed at mobile, tablet, and desktop sizes; real Expo mock components exist for iOS/Android.
- Motion is polished, optional, and accessible; nothing suggests real payments, AI, or persistence beyond local review state.
- No production logic, APIs, backend, or credentials are introduced.
- The final design direction is NOT silently selected by Claude. LG and the engineer decide.

Start implementing the Design Atelier now. Do not respond with only a plan or an offer to produce code later. Do not ask aesthetic questions that the three concept explorations are intended to answer. If something essential is missing, use a clearly labeled placeholder and continue.
