#!/usr/bin/env bash
# Mutates services. Use only after the owner authorizes the named maintenance change.
set -euo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"
[[ "${EUID}" == 0 ]] || fail 'Controlled restart requires root on the approved host'
[[ "${1:-}" == --change-id && "${2:-}" =~ ^[A-Za-z0-9._-]+$ && "$#" == 2 ]] || fail 'Usage: restart.sh --change-id APPROVED_CHANGE_ID'
load_config /etc/adequate-inference/runtime.env
load_config /etc/adequate-inference/gateway.env
require_runtime
require_gateway
printf 'Beginning approved maintenance change %s; draining gateway.\n' "$2"
# Stop waits for SIGTERM drain before touching runtime. Caddy returns an unavailable response.
systemctl stop adequate-inference-gateway.service
case "$RUNTIME" in
  ollama) systemctl restart adequate-inference-ollama.service ;;
  llama.cpp) systemctl restart adequate-inference-llama.service ;;
  mock) ;;
esac
# Each runtime ExecStartPost warms the model; gateway ExecStartPost waits for readiness.
systemctl start adequate-inference-gateway.service
"$SCRIPT_DIR/check.sh"
printf 'Maintenance change %s completed.\n' "$2"
