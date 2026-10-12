#!/usr/bin/env node
// CPU benchmark harness. Reports metadata and timings, never prompt/output text.
import { readFile, writeFile } from 'node:fs/promises';
import { cpus, totalmem, freemem, arch, platform } from 'node:os';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { performance } from 'node:perf_hooks';
import { pathToFileURL } from 'node:url';

const execFileAsync = promisify(execFile);
const syntheticPrompt = 'Return a short JSON object with a title and three tags describing a garden. This is synthetic benchmark input.';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const finite = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const positive = (name, value, minimum = 1) => {
  if (!Number.isInteger(value) || value < minimum) throw new Error(`${name} must be an integer >= ${minimum}`);
  return value;
};
function distribution(values) {
  const sorted = values.filter(finite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  return { count: sorted.length, min: sorted[0], mean: sorted.reduce((a, b) => a + b, 0) / sorted.length,
    p50: sorted[Math.ceil(sorted.length * 0.5) - 1], p95: sorted[Math.ceil(sorted.length * 0.95) - 1], max: sorted.at(-1) };
}
export function summarize(samples) {
  const successful = samples.filter(sample => sample.ok);
  return { successful: successful.length, failed: samples.length - successful.length,
    latencyMs: distribution(successful.map(sample => sample.latencyMs)),
    ttftMs: distribution(successful.map(sample => sample.ttftMs)),
    tokensPerSecond: distribution(successful.map(sample => finite(sample.generatedTokens) && finite(sample.generationMs) && sample.generationMs > 0
      ? sample.generatedTokens * 1000 / sample.generationMs : null)) };
}
function runtimeUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error('runtime URL must be a loopback HTTP URL'); }
  if (!['http:', 'https:'].includes(url.protocol) || !['127.0.0.1', '[::1]', 'localhost'].includes(url.hostname)
    || url.username || url.password || url.search || url.hash) throw new Error('runtime URL must be a loopback HTTP URL without credentials');
  return url;
}

export function createRuntimeAdapter({ runtime, url, model, maxTokens = 128, keepAlive = -1 }) {
  if (!['ollama', 'llama.cpp'].includes(runtime)) throw new Error('runtime must be ollama or llama.cpp');
  const base = runtimeUrl(url);
  positive('maxTokens', maxTokens);
  if (runtime === 'ollama' && (!model || typeof model !== 'string')) throw new Error('Ollama requires a model identifier');
  return { runtime, model: model ?? null, async generate(prompt, { deadlineMs = 15000 } = {}) {
    positive('deadlineMs', deadlineMs);
    const started = performance.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), deadlineMs);
    let firstToken = null;
    let final = null;
    let reader;
    let receivedBytes = 0;
    const parse = line => {
      let raw = line.trim();
      if (!raw || raw.startsWith(':') || (runtime === 'llama.cpp' && !raw.startsWith('data:'))) return;
      if (raw.startsWith('data:')) raw = raw.slice(5).trim();
      if (raw === '[DONE]') return;
      const message = JSON.parse(raw);
      if (message.error) throw new Error('runtime_error');
      const content = runtime === 'ollama' ? message.response : message.content;
      if (typeof content === 'string' && content.length && firstToken === null) firstToken = performance.now();
      if (message.done === true || message.stop === true) final = message;
    };
    try {
      const body = runtime === 'ollama'
        ? { model, prompt, stream: true, keep_alive: keepAlive, options: { num_predict: maxTokens, temperature: 0, seed: 1 } }
        : { prompt, stream: true, n_predict: maxTokens, temperature: 0, seed: 1, cache_prompt: false };
      const response = await fetch(new URL(runtime === 'ollama' ? '/api/generate' : '/completion', base), {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
        redirect: 'error', signal: controller.signal,
      });
      if (!response.ok) throw new Error(`http_${response.status}`);
      if (!response.body) throw new Error('empty_stream');
      reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) { buffer += decoder.decode(); break; }
        receivedBytes += value.byteLength;
        if (receivedBytes > 8 * 1024 * 1024) throw new Error('response_too_large');
        buffer += decoder.decode(value, { stream: true });
        let newline;
        while ((newline = buffer.indexOf('\n')) !== -1) {
          parse(buffer.slice(0, newline)); buffer = buffer.slice(newline + 1);
        }
      }
      if (buffer.trim()) parse(buffer);
      if (!final) throw new Error('incomplete_stream');
      const tokens = runtime === 'ollama' ? final.eval_count : (final.timings?.predicted_n ?? final.tokens_predicted);
      const generationMs = runtime === 'ollama' ? final.eval_duration / 1e6 : final.timings?.predicted_ms;
      return { ok: true, latencyMs: performance.now() - started, ttftMs: firstToken === null ? null : firstToken - started,
        generatedTokens: finite(tokens) ? tokens : null, generationMs: finite(generationMs) ? generationMs : null,
        loadMs: runtime === 'ollama' && finite(final.load_duration) ? final.load_duration / 1e6 : null };
    } catch (error) {
      const allowed = /^(http_\d{3}|runtime_error|empty_stream|incomplete_stream|response_too_large)$/;
      return { ok: false, latencyMs: performance.now() - started,
        error: controller.signal.aborted ? 'deadline_exceeded' : allowed.test(error.message) ? error.message : error instanceof SyntaxError ? 'invalid_stream_json' : 'runtime_unavailable' };
    } finally {
      clearTimeout(timeout);
      if (reader) { await reader.cancel().catch(() => {}); reader.releaseLock(); }
    }
  } };
}

export function createMockAdapter() {
  return { runtime: 'mock', model: 'synthetic-fixture-v1', async generate() {
    const started = performance.now();
    await sleep(2);
    const first = performance.now();
    await sleep(2);
    return { ok: true, latencyMs: performance.now() - started, ttftMs: first - started,
      generatedTokens: null, generationMs: null, loadMs: null };
  } };
}

async function processSnapshot(pids) {
  const snapshots = await Promise.all(pids.map(async pid => {
    const [stat, status] = await Promise.all([readFile(`/proc/${pid}/stat`, 'utf8'), readFile(`/proc/${pid}/status`, 'utf8')]);
    const fields = stat.slice(stat.lastIndexOf(')') + 2).trim().split(/\s+/);
    const rss = /VmRSS:\s+(\d+)\s+kB/.exec(status);
    if (!rss) throw new Error('process_rss_unavailable');
    return { pid, start: fields[19], ticks: Number(fields[11]) + Number(fields[12]), rssBytes: Number(rss[1]) * 1024 };
  }));
  return { at: performance.now(), snapshots, rssBytes: snapshots.reduce((sum, item) => sum + item.rssBytes, 0) };
}
export async function createResourceSampler({ pids = [], intervalMs = 100 } = {}) {
  positive('intervalMs', intervalMs);
  for (const pid of pids) positive('pid', pid);
  if (!pids.length || process.platform !== 'linux') return { stop: async () => null };
  const { stdout } = await execFileAsync('getconf', ['CLK_TCK']);
  const ticksPerSecond = Number(stdout.trim());
  if (!Number.isFinite(ticksPerSecond) || ticksPerSecond <= 0) throw new Error('clock_ticks_unavailable');
  const rows = [];
  const cpu = [];
  let unavailableSamples = 0;
  let previous;
  const collect = async () => {
    try {
      const row = await processSnapshot(pids);
      if (previous && row.snapshots.every((item, index) => item.start === previous.snapshots[index].start)) {
        const delta = row.snapshots.reduce((sum, item, index) => sum + item.ticks - previous.snapshots[index].ticks, 0);
        cpu.push(delta / ticksPerSecond / ((row.at - previous.at) / 1000) * 100);
      }
      rows.push(row); previous = row;
    } catch { unavailableSamples += 1; previous = undefined; }
  };
  await collect();
  let pending = Promise.resolve();
  const timer = setInterval(() => { pending = pending.then(collect); }, intervalMs);
  return { async stop() {
    clearInterval(timer); await pending; await collect();
    return { pids, samples: rows.length, unavailableSamples, intervalMs,
      peakRssBytes: rows.length ? Math.max(...rows.map(row => row.rssBytes)) : null,
      cpuPercentOfOneCore: distribution(cpu),
      note: 'RSS is summed across declared PIDs (shared pages may be counted twice); CPU 100% means one core. Workers must be explicitly included.' };
  } };
}

export async function measureRecovery({ adapter, command, deadlineMs = 120000, pollMs = 1000, prompt = syntheticPrompt }) {
  positive('deadlineMs', deadlineMs); positive('pollMs', pollMs);
  if (!Array.isArray(command) || !command.length || command.some(value => typeof value !== 'string' || !value)) throw new Error('recovery command must be a nonempty JSON string array');
  const started = performance.now();
  const commandOk = await new Promise(resolve => {
    const child = spawn(command[0], command.slice(1), { stdio: 'ignore', shell: false });
    const timer = setTimeout(() => { child.kill('SIGKILL'); resolve(false); }, deadlineMs);
    child.once('error', () => { clearTimeout(timer); resolve(false); });
    child.once('exit', code => { clearTimeout(timer); resolve(code === 0); });
  });
  const commandMs = performance.now() - started;
  if (!commandOk) return { ok: false, error: 'restart_command_failed', commandMs, recoveryMs: null, attempts: 0 };
  let attempts = 0;
  while (performance.now() - started < deadlineMs) {
    attempts += 1;
    const remaining = Math.max(1, Math.floor(deadlineMs - (performance.now() - started)));
    const sample = await adapter.generate(prompt, { deadlineMs: Math.min(15000, remaining) });
    if (sample.ok) return { ok: true, commandMs, recoveryMs: performance.now() - started, attempts,
      definition: 'Time from explicit restart command start to first completed synthetic inference.' };
    await sleep(Math.min(pollMs, Math.max(0, deadlineMs - (performance.now() - started))));
  }
  return { ok: false, error: 'recovery_deadline_exceeded', commandMs, recoveryMs: null, attempts };
}

export async function runBenchmark({ adapter, runtime = adapter.runtime, iterations = 20, warmups = 2, deadlineMs = 15000,
  prompt = syntheticPrompt, pids = [], modelVersion = null, deployment = 'local', runtimeVersion = null, recoveryCommand = null, recoveryDeadlineMs = 120000 }) {
  positive('iterations', iterations); positive('warmups', warmups, 0); positive('deadlineMs', deadlineMs);
  if (!['local', 'oracle'].includes(deployment)) throw new Error('deployment must be local or oracle');
  const sampler = await createResourceSampler({ pids });
  const warmupSamples = [];
  const samples = [];
  let resourceResult;
  try {
    for (let i = 0; i < warmups; i += 1) warmupSamples.push(await adapter.generate(prompt, { deadlineMs }));
    for (let i = 0; i < iterations; i += 1) samples.push(await adapter.generate(prompt, { deadlineMs }));
  } finally { resourceResult = await sampler.stop(); }
  const synthetic = runtime === 'mock';
  const report = { schemaVersion: 1, recordedAt: new Date().toISOString(),
    evidence: { kind: synthetic ? 'local_synthetic_mock' : deployment === 'oracle' ? 'operator_attested_oracle_runtime' : 'local_runtime',
      targetModelMeasured: !synthetic && samples.some(sample => sample.ok), oracleLocationVerifiedByHarness: false,
      note: synthetic ? 'Synthetic timing checks only. No model or Oracle hardware was measured.' : 'Local loopback runtime measured. Oracle location is operator supplied, not independently verified.' },
    configuration: { runtime, model: adapter.model, modelVersion, runtimeVersion, deployment, iterations, warmups, deadlineMs,
      maxConcurrency: 1, promptUtf8Bytes: Buffer.byteLength(prompt), outputTextStored: false },
    observedHost: { platform: platform(), architecture: arch(), observedLogicalCpuCount: cpus().length,
      osVisibleTotalMemoryBytes: totalmem(), osVisibleFreeMemoryBytes: freemem(),
      note: 'OS observations of this benchmark host. Does not establish Oracle OCPUs, VM entitlement, container quota, or free-tier availability.' },
    warmupSamples, samples, summary: summarize(samples),
    resources: { runtime: resourceResult, note: pids.length ? 'Only declared target PIDs are sampled. Check worker coverage and unavailable samples.' : 'Runtime RSS/CPU not measured: no target PID list supplied.' },
    recovery: recoveryCommand ? await measureRecovery({ adapter, command: recoveryCommand, deadlineMs: recoveryDeadlineMs }) : null };
  return report;
}

async function main(args) {
  const options = {};
  const allowed = new Set(['runtime', 'url', 'model', 'model-version', 'runtime-version', 'deployment', 'iterations', 'warmups', 'deadline-ms', 'max-tokens', 'pid', 'prompt-file', 'output', 'recovery-command-json', 'recovery-deadline-ms']);
  for (let i = 0; i < args.length; i += 2) {
    const name = args[i].replace(/^--/, '');
    if (!args[i].startsWith('--') || !allowed.has(name) || args[i + 1] === undefined) throw new Error('expected known --option value pairs');
    options[name] = args[i + 1];
  }
  const runtime = options.runtime ?? 'mock';
  const adapter = runtime === 'mock' ? createMockAdapter() : createRuntimeAdapter({ runtime, url: options.url ?? (runtime === 'ollama' ? 'http://127.0.0.1:11434' : 'http://127.0.0.1:8080'),
    model: options.model, maxTokens: Number(options['max-tokens'] ?? 128) });
  const report = await runBenchmark({ adapter, runtime, iterations: Number(options.iterations ?? 20), warmups: Number(options.warmups ?? 2),
    deadlineMs: Number(options['deadline-ms'] ?? 15000), pids: options.pid ? options.pid.split(',').map(Number) : [],
    prompt: options['prompt-file'] ? await readFile(options['prompt-file'], 'utf8') : syntheticPrompt,
    modelVersion: options['model-version'] ?? null, runtimeVersion: options['runtime-version'] ?? null, deployment: options.deployment ?? 'local',
    recoveryCommand: options['recovery-command-json'] ? JSON.parse(options['recovery-command-json']) : null,
    recoveryDeadlineMs: Number(options['recovery-deadline-ms'] ?? 120000) });
  const json = `${JSON.stringify(report, null, 2)}\n`;
  if (options.output) await writeFile(options.output, json, { mode: 0o600 });
  else process.stdout.write(json);
  if (report.summary.failed || report.warmupSamples.some(sample => !sample.ok) || report.recovery?.ok === false) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch(error => {
    // CLI errors never print arbitrary runtime payloads, prompts, or subprocess output.
    const safe = /^(runtime|Ollama|deployment|iterations|warmups|deadlineMs|maxTokens|intervalMs|pid|recovery command|expected known)/.test(error.message);
    process.stderr.write(`${safe ? error.message : 'Benchmark configuration or filesystem error'}\n`); process.exitCode = 1;
  });
}
