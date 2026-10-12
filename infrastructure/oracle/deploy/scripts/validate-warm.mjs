// Accept only a completed synthetic generation, never print model response content.
let raw = '';
for await (const chunk of process.stdin) {
  raw += chunk;
  if (raw.length > 65536) {
    process.stderr.write('Warmup response exceeded the permitted size.\n');
    process.exit(1);
  }
}
try {
  const response = JSON.parse(raw);
  const valid = process.argv[2] === 'ollama'
    ? response.done === true && response.eval_count > 0 && typeof response.response === 'string'
    : typeof response.content === 'string' &&
      (response.tokens_predicted > 0 || response.timings?.predicted_n > 0) &&
      (response.stop === true || response.stopped_eos === true || response.stopped_limit === true);
  if (response.error || !valid) throw new Error();
} catch {
  process.stderr.write('Warmup did not return a completed valid generation.\n');
  process.exit(1);
}
