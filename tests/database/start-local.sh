#!/usr/bin/env bash
# Minimal real Supabase services for constrained/VFS Docker workspaces.
# This is local test infrastructure, never a production deployment script.
set -euo pipefail
cd "$(dirname "$0")/../.."
if docker inspect adequate_db >/dev/null 2>&1; then
  echo 'Local adequate_db already exists. Reuse it; this script will not replace its data.'
  exit 1
fi
docker network inspect adequate-local >/dev/null 2>&1 || docker network create adequate-local >/dev/null
docker run -d --name adequate_db --network adequate-local -e POSTGRES_PASSWORD=adequate-local-only -p 127.0.0.1:54322:5432 postgres:17-alpine >/dev/null
for attempt in $(seq 1 30); do
  if docker exec adequate_db pg_isready -U postgres >/dev/null 2>&1; then break; fi
  sleep 1
done
docker exec -i adequate_db psql -U postgres -d postgres -v ON_ERROR_STOP=1 < tests/database/local-bootstrap.sql >/dev/null
node tests/database/create-local-env.mjs
set -a
source /tmp/adequate-local.env
set +a
docker run -d --name adequate_mail --network adequate-local -p 127.0.0.1:54324:8025 public.ecr.aws/supabase/mailpit:v1.31.3 >/dev/null
docker run -d --name adequate_auth --network adequate-local -p 127.0.0.1:54331:9999 \
 -e GOTRUE_API_HOST=0.0.0.0 -e GOTRUE_API_PORT=9999 \
 -e API_EXTERNAL_URL=http://127.0.0.1:54321/auth/v1 -e GOTRUE_SITE_URL=http://127.0.0.1:3100 \
 -e GOTRUE_URI_ALLOW_LIST=http://127.0.0.1:3100/api/auth/callback,http://localhost:3100/api/auth/callback,adequate://auth/callback \
 -e GOTRUE_DB_DRIVER=postgres \
 -e GOTRUE_DB_DATABASE_URL=postgres://supabase_auth_admin:adequate-local-only@adequate_db:5432/postgres \
 -e GOTRUE_JWT_SECRET="$JWT_SECRET" -e GOTRUE_JWT_EXP=600 -e GOTRUE_JWT_AUD=authenticated \
 -e GOTRUE_JWT_ADMIN_ROLES=service_role -e GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated \
 -e GOTRUE_PASSWORD_MIN_LENGTH=12 -e GOTRUE_DISABLE_SIGNUP=false -e GOTRUE_MAILER_AUTOCONFIRM=false \
 -e GOTRUE_SMTP_HOST=adequate_mail -e GOTRUE_SMTP_PORT=1025 -e GOTRUE_SMTP_ADMIN_EMAIL=local@example.invalid \
 -e GOTRUE_MAILER_URLPATHS_CONFIRMATION=/auth/v1/verify -e GOTRUE_MAILER_URLPATHS_RECOVERY=/auth/v1/verify \
 public.ecr.aws/supabase/gotrue:v2.197.0 >/dev/null
docker run -d --name adequate_storage --network adequate-local -p 127.0.0.1:54332:5000 \
 -e ANON_KEY="$ANON_KEY" -e SERVICE_KEY="$SERVICE_ROLE_KEY" -e PGRST_JWT_SECRET="$JWT_SECRET" \
 -e DATABASE_URL=postgres://supabase_storage_admin:adequate-local-only@adequate_db:5432/postgres \
 -e POSTGREST_URL=http://adequate_rest:3000 -e PGOPTIONS='-c search_path=storage,public' \
 -e FILE_SIZE_LIMIT=52428800 -e STORAGE_BACKEND=file -e FILE_STORAGE_BACKEND_PATH=/var/lib/storage \
 -e TENANT_ID=adequate-local -e REGION=local -e GLOBAL_S3_BUCKET=local \
 public.ecr.aws/supabase/storage-api:v1.79.36 >/dev/null
for attempt in $(seq 1 60); do
  if docker exec adequate_db psql -U postgres -d postgres -Atc "select to_regclass('auth.sessions') is not null and to_regclass('storage.objects') is not null" | rg -qx t; then break; fi
  sleep 1
done
migration_versions=()
for migration in supabase/migrations/*.sql; do
  docker exec -i adequate_db psql -U postgres -d postgres -v ON_ERROR_STOP=1 < "$migration" >/dev/null
  migration_name="$(basename "$migration")"
  migration_versions+=("${migration_name%%_*}")
done
docker run -d --name adequate_rest --network adequate-local -p 127.0.0.1:54333:3000 \
 -e PGRST_DB_URI=postgres://authenticator:adequate-local-only@adequate_db:5432/postgres \
 -e PGRST_DB_SCHEMAS=public -e PGRST_DB_ANON_ROLE=anon -e PGRST_JWT_SECRET="$JWT_SECRET" \
 -e PGRST_DB_MAX_ROWS=1000 public.ecr.aws/supabase/postgrest:v16.4 >/dev/null
npx supabase migration repair "${migration_versions[@]}" --status applied --db-url "$DATABASE_URL"
echo 'Actual local Auth, Storage and REST ready on 54331/54332/54333. Use the local development proxy on 54321.'
