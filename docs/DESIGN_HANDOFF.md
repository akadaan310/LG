# ADEQUATE — Design Atelier handoff

Status: **design phase only.** This document describes the review prototype. It doesn't record any decision. The final direction is chosen by LG and the engineer in the Atelier and exported as `selected-direction.md`. Claude did not choose a direction.

## Assumptions made while building

- The repository was empty, so a fresh TypeScript monorepo was created as the directive suggests.
- No verified LG language was supplied. **All** copy is labelled concept copy, story content is placeholder, and nothing is attributed to LG.
- No imagery or recordings were supplied. Portraits are deliberate placeholders and audio is a visual placeholder only. No speech is fabricated.
- The Pre-PRD mentions LG's faith and a possible nonprofit status. The story page leaves faith as an optional LG-supplied placeholder, member tools stay belief-neutral, and the FAQ says legal status is unconfirmed.
- Prices ($8 Plus / $19 Circle) appear only as "proposed" and nothing can be purchased.

## The three directions

| | A · The Golden Human | B · The Resonance Atlas | C · The Living Manifesto |
|---|---|---|---|
| Feeling | Warm, intimate, tactile, journal-like | Nocturnal, precise, musical, revelatory | Bold, rhythmic, raw, humane |
| Promise | You are seen as a whole person, already enough | There is a pattern in you worth discovering | Your worth is not up for debate. Now, what will you do today? |
| Type | Fraunces + Source Serif 4 + Caveat marginalia | Space Grotesk + IBM Plex Mono readouts | Anton poster caps + Archivo |
| Colour | Ivory, warm ink, restrained gold, terracotta | Midnight, amber, spectral teal | Off-white, ink black, one electric blue |
| Shape | Soft radii, paper shadow, arched portrait | 2–4px radii, corner ticks, hairline grid | No radii, 2px ink borders, offset shadow |
| Motion | Ink-writing reveal, sunrise bloom, page turns | Orbits, line drawing, resonance pulses | Line-by-line slam, marquee, hard cuts, stamps |
| Sound visual | Pencil waveform filled in gold | Radial spectral rings around an orbit scrubber | Ink VU bars swept by the accent |
| Signature moments | Sunrise reveal · living marginalia · page turn | Your constellation · resonance rings · present-moment coordinate | Line by line · living marquee · the "CHOSEN" stamp |

Full specs are in `packages/design-tokens/src/concepts.ts`, covering tokens, light/dark, spacing, grid, radii, iconography, imagery, motion, component anatomy, copy tone and risks. They're also shown in each concept's **Design system** tab with a computed WCAG audit. Every key pairing meets AA in both modes (body and secondary text ≥ 4.5:1, marks and focus ≥ 3:1).

## Screen matrix

There are 29 screens and 20 of them have two structurally different variants. Each renders in all three directions at 1440, 1024, 1180, 820, 390 and 360 widths, plus iOS and Android frames. All are concept-aware and responsive through container queries.

- **Public:** home (Threshold / Chapters), story (Long letter / Moments), Principle (Geometry of Growth / Plainly stated), tools (Gallery / A day with), listening room (One voice / The wall), library (Open book / The shelf), circles (Calendar / How a circle works), membership (Side by side / Free first), FAQ (Accordion / Conversation), about (Simple form / Write a letter), privacy placeholder.
- **Member:** Today (One question / Home base), Adequacy Mirror (Three panes / Unfolding cards), Pathways (Branches / Side by side), Voice to Purpose (Speak / Prompted), Living Book (Margins / Exercise inline), Convergence (Timeline / Constellation), Adequate Together (Circles / The room), profile and history, preferences, onboarding (Three steps / One conversation). The Free, Plus and Circle levels are shown as tier tags, with no purchase logic.
- **Founder Studio:** capture (Microphone / Notebook), words and meaning (Side by side / Highlights), which keeps exact words visibly separate from interpretation. Also idea clusters, the proposal board (Board / One at a time, where silence is not approval) and the provenance timeline.
- **Developer review:** proposal intake with acceptance criteria, preview with impact map, and status and export.

Phone frames use platform conventions: an iOS centred title, ‹ Back and tab bar, versus an Android left title, ← and Material pill navigation, plus a working Android Back. Tablet and desktop member layouts use a sidebar.

## What is mocked

Everything interactive inside the screens is a simulation and is labelled "Demo only" where it could be mistaken for the real thing. That covers recording, playing, joining circles, saving reflections, sending messages, purchases and data export or delete. Only **review state** persists, in `localStorage` on the current device. Founder Voice's optional microphone recording uses the browser's MediaRecorder, stays in memory, and is never saved or sent.

## Verified vs not verified

Verified in this environment:

- `npm run check` passes for typecheck (tokens, content, atelier), ESLint and the Next.js static export.
- `npm run native:typecheck` passes, and the Expo web export builds. The native components render in Chromium through react-native-web at 390 and 820 with no runtime errors, and that build is embedded at `/native/`.
- `npm run smoke` covers these acceptance criteria:
  - three concepts are shown;
  - a hybrid of hero A, type B and dashboard C is confirmed in the summary;
  - choices survive a reload;
  - JSON export carries every required field;
  - reset, then import, restores every decision;
  - presentation mode responds to the keyboard;
  - there are no page errors.
- An automated horizontal-overflow sweep over all 29 screens × 2 variants × 3 concepts at 360, 820 and 1440 found no overflow.

**Not** verified:

- The Expo app was not run on a physical iPhone or Android device, or in simulators, because the container has neither.
- Safe areas, dynamic type at OS level, haptics and true platform fonts are untested on device.
- Screen-reader passes (VoiceOver / TalkBack / NVDA) have not been done manually.
- 60fps was not profiled on low-end hardware.

## Unresolved design questions for LG and the engineer

1. Which direction, or which hybrid? The Atelier records it.
2. Do the brand terms (Adequacy Principle, Possibility Fields…) feel like LG's language, or should they be renamed in the board?
3. How present should LG's face and voice be on the homepage: a portrait-led *Chapters* opening, or a statement-led *Threshold*?
4. Should a dark-first direction (B) also be offered in light mode by default, given late-night reflective use versus daytime reading?
5. How loud can ADEQUATE be before it stops feeling kind? (C's volume is the main risk.)
6. Should the Today screen be one question or a home base? This shapes the whole member product.
7. Founder imagery: real photography, illustration, or symbolic only?
8. Fonts: the bundled web fonts are OFL. Native builds need them loaded with `expo-font` once chosen.

## Engineering handoff (when authorised, not now)

- Treat the exported `design-decisions.json` and `selected-direction.md` as the source of decisions. IDs are stable (`screenId@v1`, `slot.*`, `term.*`, `d-0001`).
- `packages/design-tokens` is already platform-neutral (pure TS) and feeds both CSS variables (`cssVars`) and React Native (`makeTheme`). Keep it as the shared token source.
- The Pre-PRD's §8 direction (Next.js, Expo, Supabase, AI router) is **not** started here, by design.
