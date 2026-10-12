#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"
[[ "${EUID}" == 0 ]] || fail 'Run on the approved host as root to read protected service configuration'
load_config /etc/adequate-inference/runtime.env
load_config /etc/adequate-inference/gateway.env
require_runtime
require_gateway
for endpoint in /health/live /health/ready /metrics; do
  gateway_curl --fail --output /dev/null "http://127.0.0.1:8787$endpoint"
done
status="$(curl --silent --show-error --connect-timeout 2 --max-time 5 --output /dev/null \
  --write-out '%{http_code}' -H 'Content-Type: application/json' --data '{}' http://127.0.0.1:8787/v1/tasks)"
[[ "$status" == 401 ]] || fail 'Unauthenticated task request was not rejected with 401'
printf '%s\n' 'Local liveness, readiness, metrics and task authentication checks passed.'
printf '%s\n' 'Verify TLS, ingress denial, port binding and residency separately from approved network vantage points.'
