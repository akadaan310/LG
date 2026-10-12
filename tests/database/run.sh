#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
container="${ADEQUATE_DB_CONTAINER:-supabase_db_LG}"
docker exec -i "$container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 < tests/database/security.sql
