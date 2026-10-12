begin;
create or replace function private.media_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='DELETE' then
  perform id from public.content where id=old.content_id for update;
  if exists(select 1 from public.content where id=old.content_id and state in ('published','scheduled')) then
   raise exception 'Unpublish before changing media' using errcode='42501';
  end if;
  return old;
 end if;
 -- Serialize attachment/edit decisions with publication. UUID order avoids
 -- opposite parent lock ordering when moving between two drafts.
 perform id from public.content
 where id=new.content_id or (tg_op='UPDATE' and id=old.content_id)
 order by id for update;
 if tg_op='INSERT' then
  if current_user not in ('postgres','supabase_admin','service_role') and
   (new.owner_id is distinct from auth.uid() or new.scan_status<>'pending' or new.rights_status<>'pending') then
    raise exception 'Uploads must be owned and quarantined' using errcode='42501';
  end if;
 else
  if (new.owner_id,new.storage_path,new.mime_type,new.byte_size) is distinct from (old.owner_id,old.storage_path,old.mime_type,old.byte_size) then
   raise exception 'Media identity is immutable; upload a new asset' using errcode='42501';
  end if;
  if new.scan_status is distinct from old.scan_status and current_user not in ('postgres','supabase_admin','service_role') then
   raise exception 'Only scanner service may clear quarantine' using errcode='42501';
  end if;
  if (new.rights_status is distinct from old.rights_status or new.restricted is distinct from old.restricted) and current_user not in ('postgres','supabase_admin') and not private.has_role(array['founder']) then
   raise exception 'Founder must verify media rights' using errcode='42501';
  end if;
 end if;
 if exists(select 1 from public.content where (id=new.content_id or (tg_op='UPDATE' and id=old.content_id)) and state in ('published','scheduled')) then
  raise exception 'Unpublish before changing media' using errcode='42501';
 end if;
 new.updated_at=now(); return new;
end $$;

create or replace function private.delete_own_account() returns void language plpgsql security definer set search_path='' as $$
declare target uuid:=auth.uid();
begin
 if not private.active_user() then raise exception 'Active account required' using errcode='42501'; end if;
 if private.has_role(array['founder','editor']) then raise exception 'Transfer editorial ownership before account deletion' using errcode='23514'; end if;
 insert into private.media_deletion_jobs(user_id,storage_paths)
 select target,jsonb_agg(storage_path) from public.media_assets where owner_id=target having count(*)>0;
 update public.profiles set deleted_at=now(),display_name='',onboarding_completed_at=null where id=target;
 delete from public.reflections where user_id=target;
 delete from public.bookmarks where user_id=target;
 delete from public.playback_progress where user_id=target;
 delete from public.pathway_progress where user_id=target;
 delete from public.studio_ideas where user_id=target;
 delete from public.ai_tasks where user_id=target;
 delete from public.consents where user_id=target;
 delete from public.preferences where user_id=target;
 delete from public.entitlements where user_id=target;
 delete from public.rate_counters where user_id=target;
 delete from auth.sessions where user_id=target;
 delete from auth.identities where user_id=target;
 update auth.users set banned_until='infinity'::timestamptz,email=null,phone=null,encrypted_password=null,
  raw_user_meta_data='{}'::jsonb,raw_app_meta_data='{}'::jsonb,
  confirmation_token='',recovery_token='',email_change='',email_change_token_new='',
  phone_change='',phone_change_token='',updated_at=now() where id=target;
 insert into public.audit_events(actor_id,action,entity_type,entity_id) values(target,'account.deleted','profile',target);
end $$;

alter table private.media_deletion_jobs drop constraint media_deletion_jobs_status_check;
alter table private.media_deletion_jobs add constraint media_deletion_jobs_status_check check(status in ('pending','processing','completed','blocked_review'));
alter table private.media_deletion_jobs add column attempts integer not null default 0;
alter table private.media_deletion_jobs add column claimed_at timestamptz;
alter table private.media_deletion_jobs add column last_error text;

create function private.claim_media_deletions(p_limit integer default 20)
returns table(id uuid,user_id uuid,storage_paths jsonb,status text) language plpgsql security definer set search_path='' as $$
declare j private.media_deletion_jobs;
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'Server role required' using errcode='42501'; end if;
 if p_limit not between 1 and 100 then raise exception 'Invalid batch size' using errcode='23514'; end if;
 for j in select * from private.media_deletion_jobs jobs
  where jobs.status='pending' or (jobs.status='processing' and jobs.claimed_at<now()-interval '10 minutes')
  order by jobs.created_at limit p_limit for update skip locked loop
  -- Linked editorial assets need an explicit retention/ownership review.
  if exists(select 1 from public.media_assets m where m.owner_id=j.user_id and m.content_id is not null) then
   update private.media_deletion_jobs jobs set status='blocked_review',last_error='Editorial retention review required' where jobs.id=j.id;
   id=j.id; user_id=j.user_id; storage_paths='[]'::jsonb; status='blocked_review'; return next; continue;
  end if;
  update private.media_deletion_jobs jobs set status='processing',claimed_at=now(),attempts=jobs.attempts+1,last_error=null where jobs.id=j.id;
  id=j.id; user_id=j.user_id; storage_paths=j.storage_paths; status='processing'; return next;
 end loop;
end $$;
create function public.claim_media_deletions(p_limit integer default 20)
returns table(id uuid,user_id uuid,storage_paths jsonb,status text) language sql security invoker set search_path='' as $$ select * from private.claim_media_deletions(p_limit) $$;

create function private.complete_media_deletion(p_job_id uuid,p_error text default null) returns void language plpgsql security definer set search_path='' as $$
declare j private.media_deletion_jobs;
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'Server role required' using errcode='42501'; end if;
 select * into j from private.media_deletion_jobs where id=p_job_id for update;
 if not found or j.status<>'processing' then raise exception 'Claimed job required' using errcode='23514'; end if;
 if p_error is not null then
  update private.media_deletion_jobs set status='pending',last_error=left(p_error,240),claimed_at=null where id=j.id; return;
 end if;
 if exists(select 1 from public.media_assets where owner_id=j.user_id and content_id is not null) then
  update private.media_deletion_jobs set status='blocked_review',last_error='Editorial retention review required' where id=j.id; return;
 end if;
 delete from public.media_assets where owner_id=j.user_id and content_id is null and storage_path in (select jsonb_array_elements_text(j.storage_paths));
 update private.media_deletion_jobs set status='completed',completed_at=now(),last_error=null where id=j.id;
end $$;
create function public.complete_media_deletion(p_job_id uuid,p_error text default null) returns void language sql security invoker set search_path='' as $$ select private.complete_media_deletion(p_job_id,p_error) $$;
revoke execute on function public.claim_media_deletions(integer),public.complete_media_deletion(uuid,text),private.claim_media_deletions(integer),private.complete_media_deletion(uuid,text) from public;
grant execute on function public.claim_media_deletions(integer),public.complete_media_deletion(uuid,text),private.claim_media_deletions(integer),private.complete_media_deletion(uuid,text) to service_role;

drop trigger media_guard on public.media_assets;
create trigger media_guard before insert or update or delete on public.media_assets for each row execute function private.media_guard();
alter policy content_authorized_read on public.content using((select private.has_role(array['founder','editor'])) or private.can_read_content(id));
create or replace function private.record_version() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='INSERT' or new.version<>old.version then
  insert into public.content_versions(content_id,version,snapshot,created_by) values(new.id,new.version,to_jsonb(new)||jsonb_build_object('media_assets',coalesce((select jsonb_agg(to_jsonb(m) order by m.id) from public.media_assets m where m.content_id=new.id),'[]'::jsonb)),auth.uid());
  insert into public.audit_events(actor_id,action,entity_type,entity_id,metadata)
   values(auth.uid(),case when tg_op='INSERT' then 'content.created' else 'content.edited' end,'content',new.id,jsonb_build_object('version',new.version));
 end if;
 return new;
end $$;

create or replace function private.invalidate_media_approval() returns trigger language plpgsql security definer set search_path='' as $$
declare target uuid;
begin
 for target in select distinct c.id from public.content c
  where c.id=case when tg_op='DELETE' then old.content_id else new.content_id end
    or (tg_op='UPDATE' and c.id=old.content_id) order by c.id loop
  update public.content set founder_approved=false,state='draft',scheduled_at=null,published_at=null,version=version+1 where id=target;
  insert into public.audit_events(actor_id,action,entity_type,entity_id,metadata)
   values(auth.uid(),'media.changed','content',target,jsonb_build_object('media_id',case when tg_op='DELETE' then old.id else new.id end,'operation',tg_op,'version',(select version from public.content where id=target)));
 end loop;
 return case when tg_op='DELETE' then old else new end;
end $$;

commit;
