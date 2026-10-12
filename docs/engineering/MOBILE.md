# ADEQUATE native member app

The operational app is `apps/mobile`. The existing `apps/native-preview` remains a separate design reference and is unchanged. The app uses native React Native components, shared domain schemas and exact approved B colors/type; C supplies square cards and navigation blocks. Today preserves the selected `member.today@v2` home-base structure. Reflection/preferences interfaces remain visibly marked for owner review; pathways and community stay unavailable.

## Install and run

Requires Node 22 or newer. Dependencies are pinned in this app's standalone package and lockfile; do not add it to the root workspace install.

```bash
npm install --prefix apps/mobile --no-workspaces
cp apps/mobile/.env.example apps/mobile/.env.local
npm run start --prefix apps/mobile
npm run ios --prefix apps/mobile
npm run android --prefix apps/mobile
```

Use only the confirmed application API URL, Supabase project URL and publishable key (or legacy `anon` key). All `EXPO_PUBLIC_*` values are embedded in the build. Service-role/secret keys are rejected; never put server secrets in these files. API/Supabase URLs require HTTPS and reject embedded credentials. For deliberately insecure local emulator/LAN debugging only, set `EXPO_PUBLIC_ALLOW_INSECURE_LOCAL_DEV=true`; the exception permits loopback/private network hosts, never arbitrary remote HTTP. Keep it false for releases. Android emulator host access generally uses `10.0.2.2`; a physical device needs a reachable private LAN address or HTTPS tunnel rather than its own loopback address.

For email verification and recovery, use a development/standalone build with the `adequate` scheme. Configure the server-owned `NATIVE_AUTH_REDIRECT_URL=adequate://auth/callback` and add that exact destination to the same Supabase project's Auth redirect allowlist. Expo Go's generic scheme is not acceptance evidence for a registered application callback. No remote project configuration was changed during this work.

After changing public environment values, export with a cleared Metro cache; otherwise an earlier transform can retain its previous build configuration:

```bash
cd apps/mobile
node node_modules/expo/bin/cli export --clear --platform web --output-dir dist
node node_modules/expo/bin/cli export --clear --platform all --output-dir dist-native
```

## Working flows

The app supports email/password signup and verification, login, recovery/password change, automatic session refresh tied to AppState, validated callback links, Today, published-content search/detail, saved content, private reflection create/edit/delete, display name, theme preferences, consent changes, account export through the platform share sheet, logout and account deletion. Signup remains server-gated by the approved age policy.

All requests use the documented `/api/*` paths, `x-client-platform: native`, a native Origin matching the API origin, and the current Supabase bearer token where available. JSON responses use `{data}` or the documented error envelope. Network/token acquisition has a bounded request deadline; failures retain unfinished text. Native requests omit cookies. The server uses implicit callback sessions for native email flows and PKCE for web; the app also recognizes exact callback code/OTP links for compatible deployments.

Rights-cleared media is loaded only from the authorized signed-media endpoint. `expo-audio` provides play/pause, seek, chapter actions, transcript display and playback-position persistence/resume. Missing recordings/transcripts show unavailable states. The radial amber/teal visualization is a playback position illustration, not a fabricated recording or measured signal. Playback stops when the app backgrounds and when the player view closes. Device background playback and offline recording downloads are not enabled.

## Private local continuity

Native sessions and unfinished reflection drafts use OS-backed `expo-secure-store`, with iOS `WHEN_UNLOCKED_THIS_DEVICE_ONLY`. Values are split into small encrypted pieces to avoid platform value-size limits; a manifest changes after the replacement pieces are written. Draft envelopes include the account owner, editing ID and update timestamp. Reads reject a mismatched owner; account changes invalidate in-flight writes. Reconnect restores text for manual review and save, without automatic duplicate submission. A restored unfinished edit retains its original reflection ID even if account data is temporarily unavailable.

Logout/account deletion clears the current account's unfinished draft and local session. A queued or in-flight save cannot restore a draft after logout. Storage failures are surfaced; do not share a device until reported cleanup errors are resolved. Audio/content/reflection histories are not copied to persistent offline caches.

The web export is a component/build verification target. It keeps sensitive values in memory and does not claim persistent native security. Cross-origin native web export access requires an explicitly configured server CORS policy; the local runtime smoke uses a same-origin test proxy without changing production CORS.

## Fonts and licensing

Five original static TTFs load through `expo-font`: Space Grotesk 400/500/700 and IBM Plex Mono 400/500. Files, exact SIL OFL licenses, pinned upstream commits and SHA-256 hashes are in `apps/mobile/assets/fonts/sources.json`. No network font loading or platform font substitution is used.

## Verification and remaining gates

Commands exercised during implementation:

- Root `npm test`: 68/68 domain, API, inference, mobile and operations tests passed in the fresh implementation run.
- `tsx --test tests/mobile/*.test.ts`: account ownership, forged owners, logout races, reconnect preservation, Unicode secure chunks, bearer envelopes, callback destinations, deadline cancellation, HTTPS/URL credential/public-key rejection.
- `npm run typecheck --prefix apps/mobile`: passed.
- `npm run export:web --prefix apps/mobile` and Expo exports for iOS/Android/web; five TTF assets included and Hermes bundles generated.
- Chromium component runtime at 390px: unconfigured setup state, five fonts loaded, no page errors or horizontal overflow.
- Real member browser smoke first reached the configured auth screen without runtime errors, but login was blocked by the local server's missing native callback configuration. This is a recorded configuration gate, not a passing authenticated-flow claim.
- Optional real local member runtime: `node tests/mobile/runtime.mjs`; requires the local API on port 3100, Supabase on 54321 and ignored `/tmp/adequate-local.env`. It creates and deletes one isolated test member, uses synthetic acceptance text only, and writes sanitized results/screenshots under `/tmp/adequate-design-audit/`. It never targets a remote project.

Physical iPhone/Android devices, native simulators, OS SecureStore persistence, registered email links, VoiceOver/TalkBack, dynamic type and real-device audio routing are **BLOCKED** until device access is provided. Native exports are build evidence, not physical-device acceptance. Actual owner-approved LG material and cleared recordings remain unavailable; no substitutes are shipped.

## Dependency security gate

The standalone scan scope is `npm audit --prefix apps/mobile --omit=dev --audit-level=high`. Expo/React Native list CLI and Metro build tooling as production dependencies, so this scan includes that tooling; it is not a measurement of browser/mobile runtime exploitability alone.

The safe CommonJS-compatible `uuid@11.1.1` override removed the UUID advisory and all seven propagated moderate findings. The resulting scan still reports **15 high findings**, propagated from two upstream advisories:

- `braces`: **braces vulnerable to stack-exhaustion denial of service through deeply nested patterns**, [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), affected `<=3.0.3`; latest registry version checked was `3.0.3`. Dependency path includes Expo/React Native → Metro/micromatch → braces.
- `node-forge`: **node-forge RSA PKCS#1 v1.5 signature verification accepts extra nested DigestAlgorithm elements**, [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv), affected `<=1.4.0`; latest registry version checked was `1.4.0`. Dependency path includes Expo CLI → code-signing certificates → node-forge.

No fixed published versions were available in the registry used for this session. npm's suggested Expo 44 / React Native 0.72 downgrade is incompatible with this SDK and was not applied. **Release remains blocked** on an upstream fix or reviewed remediation, followed by install/export/device verification. Full scan JSON stays in the local evidence artifact, with no credentials.
