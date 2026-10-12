-- Vanilla PostgreSQL equivalent of Supabase bootstrap roles/helpers. GoTrue and
-- Storage create their own real schemas via their shipped migrations afterward.
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;
create role authenticator login noinherit password 'adequate-local-only';
grant anon,authenticated,service_role to authenticator;
create role supabase_auth_admin login noinherit createrole password 'adequate-local-only';
create role supabase_storage_admin login noinherit bypassrls password 'adequate-local-only';
grant anon,authenticated,service_role to supabase_storage_admin;
create schema auth authorization supabase_auth_admin;
create schema storage authorization supabase_storage_admin;
grant usage on schema public,auth,storage to anon,authenticated,service_role;
alter default privileges for role supabase_storage_admin in schema storage grant select,insert,update,delete on tables to anon,authenticated,service_role;
grant usage,create on schema public to supabase_storage_admin;
alter role supabase_auth_admin set search_path to auth;
create function auth.uid() returns uuid language sql stable as $$
 select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),
  (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub'))::uuid
$$;
create function auth.jwt() returns jsonb language sql stable as $$
 select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb
$$;
create function auth.role() returns text language sql stable as $$ select auth.jwt()->>'role' $$;
grant execute on all functions in schema auth to anon,authenticated,service_role;
alter function auth.uid() owner to supabase_auth_admin;
alter function auth.role() owner to supabase_auth_admin;
alter function auth.jwt() owner to supabase_auth_admin;
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
