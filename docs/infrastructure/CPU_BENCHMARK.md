# CPU inference benchmark

No Oracle host or real model has been measured. Access and deployment approval remain pending. The checked-in mock report measures local synthetic timing only; its host observations belong to the development environment. It is not a service target or a model throughput result.

Node 20+ runs the standalone harness without dependencies:

```sh
node --test tests/ai/benchmark.test.mjs
node infrastructure/oracle/benchmark.mjs --runtime mock --iterations 20 --warmups 2 --output /tmp/mock-benchmark.json
```

After obtaining approved access and a licensed, checksum-verified model, run these commands on the approved benchmark host. Raw runtime ports must remain loopback. Start one CPU runtime at a time; do not infer throughput from the reported 24 GB RAM. Choose CPU threads and context size from observed OCPUs, architecture, existing workload headroom and tests. Substitute verified model/version/PID values; these examples do not download or start models:

```sh
node infrastructure/oracle/benchmark.mjs --runtime llama.cpp --url http://127.0.0.1:8080 --model-version VERIFIED_GGUF_SHA256 --runtime-version VERIFIED_LLAMA_CPP_REVISION --iterations 30 --warmups 2 --pid TARGET_PID --output /tmp/llama-cpu.json
node infrastructure/oracle/benchmark.mjs --runtime ollama --url http://127.0.0.1:11434 --model VERIFIED_INSTALLED_MODEL --model-version VERIFIED_MODEL_DIGEST --runtime-version VERIFIED_OLLAMA_VERSION --iterations 30 --warmups 2 --pid SERVER_PID,MODEL_WORKER_PID --output /tmp/ollama-cpu.json
```

Add `--deployment oracle` only when actually executing on the approved Oracle host. The report explicitly says this location is operator attested, not independently verified. Use `--prompt-file` for an approved synthetic workload and `--max-tokens`/`--deadline-ms` to match application task limits; do not benchmark private member reflections. Reports omit prompts and generated text. Reports written to a new output file use mode 0600; use a private output directory, especially for operational metadata. No external fallback is invoked.

Each run is serial (concurrency 1). Warmup samples are separate from measured samples. Warm time to first token includes loopback transport and scheduling and starts when the request begins, ending at the first nonempty generated fragment. Total latency ends after a complete stream. Token throughput uses the runtime's final generated-token count and generation duration; missing counts stay null rather than estimated from text. p50/p95 use nearest rank over successful samples; failures are counted and make the CLI exit nonzero. `loadMs` records Ollama's runtime-reported model load duration. Mock token throughput is null because no tokenizer/model runs.

Linux resource sampling uses declared `/proc` PIDs and `getconf CLK_TCK`. Include every model worker, and record the PID coverage. Peak RSS is summed across those processes and may double-count shared pages. CPU is process CPU time divided by sample wall time: 100% means one full core, and multiple cores may exceed 100%. Missing/restarted PIDs produce unavailable samples; no target PID means RSS/CPU were not measured. OS-visible memory and logical CPUs do not prove Oracle entitlement or container limits. Inspect memory headroom, CPU saturation, disk and network separately before approving targets.

Recovery is opt-in because it executes a local operator-supplied restart command. It uses an argument array with no shell, discards command output, and measures from command start until the first completed synthetic inference. Only run a restart after the required owner approval and a maintenance window. Example after authorizing the named service:

```sh
node infrastructure/oracle/benchmark.mjs --runtime llama.cpp --url http://127.0.0.1:8080 --iterations 30 --warmups 2 --recovery-command-json '["systemctl","restart","adequate-llama.service"]' --recovery-deadline-ms 120000 --output /tmp/llama-recovery.json
```

Recovery readiness proves inference completion, not merely an open HTTP port. Reacquire PID lists after restart for a separate resource run. Also test gateway cancellation, bounded queue, authentication, graceful shutdown and unavailable-inference behavior with the gateway/app tests; this runtime harness does not measure those controls. Benchmark speech transcription independently. Compare identical synthetic prompts/output limits and pinned runtime/model artifacts across llama.cpp and Ollama before selecting one resident primary model. No service latency promise is established yet.

The registry starts with `local-mock`. The real-model entry is a proposal with license approval false and no pinned artifact. Resolve license review, source/revision/checksum, quantization, runtime revision, model compatibility, disk/RAM headroom and deployment approval before activating any real entry. Keep manual reflection editing, drafts, discovery and playback available when inference is unavailable.
