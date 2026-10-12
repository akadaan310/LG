import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const benchmark = await import('../../infrastructure/oracle/benchmark.mjs').catch(error => {
  if (error.code === 'ERR_MODULE_NOT_FOUND') return {};
  throw error;
});
function api(name) {
  assert.equal(typeof benchmark[name], 'function', `benchmark exports ${name}`);
  return benchmark[name];
}
async function withServer(handler, run) {
  const server = createServer(handler);
  server.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}

test('latency summary computes nearest-rank p50 and p95 from successful samples', () => {
  const result = api('summarize')([
    { ok: true, latencyMs: 20, ttftMs: 5, generatedTokens: 10, generationMs: 10 },
    { ok: false, latencyMs: 999, error: 'timeout' },
    { ok: true, latencyMs: 40, ttftMs: 10, generatedTokens: 20, generationMs: 20 },
  ]);
  assert.equal(result.latencyMs.p50, 20);
  assert.equal(result.latencyMs.p95, 40);
  assert.equal(result.ttftMs.p50, 5);
  assert.equal(result.tokensPerSecond.p95, 1000);
  assert.deepEqual({ successful: result.successful, failed: result.failed }, { successful: 2, failed: 1 });
});

test('summary leaves unreported token throughput unknown', () => {
  const result = api('summarize')([{ ok: true, latencyMs: 10, ttftMs: 1, generatedTokens: null, generationMs: null }]);
  assert.equal(result.tokensPerSecond, null);
});

test('raw runtime adapter rejects public hosts and non-HTTP schemes', () => {
  for (const url of ['http://example.com', 'http://0.0.0.0:11434', 'file:///tmp/model', 'http://localhost.evil.test']) {
    assert.throws(() => api('createRuntimeAdapter')({ runtime: 'ollama', url, model: 'fixture' }), /loopback|HTTP/i);
  }
});

test('llama.cpp adapter reads fragmented SSE and authoritative final token counts', async () => {
  await withServer(async (req, res) => {
    assert.equal(req.url, '/completion');
    let body = '';
    for await (const chunk of req) body += chunk;
    const request = JSON.parse(body);
    assert.equal(request.stream, true);
    assert.equal(request.n_predict, 8);
    res.writeHead(200, { 'content-type': 'text/event-stream' });
    res.write('data: {"content":"fi');
    res.write('xture","stop":false}\n\n');
    res.end('data: {"content":"","stop":true,"timings":{"predicted_n":3,"predicted_ms":12}}\n\n');
  }, async url => {
    const result = await api('createRuntimeAdapter')({ runtime: 'llama.cpp', url, maxTokens: 8 }).generate('fixture prompt', { deadlineMs: 1000 });
    assert.equal(result.generatedTokens, 3);
    assert.equal(result.generationMs, 12);
    assert.equal(result.ok, true);
    assert.ok(result.ttftMs >= 0);
    assert.ok(result.latencyMs >= result.ttftMs);
    assert.equal('text' in result, false, 'reports do not store generated or private text');
  });
});

test('Ollama adapter keeps model resident and reads final NDJSON timing', async () => {
  await withServer(async (req, res) => {
    assert.equal(req.url, '/api/generate');
    let body = '';
    for await (const chunk of req) body += chunk;
    const request = JSON.parse(body);
    assert.equal(request.model, 'fixture-only');
    assert.equal(request.keep_alive, -1);
    assert.equal(request.stream, true);
    res.writeHead(200, { 'content-type': 'application/x-ndjson' });
    res.write('{"response":"fixture","done":false}\n');
    res.end('{"response":"","done":true,"eval_count":4,"eval_duration":20000000,"load_duration":1000000}\n');
  }, async url => {
    const result = await api('createRuntimeAdapter')({ runtime: 'ollama', url, model: 'fixture-only' }).generate('fixture prompt', { deadlineMs: 1000 });
    assert.equal(result.generatedTokens, 4);
    assert.equal(result.generationMs, 20);
    assert.equal(result.loadMs, 1);
  });
});

test('adapter aborts hung responses by request deadline', async () => {
  await withServer((_req, res) => res.writeHead(200), async url => {
    const result = await api('createRuntimeAdapter')({ runtime: 'ollama', url, model: 'fixture-only' }).generate('private prompt', { deadlineMs: 25 });
    assert.equal(result.ok, false);
    assert.equal(result.error, 'deadline_exceeded');
    assert.ok(result.latencyMs < 1000);
    assert.equal(JSON.stringify(result).includes('private prompt'), false);
  });
});

test('adapter rejects incomplete stream instead of reporting a successful measurement', async () => {
  await withServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'application/x-ndjson' });
    res.end('{"response":"partial","done":false}\n');
  }, async url => {
    const result = await api('createRuntimeAdapter')({ runtime: 'ollama', url, model: 'fixture-only' }).generate('private prompt', { deadlineMs: 1000 });
    assert.equal(result.ok, false);
    assert.equal(result.error, 'incomplete_stream');
  });
});

test('adapter sanitizes runtime errors rather than storing response payloads', async () => {
  await withServer((_req, res) => { res.writeHead(500); res.end('private reflection echoed'); }, async url => {
    const result = await api('createRuntimeAdapter')({ runtime: 'ollama', url, model: 'fixture-only' }).generate('private prompt', { deadlineMs: 1000 });
    assert.equal(result.error, 'http_500');
    assert.equal(JSON.stringify(result).includes('private'), false);
  });
});

test('mock benchmark explicitly marks synthetic measurements and missing runtime resources', async () => {
  const report = await api('runBenchmark')({ adapter: api('createMockAdapter')(), runtime: 'mock', iterations: 3, warmups: 1, deadlineMs: 1000 });
  assert.equal(report.evidence.kind, 'local_synthetic_mock');
  assert.equal(report.evidence.targetModelMeasured, false);
  assert.equal(report.summary.successful, 3);
  assert.equal(report.resources.runtime, null);
  assert.match(report.resources.note, /pid|PID/);
  assert.equal('prompt' in report, false);
});

test('Linux PID sampler measures declared process RSS and CPU without hardware fabrication', async () => {
  if (process.platform !== 'linux') return;
  const sampler = await api('createResourceSampler')({ pids: [process.pid], intervalMs: 10 });
  await new Promise(resolve => setTimeout(resolve, 35));
  const result = await sampler.stop();
  assert.equal(result.pids[0], process.pid);
  assert.ok(result.peakRssBytes > 0);
  assert.ok(result.cpuPercentOfOneCore.mean >= 0);
});

test('recovery records only a successful inference after explicit local command', async () => {
  const result = await api('measureRecovery')({ adapter: api('createMockAdapter')(), command: [process.execPath, '-e', 'process.exit(0)'], deadlineMs: 1000, pollMs: 5 });
  assert.equal(result.ok, true);
  assert.ok(result.recoveryMs >= result.commandMs);
  assert.ok(result.attempts >= 1);
});

test('recovery reports failed restart command instead of successful readiness', async () => {
  const result = await api('measureRecovery')({ adapter: api('createMockAdapter')(), command: [process.execPath, '-e', 'process.exit(3)'], deadlineMs: 1000 });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'restart_command_failed');
});

test('CLI writes a mock-only JSON report and validates numeric options', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'adequate-benchmark-'));
  try {
    const output = join(dir, 'report.json');
    await execFileAsync(process.execPath, ['infrastructure/oracle/benchmark.mjs', '--runtime', 'mock', '--iterations', '2', '--warmups', '1', '--output', output]);
    const report = JSON.parse(await readFile(output, 'utf8'));
    assert.equal(report.evidence.kind, 'local_synthetic_mock');
    assert.equal(report.summary.successful, 2);
    await assert.rejects(execFileAsync(process.execPath, ['infrastructure/oracle/benchmark.mjs', '--iterations', '0']), /iterations/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
