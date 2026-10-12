#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"
require_runtime
[[ "${1:-}" == "$RUNTIME" ]] || fail 'Warmup runtime does not match configuration'
[[ "$RUNTIME" != mock ]] || exit 0
[[ "${WARM_TIMEOUT_SECONDS:-180}" =~ ^[0-9]+$ ]] || fail 'Warm timeout must be numeric'
WARM_TIMEOUT_SECONDS="${WARM_TIMEOUT_SECONDS:-180}"
(( WARM_TIMEOUT_SECONDS > 0 && WARM_TIMEOUT_SECONDS <= 180 )) || fail 'Warm timeout must fit within runtime startup timeout'
deadline=$((SECONDS + WARM_TIMEOUT_SECONDS))
if [[ "$RUNTIME" == ollama ]]; then health_path=/api/tags; else health_path=/health; fi
until curl --fail --silent --show-error --connect-timeout 2 --max-time 3 "$RUNTIME_URL$health_path" >/dev/null 2>&1; do
  (( SECONDS < deadline )) || fail 'Runtime did not become live within the warmup deadline'
  sleep 1
done
remaining=$((deadline - SECONDS))
(( remaining > 0 )) || fail 'Warmup deadline exhausted'
if [[ "$RUNTIME" == ollama ]]; then
  # Fixed synthetic probe only. keep_alive=-1 retains the single approved model.
  printf '{"model":"%s","prompt":"Reply with OK.","stream":false,"keep_alive":-1,"options":{"num_predict":1}}' "$MODEL" |
    curl --fail --silent --show-error --connect-timeout 2 --max-time "$remaining" \
      -H 'Content-Type: application/json' --data-binary @- "$RUNTIME_URL/api/generate" |
      /usr/bin/node "$SCRIPT_DIR/validate-warm.mjs" "$RUNTIME"
else
  printf '%s' '{"prompt":"Reply with OK.","n_predict":1,"stream":false}' |
    curl --fail --silent --show-error --connect-timeout 2 --max-time "$remaining" \
      -H 'Content-Type: application/json' --data-binary @- "$RUNTIME_URL/completion" |
      /usr/bin/node "$SCRIPT_DIR/validate-warm.mjs" "$RUNTIME"
fi
printf '%s\n' 'Runtime warmup completed; validate residency and performance on the actual host.'
