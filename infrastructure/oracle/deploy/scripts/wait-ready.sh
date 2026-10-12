#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"
require_runtime
require_gateway
deadline=$((SECONDS + 100))
until curl --fail --silent --show-error --connect-timeout 2 --max-time 3 \
  http://127.0.0.1:8787/health/ready >/dev/null 2>&1; do
  (( SECONDS < deadline )) || fail 'Gateway did not become ready; service startup must fail closed'
  sleep 1
done
printf '%s\n' 'Gateway is ready.'
