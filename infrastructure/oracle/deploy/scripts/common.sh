#!/usr/bin/env bash
# Shared helpers. Never source operator configuration as executable shell code.
set -euo pipefail
umask 077

fail() { printf '%s\n' "$*" >&2; exit 1; }

load_config() {
  local file="$1" key value mode owner
  [[ -f "$file" && ! -L "$file" ]] || fail "Missing regular configuration file: $file"
  owner="$(stat -c '%u' "$file")"
  mode="$(stat -c '%a' "$file")"
  [[ "$owner" == 0 && "$mode" == 600 ]] || fail "Configuration must be root-owned mode 0600: $file"
  while IFS='=' read -r key value || [[ -n "$key" ]]; do
    [[ -z "$key" || "$key" == \#* ]] && continue
    case "$key" in
      RUNTIME|RUNTIME_URL|MODEL|MODEL_PATH|RUNTIME_THREADS|CONTEXT_SIZE|WARM_TIMEOUT_SECONDS|HOST|PORT|GATEWAY_TOKEN|MAX_CONCURRENT|MAX_QUEUED|DEADLINE_MS|REGISTRY_FILE) ;;
      *) fail "Unexpected configuration key in $file" ;;
    esac
    [[ -n "$value" && "$value" != *[[:space:]]* && "$value" != *\"* && "$value" != *\'* ]] || fail "Use unquoted nonempty KEY=value configuration in $file"
    export "$key=$value"
  done < "$file"
}

require_runtime() {
  case "${RUNTIME:-}" in mock|ollama|llama.cpp) ;; *) fail 'RUNTIME must be mock, ollama, or llama.cpp' ;; esac
  case "${RUNTIME_URL:-}" in
    http://127.0.0.1:11434) [[ "$RUNTIME" == ollama || "$RUNTIME" == mock ]] || fail 'llama.cpp URL must use its loopback port' ;;
    http://127.0.0.1:8080) [[ "$RUNTIME" == llama.cpp || "$RUNTIME" == mock ]] || fail 'Ollama URL must use its loopback port' ;;
    *) fail 'Runtime URL must use an approved loopback runtime port' ;;
  esac
  if [[ "$RUNTIME" != mock ]]; then
    [[ "${MODEL:-}" =~ ^[A-Za-z0-9][A-Za-z0-9._:/-]*$ && "$MODEL" != *REPLACE* ]] || fail 'Supply the approved installed MODEL identifier'
  fi
}

require_gateway() {
  [[ "${HOST:-}" == 127.0.0.1 && "${PORT:-}" == 8787 ]] || fail 'Gateway must bind 127.0.0.1:8787'
  [[ "${GATEWAY_TOKEN:-}" =~ ^[A-Za-z0-9_-]{32,}$ && "$GATEWAY_TOKEN" != *REPLACE* ]] || fail 'Supply a unique secret service token of at least 32 characters'
  [[ "${DEADLINE_MS:-}" =~ ^[0-9]+$ ]] || fail 'DEADLINE_MS must be numeric'
  (( DEADLINE_MS > 0 && DEADLINE_MS <= 25000 )) || fail 'Deadline must leave drain time within systemd TimeoutStopSec=35'
  [[ "${MAX_CONCURRENT:-}" == 1 && "${MAX_QUEUED:-}" =~ ^[0-9]+$ ]] || fail 'Start with one active request and a bounded queue'
  (( MAX_QUEUED <= 8 )) || fail 'Initial queue must not exceed eight requests'
}

gateway_curl() {
  # Secret travels through curl stdin rather than argv, process listings or output.
  printf 'header = "Authorization: Bearer %s"\n' "$GATEWAY_TOKEN" |
    curl --config - --silent --show-error --connect-timeout 2 --max-time 5 "$@"
}
