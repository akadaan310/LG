#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"
require_runtime
[[ "$RUNTIME" == llama.cpp ]] || fail 'llama.cpp unit requires RUNTIME=llama.cpp'
[[ "${MODEL_PATH:-}" == /var/lib/adequate-inference/models/* && "$MODEL_PATH" != *REPLACE* && -r "$MODEL_PATH" ]] || fail 'Supply a readable approved GGUF under the model directory'
[[ "${RUNTIME_THREADS:-}" =~ ^[0-9]+$ && "${CONTEXT_SIZE:-}" =~ ^[0-9]+$ ]] || fail 'Set threads from measured OCPU headroom and an approved context size'
(( RUNTIME_THREADS > 0 && CONTEXT_SIZE >= 512 )) || fail 'Invalid runtime budget'
[[ -x /usr/local/bin/llama-server ]] || fail 'Install the reviewed, pinned llama-server binary first'
exec /usr/local/bin/llama-server --host 127.0.0.1 --port 8080 \
  --model "$MODEL_PATH" --threads "$RUNTIME_THREADS" --ctx-size "$CONTEXT_SIZE" \
  --parallel 1 --n-gpu-layers 0 --log-disable
