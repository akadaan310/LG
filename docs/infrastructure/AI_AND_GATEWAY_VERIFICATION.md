# AI router and local gateway verification

These results concern local development behavior. No Oracle connection/deployment, TLS ingress test, actual language-model runtime benchmark, speech transcription benchmark, model license acceptance or reboot recovery has occurred.

The package implements seven strict Zod task contracts, an explicitly labeled mock default, deterministic authorized-content search, consent/editor policy, owned-source checks, cancellation/deadlines, bounded queue and process-local circuit. It returns proposals or typed manual fallback with no database mutation. The application API is disabled by default (`AI_MODE=disabled`); explicit `AI_MODE=mock` enables labeled development assistance, and `AI_MODE=oracle` needs the protected endpoint/token configuration. See `packages/ai/README.md` for the server API/context boundary.

The standalone Node gateway binds loopback only. It exposes separate `/health/live` and `/health/ready`, bearer-authenticated `/v1/tasks` and `/metrics`; the Caddy template forwards only task requests from approved private/VPN CIDRs over TLS. Runtime adapters support Ollama and llama.cpp loopback services, limited JSON output and cancellation. Ollama keep-alive is indefinite and readiness requires the configured model to be loaded. The versioned registry starts in local mock mode; real activation requires license approval, pinned SHA-256, non-proposal version and matching model/runtime configuration. Systemd units, probes, controlled restart/warmup scripts and network restrictions are preparation assets pending installed-host verification.

Actual local checks on 2026-10-12:

| Check | Evidence | Result |
| --- | --- | --- |
| Mock task contracts / consent / roles / owned retrieval / deterministic discovery / malformed output / cancellation / bounds / circuit / fixed HTTPS adapter | `node --experimental-strip-types --test tests/ai/router.test.ts` (local Node 24) | 9/9 pass |
| Local HTTP gateway auth / live vs ready / model failure privacy / bounds / disconnect cancellation / incomplete body deadline / circuit / pinned-registry guard | `node --test tests/ai/gateway.test.mjs` | 10/10 pass |
| CPU harness parsing, timings, no fabricated tokens, PID sampler, deadline, explicit-command recovery, mock CLI report | `node --test tests/ai/benchmark.test.mjs` | 13/13 pass |
| Root unit suite (before the additional gateway metadata-output assertion) | `npm test` | 46/46 pass |
| AI source typecheck | `npm run typecheck -w @adequate/ai` | pass |
| Deployment shell syntax | `bash -n infrastructure/oracle/deploy/scripts/*.sh` individually | pass |
| Actual local synthetic timing report | `docs/infrastructure/LOCAL_MOCK_BENCHMARK.json` | local mock only; no model throughput measurement |
| Oracle installed services, firewall/TLS trust, hardware budgets, warm model, restart/reboot, real p50/p95/TTFT/RSS/CPU | Oracle access not supplied | BLOCKED |

`infrastructure/oracle/benchmark.mjs` compares runtimes on a target chosen by the operator; the checked-in sample is explicitly synthetic. It does not establish Oracle hardware or a service target. `CPU_BENCHMARK.md` documents the measurement definitions and recovery command approval boundary. Gateway tests use only local mock runtimes and ephemeral loopback servers.

When optional inference fails, the API returns an error/manual fallback and keeps manual reflection editing, drafts, deterministic discovery and playback available. It must not write any failed/generated reflection automatically. Deployment and host/model acceptance stay blocked until the secure access request and explicit deployment approval are fulfilled.
