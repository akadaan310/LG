-- Destructive development/staging rollback, always take and verify a backup first.
-- Refuses to orphan Storage objects. Drain recordings through the Storage API.
begin;
do $$ begin
 if exists(select 1 from storage.objects where bucket_id='recordings') then
  raise exception 'Drain recordings via Storage API before foundation rollback';
 end if;
end $$;
drop policy if exists adequate_recordings_upload on storage.objects;
drop policy if exists adequate_recordings_access on storage.objects;
drop policy if exists adequate_recordings_delete on storage.objects;
-- Retain the empty private bucket: Storage protects SQL deletion, and all bytes
-- must be removed through its API. Reapply restores its policy/configuration.
drop trigger if exists adequate_profile_bootstrap on auth.users;
drop function if exists public.active_account();
drop function if exists public.transition_content(uuid,text,timestamptz);
drop function if exists public.rollback_content(uuid,integer);
drop function if exists public.consume_rate_limit(text,integer,integer);
drop function if exists public.consume_auth_rate_limit(text,integer,integer);
drop function if exists public.publish_due_content();
drop function if exists public.delete_own_account();
drop function if exists public.claim_media_deletions(integer);
drop function if exists public.complete_media_deletion(uuid,text);
drop function if exists private.transition_content(uuid,text,timestamptz);
drop function if exists private.rollback_content(uuid,integer);
drop function if exists private.publish_due_content();
drop function if exists private.consume_rate_limit(text,integer,integer);
drop function if exists private.consume_auth_rate_limit(text,integer,integer);
drop function if exists private.delete_own_account();
drop function if exists private.claim_media_deletions(integer);
drop function if exists private.complete_media_deletion(uuid,text);
drop table if exists public.pathway_progress,public.pathway_items,public.pathways,
 public.playback_progress,public.bookmarks,public.reflections,public.studio_ideas,
 public.content_tags,public.content_versions,public.media_assets,public.reviews,
 public.publications,public.audit_events,public.ai_tasks,public.feature_flags,
 public.rate_counters,public.content,public.consents,public.preferences,
 public.user_roles,public.entitlements,public.profiles cascade;
drop table if exists private.auth_rate_counters,private.media_deletion_jobs;
drop function if exists private.bootstrap_profile();
drop function if exists private.content_guard();
drop function if exists private.record_version();
drop function if exists private.media_guard();
drop function if exists private.invalidate_media_approval();
drop function if exists private.touch_updated_at();
drop function if exists private.immutable();
drop function if exists private.can_read_media(uuid);
drop function if exists private.can_manage_media(uuid);
drop function if exists private.can_read_content(uuid);
drop function if exists private.has_membership();
drop function if exists private.has_role(text[]);
drop function if exists private.active_user();
-- Retain an existing private schema and the secure default privilege changes.
commit;
