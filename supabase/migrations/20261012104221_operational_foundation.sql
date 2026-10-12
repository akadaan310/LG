-- ADEQUATE foundation. Empty by design; fixtures are isolated transaction tests.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema private revoke execute on functions from public;

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '' check (char_length(display_name) <= 100),
 onboarding_completed_at timestamptz, deleted_at timestamptz,
 created_at timestamptz not null default now()
);
create table public.preferences (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 theme text not null default 'dark' check(theme in ('dark','light','system')),
 ai_enabled boolean not null default false,
 updated_at timestamptz not null default now()
);
create table public.consents (
 user_id uuid references public.profiles(id) on delete cascade,
 purpose text check(purpose in ('ai_processing','external_ai','analytics')),
 granted boolean not null default false, updated_at timestamptz not null default now(),
 primary key(user_id,purpose)
);
create table public.user_roles (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 role text not null default 'member' check(role in ('founder','editor','member'))
);
create table public.entitlements (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 tier text not null default 'free' check(tier in ('free','member','supporter','patron')),
 source text not null default 'none', expires_at timestamptz
);
create table public.content (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug)<=160),
 title text not null check(char_length(trim(title)) between 1 and 240),
 body text not null default '' check(char_length(body)<=100000),
 kind text not null check(kind in ('home','story','principle','essay','audio','membership')),
 state text not null default 'draft' check(state in ('draft','review','approved','scheduled','published','archived')),
 audience text not null default 'public' check(audience in ('public','member')),
 version integer not null default 1 check(version > 0),
 created_by uuid references public.profiles(id) on delete set null default auth.uid(),
 provenance text not null default 'placeholder' check(provenance in ('founder_original','user_authored','ai_assisted','placeholder')),
 rights_verified boolean not null default false, founder_approved boolean not null default false,
 published_at timestamptz, scheduled_at timestamptz,
 updated_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create index content_discovery_idx on public.content(state,audience,published_at desc);
create index content_created_by_idx on public.content(created_by);
create table public.content_versions (
 content_id uuid references public.content(id) on delete restrict,
 version integer not null, snapshot jsonb not null,
 created_by uuid references public.profiles(id) on delete set null,
 created_at timestamptz not null default now(), primary key(content_id,version)
);
create table public.media_assets (
 id uuid primary key default gen_random_uuid(),
 content_id uuid references public.content(id) on delete restrict,
 owner_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
 storage_path text not null unique,
 mime_type text not null check(mime_type in ('audio/mpeg','audio/mp4','audio/wav','audio/x-wav','audio/ogg','audio/webm')),
 byte_size bigint not null check(byte_size between 1 and 52428800),
 rights_status text not null default 'pending' check(rights_status in ('pending','verified','rejected')),
 rights_notes text not null default '' check(char_length(rights_notes)<=4000),
 scan_status text not null default 'pending' check(scan_status in ('pending','clean','rejected')),
 transcript text not null default '' check(char_length(transcript)<=100000),
 chapters jsonb not null default '[]'::jsonb check(jsonb_typeof(chapters)='array'),
 restricted boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(storage_path like owner_id::text || '/%')
);
create index media_content_idx on public.media_assets(content_id);
create index media_owner_idx on public.media_assets(owner_id);
create table public.content_tags (
 content_id uuid references public.content(id) on delete cascade,
 tag text check(char_length(trim(tag)) between 1 and 80), primary key(content_id,tag)
);
create table public.reflections (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
 body text not null check(char_length(trim(body)) between 1 and 20000),
 structured jsonb not null default '{}'::jsonb check(jsonb_typeof(structured)='object'),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index reflections_owner_time_idx on public.reflections(user_id,created_at desc);
create table public.bookmarks (
 user_id uuid references public.profiles(id) on delete cascade default auth.uid(),
 content_id uuid references public.content(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(user_id,content_id)
);
create index bookmarks_content_idx on public.bookmarks(content_id);
create table public.playback_progress (
 user_id uuid references public.profiles(id) on delete cascade default auth.uid(),
 content_id uuid references public.content(id) on delete cascade,
 position_seconds numeric not null default 0 check(position_seconds between 0 and 86400),
 updated_at timestamptz not null default now(), primary key(user_id,content_id)
);
create index playback_content_idx on public.playback_progress(content_id);
create table public.pathways (
 id uuid primary key default gen_random_uuid(),
 title text not null check(char_length(trim(title)) between 1 and 240),
 description text not null default '', published boolean not null default false,
 created_by uuid references public.profiles(id) on delete set null default auth.uid()
);
create index pathways_creator_idx on public.pathways(created_by);
create table public.pathway_items (
 pathway_id uuid references public.pathways(id) on delete cascade,
 content_id uuid references public.content(id) on delete cascade,
 position integer not null check(position>=0), primary key(pathway_id,content_id), unique(pathway_id,position)
);
create index pathway_items_content_idx on public.pathway_items(content_id);
create table public.pathway_progress (
 user_id uuid references public.profiles(id) on delete cascade default auth.uid(),
 pathway_id uuid references public.pathways(id) on delete cascade,
 content_id uuid references public.content(id) on delete cascade,
 completed_at timestamptz not null default now(), primary key(user_id,pathway_id,content_id),
 foreign key(pathway_id,content_id) references public.pathway_items(pathway_id,content_id) on delete cascade
);
create index pathway_progress_item_idx on public.pathway_progress(pathway_id,content_id);
create index pathway_progress_content_idx on public.pathway_progress(content_id);
create table public.studio_ideas (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
 body text not null check(char_length(trim(body)) between 1 and 20000),
 structured jsonb not null default '{}'::jsonb check(jsonb_typeof(structured)='object'),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index studio_ideas_owner_idx on public.studio_ideas(user_id);
create table public.reviews (
 id uuid primary key default gen_random_uuid(), content_id uuid not null references public.content(id) on delete restrict,
 content_version integer not null, reviewer_id uuid references public.profiles(id) on delete set null,
 decision text not null check(decision in ('approved','changes_requested')),
 notes text not null default '', created_at timestamptz not null default now()
);
create index reviews_content_idx on public.reviews(content_id);
create index reviews_reviewer_idx on public.reviews(reviewer_id);
create table public.publications (
 id uuid primary key default gen_random_uuid(), content_id uuid not null references public.content(id) on delete restrict,
 content_version integer not null, actor_id uuid references public.profiles(id) on delete set null,
 action text not null check(action in ('scheduled','published','archived')),
 scheduled_at timestamptz, created_at timestamptz not null default now()
);
create index publications_content_idx on public.publications(content_id);
create index publications_actor_idx on public.publications(actor_id);
create table public.audit_events (
 id bigint generated always as identity primary key,
 actor_id uuid, action text not null, entity_type text not null, entity_id uuid,
 metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index audit_events_actor_idx on public.audit_events(actor_id);
create index audit_events_entity_idx on public.audit_events(entity_type,entity_id,created_at desc);
create table public.ai_tasks (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
 task text not null check(task in ('reflection.structure','idea.organize','content.discover','founder.draft','copy.adapt','transcript.summarize','recommendation.explain')),
 status text not null default 'pending' check(status in ('pending','completed','failed')),
 provider text not null default 'mock', trace_id uuid not null default gen_random_uuid(),
 created_at timestamptz not null default now()
);
create index ai_tasks_owner_idx on public.ai_tasks(user_id,created_at desc);
create table public.feature_flags (
 key text primary key, enabled boolean not null default false, requires_review boolean not null default true
);
create table public.rate_counters (
 user_id uuid references public.profiles(id) on delete cascade,
 scope text not null, window_start timestamptz not null, count integer not null check(count>0),
 primary key(user_id,scope,window_start)
);

-- All access checks query current database state, never user-editable JWT metadata.
create function private.active_user() returns boolean language sql stable security definer set search_path='' as $$
 select exists (
  select 1 from public.profiles p join auth.users u on u.id=p.id
  join auth.sessions s on s.user_id=p.id
  where p.id=(select auth.uid()) and p.deleted_at is null
  and (u.banned_until is null or u.banned_until <= now())
  and s.id::text=(select auth.jwt()->>'session_id')
  and (s.not_after is null or s.not_after > now())
 )
$$;
create function public.active_account() returns boolean language sql stable security invoker set search_path='' as $$ select private.active_user() $$;
create function private.has_role(roles text[]) returns boolean language sql stable security definer set search_path='' as $$
 select private.active_user() and exists(select 1 from public.user_roles where user_id=(select auth.uid()) and role=any(roles))
$$;
create function private.has_membership() returns boolean language sql stable security definer set search_path='' as $$
 select private.active_user() and exists(select 1 from public.entitlements where user_id=(select auth.uid()) and tier<>'free' and (expires_at is null or expires_at>now()))
$$;
create function private.can_read_content(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.content c where c.id=target and (
 private.has_role(array['founder','editor']) or
 (c.state='published' and c.founder_approved and c.rights_verified and c.provenance<>'placeholder'
  and ((c.audience='public' and ((select auth.uid()) is null or private.active_user()))
       or (c.audience='member' and private.has_membership())))
 ))
$$;
create function private.can_manage_media(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.has_role(array['founder','editor']) and exists(
  select 1 from public.media_assets m join public.user_roles r on r.user_id=m.owner_id
  where m.id=target and r.role in ('founder','editor')
 )
$$;
create function private.can_read_media(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.media_assets m where m.id=target and m.scan_status='clean' and (
  (private.active_user() and m.owner_id=(select auth.uid())) or private.can_manage_media(m.id) or
  (m.rights_status='verified' and m.content_id is not null and private.can_read_content(m.content_id)
   and (not m.restricted or private.has_membership()))
 ))
$$;

create function private.bootstrap_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,display_name) values(new.id,left(coalesce(new.raw_user_meta_data->>'display_name',''),100));
 insert into public.preferences(user_id) values(new.id);
 insert into public.user_roles(user_id,role) values(new.id,'member');
 insert into public.entitlements(user_id) values(new.id);
 return new;
end $$;
create trigger adequate_profile_bootstrap after insert on auth.users for each row execute function private.bootstrap_profile();

create function private.touch_updated_at() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now(); return new; end $$;
create function private.immutable() returns trigger language plpgsql set search_path='' as $$
begin raise exception 'Immutable history cannot be changed' using errcode='42501'; end $$;
create trigger content_versions_immutable before update or delete on public.content_versions for each row execute function private.immutable();
create trigger audit_events_immutable before update or delete on public.audit_events for each row execute function private.immutable();
create trigger reviews_immutable before update or delete on public.reviews for each row execute function private.immutable();
create trigger publications_immutable before update or delete on public.publications for each row execute function private.immutable();

create function private.content_guard() returns trigger language plpgsql set search_path='' as $$
declare changed boolean;
begin
 if tg_op='INSERT' then
  if current_user not in ('postgres','supabase_admin') and
    (new.state<>'draft' or new.founder_approved or new.version<>1 or new.created_by is distinct from auth.uid() or
     (new.rights_verified and not private.has_role(array['founder']))) then
    raise exception 'Create drafts without approval claims' using errcode='42501';
  end if;
  return new;
 end if;
 if current_user not in ('postgres','supabase_admin') then
  if (new.state,new.founder_approved,new.scheduled_at,new.published_at,new.version,new.created_by)
   is distinct from (old.state,old.founder_approved,old.scheduled_at,old.published_at,old.version,old.created_by) then
    raise exception 'Use workflow RPC for state changes' using errcode='42501';
  end if;
  if new.rights_verified is distinct from old.rights_verified and not private.has_role(array['founder']) then
   raise exception 'Founder must verify rights' using errcode='42501';
  end if;
 end if;
 changed := (new.slug,new.title,new.body,new.kind,new.audience,new.provenance,new.rights_verified)
  is distinct from (old.slug,old.title,old.body,old.kind,old.audience,old.provenance,old.rights_verified);
 if changed then
  if old.state in ('published','scheduled') then raise exception 'Unpublish before editing' using errcode='42501'; end if;
  new.version=old.version+1; new.state='draft'; new.founder_approved=false; new.scheduled_at=null; new.published_at=null;
 end if;
 new.updated_at=now(); return new;
end $$;
create trigger content_guard before insert or update on public.content for each row execute function private.content_guard();
create function private.record_version() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='INSERT' or new.version<>old.version then
  insert into public.content_versions(content_id,version,snapshot,created_by) values(new.id,new.version,to_jsonb(new),auth.uid());
  insert into public.audit_events(actor_id,action,entity_type,entity_id,metadata)
   values(auth.uid(),case when tg_op='INSERT' then 'content.created' else 'content.edited' end,'content',new.id,jsonb_build_object('version',new.version));
 end if;
 return new;
end $$;
create trigger content_version after insert or update on public.content for each row execute function private.record_version();

create function private.media_guard() returns trigger language plpgsql set search_path='' as $$
begin
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
  if new.rights_status is distinct from old.rights_status and current_user not in ('postgres','supabase_admin') and not private.has_role(array['founder']) then
   raise exception 'Founder must verify media rights' using errcode='42501';
  end if;
 end if;
 if exists(select 1 from public.content where (id=new.content_id or (tg_op='UPDATE' and id=old.content_id)) and state in ('published','scheduled')) then
  raise exception 'Unpublish before changing media' using errcode='42501';
 end if;
 new.updated_at=now(); return new;
end $$;
create trigger media_guard before insert or update on public.media_assets for each row execute function private.media_guard();
-- Any recording, transcript, chapter or rights edit invalidates the content approval.
create function private.invalidate_media_approval() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='DELETE' then
  if exists(select 1 from public.content where id=old.content_id and state in ('published','scheduled')) then
   raise exception 'Unpublish before removing media' using errcode='42501';
  end if;
 end if;
 update public.content set founder_approved=false,state='draft',scheduled_at=null
 where id=coalesce(new.content_id,old.content_id) and state in ('review','approved');
 if tg_op='UPDATE' and old.content_id is distinct from new.content_id then
  update public.content set founder_approved=false,state='draft',scheduled_at=null where id=old.content_id and state in ('review','approved');
 end if;
 return coalesce(new,old);
end $$;
create trigger invalidate_media_approval after insert or update or delete on public.media_assets for each row execute function private.invalidate_media_approval();

create function private.transition_content(p_content_id uuid,p_state text,p_scheduled_at timestamptz default null)
returns public.content language plpgsql security definer set search_path='' as $$
declare c public.content; founder boolean;
begin
 if not private.has_role(array['founder','editor']) then raise exception 'Editorial access required' using errcode='42501'; end if;
 founder=private.has_role(array['founder']);
 select * into c from public.content where id=p_content_id for update;
 if not found then raise exception 'Content not found' using errcode='P0002'; end if;
 if p_state not in ('draft','review','approved','scheduled','published','archived') or p_state=c.state then
  raise exception 'Invalid state transition' using errcode='23514'; end if;
 if not ((c.state='draft' and p_state='review') or (c.state='review' and p_state in ('draft','approved'))
  or (c.state='approved' and p_state in ('draft','scheduled','published'))
  or (c.state='scheduled' and p_state in ('draft','published'))
  or (c.state='published' and p_state in ('draft','archived'))
  or (c.state='archived' and p_state='draft')) then raise exception 'Invalid state transition' using errcode='23514'; end if;
 if p_state in ('approved','scheduled','published','archived') and not founder then
  raise exception 'Founder controls approval and publication' using errcode='42501'; end if;
 if c.state in ('scheduled','published') and not founder then raise exception 'Founder controls unpublishing' using errcode='42501'; end if;
 if p_state in ('approved','scheduled','published') then
  if not c.rights_verified or c.provenance='placeholder' or char_length(trim(c.body))=0 then
   raise exception 'Verified rights and real content required' using errcode='23514'; end if;
  -- Lock linked assets: concurrent scanner/editor changes cannot race publication.
  perform id from public.media_assets where content_id=c.id for update;
  if exists(select 1 from public.media_assets where content_id=c.id and (rights_status<>'verified' or scan_status<>'clean'))
   or (c.kind='audio' and not exists(select 1 from public.media_assets where content_id=c.id)) then
   raise exception 'Media needs verified rights and clean scan' using errcode='23514'; end if;
  if p_state<>'approved' and not c.founder_approved then raise exception 'Current founder approval required' using errcode='23514'; end if;
 end if;
 if p_state='scheduled' and (p_scheduled_at is null or p_scheduled_at<=now()) then
  raise exception 'Schedule must be in the future' using errcode='23514'; end if;
 if p_state='published' and c.state='scheduled' and c.scheduled_at>now() then
  raise exception 'Scheduled publication is not due' using errcode='23514'; end if;
 update public.content set state=p_state,founder_approved=case when p_state='approved' then true when p_state='draft' then false else founder_approved end,
  scheduled_at=case when p_state='scheduled' then p_scheduled_at when p_state='draft' then null else scheduled_at end,
  published_at=case when p_state='published' then now() when p_state='draft' then null else published_at end
 where id=c.id returning * into c;
 if p_state='approved' then insert into public.reviews(content_id,content_version,reviewer_id,decision) values(c.id,c.version,auth.uid(),'approved'); end if;
 if p_state in ('scheduled','published','archived') then insert into public.publications(content_id,content_version,actor_id,action,scheduled_at) values(c.id,c.version,auth.uid(),p_state,c.scheduled_at); end if;
 insert into public.audit_events(actor_id,action,entity_type,entity_id,metadata) values(auth.uid(),'content.transition','content',c.id,jsonb_build_object('state',p_state,'version',c.version));
 return c;
end $$;
create function public.transition_content(p_content_id uuid,p_state text,p_scheduled_at timestamptz default null)
returns public.content language sql security invoker set search_path='' as $$ select private.transition_content(p_content_id,p_state,p_scheduled_at) $$;

create function private.rollback_content(p_content_id uuid,p_version integer) returns public.content language plpgsql security definer set search_path='' as $$
declare c public.content; s jsonb;
begin
 if not private.has_role(array['founder']) then raise exception 'Founder rollback required' using errcode='42501'; end if;
 select * into c from public.content where id=p_content_id for update;
 if not found then raise exception 'Content not found' using errcode='P0002'; end if;
 if c.state in ('published','scheduled') then raise exception 'Unpublish before rollback' using errcode='23514'; end if;
 select snapshot into s from public.content_versions where content_id=c.id and version=p_version;
 if s is null or p_version>=c.version then raise exception 'Earlier version required' using errcode='23514'; end if;
 update public.content set slug=s->>'slug',title=s->>'title',body=s->>'body',kind=s->>'kind',audience=s->>'audience',
  provenance=s->>'provenance',rights_verified=false,founder_approved=false,state='draft',scheduled_at=null,published_at=null,version=c.version+1
 where id=c.id returning * into c;
 -- Identical snapshots still create a new immutable version for this explicit rollback.
 if c.version=(select max(version) from public.content_versions where content_id=c.id) and c.version<=p_version then
  raise exception 'Rollback did not advance history' using errcode='23514'; end if;
 insert into public.audit_events(actor_id,action,entity_type,entity_id,metadata) values(auth.uid(),'content.rollback','content',c.id,jsonb_build_object('source_version',p_version,'version',c.version));
 return c;
end $$;
create function public.rollback_content(p_content_id uuid,p_version integer) returns public.content language sql security invoker set search_path='' as $$ select private.rollback_content(p_content_id,p_version) $$;

create function private.publish_due_content() returns integer language plpgsql security definer set search_path='' as $$
declare c public.content; total integer:=0;
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'Server role required' using errcode='42501'; end if;
 for c in select * from public.content where state='scheduled' and scheduled_at<=now() order by scheduled_at for update skip locked loop
  perform id from public.media_assets where content_id=c.id for update;
  if not c.founder_approved or not c.rights_verified or c.provenance='placeholder' or char_length(trim(c.body))=0
   or exists(select 1 from public.media_assets where content_id=c.id and (rights_status<>'verified' or scan_status<>'clean'))
   or (c.kind='audio' and not exists(select 1 from public.media_assets where content_id=c.id)) then
   insert into public.audit_events(action,entity_type,entity_id,metadata) values('content.schedule_blocked','content',c.id,jsonb_build_object('version',c.version));
   continue;
  end if;
  update public.content set state='published',published_at=now() where id=c.id;
  insert into public.publications(content_id,content_version,action,scheduled_at) values(c.id,c.version,'published',c.scheduled_at);
  insert into public.audit_events(action,entity_type,entity_id,metadata) values('content.scheduled_published','content',c.id,jsonb_build_object('version',c.version));
  total=total+1;
 end loop;
 return total;
end $$;
create function public.publish_due_content() returns integer language sql security invoker set search_path='' as $$ select private.publish_due_content() $$;

create function private.consume_rate_limit(p_scope text,p_limit integer,p_window_seconds integer) returns boolean language plpgsql security definer set search_path='' as $$
declare counter integer; boundary timestamptz;
begin
 if not private.active_user() then raise exception 'Active account required' using errcode='42501'; end if;
 if p_scope is null or char_length(p_scope) not between 1 and 80 or p_limit not between 1 and 1000 or p_window_seconds not between 1 and 86400 then
  raise exception 'Invalid rate limit' using errcode='23514'; end if;
 boundary=to_timestamp(floor(extract(epoch from now())/p_window_seconds)*p_window_seconds);
 insert into public.rate_counters(user_id,scope,window_start,count) values(auth.uid(),p_scope,boundary,1)
 on conflict(user_id,scope,window_start) do update set count=public.rate_counters.count+1
 returning count into counter;
 return counter<=p_limit;
end $$;
create function public.consume_rate_limit(p_scope text,p_limit integer,p_window_seconds integer) returns boolean language sql security invoker set search_path='' as $$ select private.consume_rate_limit(p_scope,p_limit,p_window_seconds) $$;

create table private.auth_rate_counters (
 key text not null check(char_length(key) between 32 and 200),
 window_start timestamptz not null, count integer not null check(count>0),
 primary key(key,window_start)
);
alter table private.auth_rate_counters enable row level security;
create function private.consume_auth_rate_limit(p_key text,p_limit integer,p_window_seconds integer) returns boolean language plpgsql security definer set search_path='' as $$
declare counter integer; boundary timestamptz;
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'Server role required' using errcode='42501'; end if;
 if p_key is null or char_length(p_key) not between 32 and 200 or p_limit not between 1 and 1000 or p_window_seconds not between 1 and 86400 then
  raise exception 'Invalid rate limit' using errcode='23514'; end if;
 boundary=to_timestamp(floor(extract(epoch from now())/p_window_seconds)*p_window_seconds);
 insert into private.auth_rate_counters(key,window_start,count) values(p_key,boundary,1)
 on conflict(key,window_start) do update set count=private.auth_rate_counters.count+1 returning count into counter;
 return counter<=p_limit;
end $$;
create function public.consume_auth_rate_limit(p_key text,p_limit integer,p_window_seconds integer) returns boolean language sql security invoker set search_path='' as $$ select private.consume_auth_rate_limit(p_key,p_limit,p_window_seconds) $$;

-- Storage bytes must be removed through Storage API, never by deleting its SQL
-- object rows. Durable jobs survive failures and remain outside the Data API.
create table private.media_deletion_jobs (
 id uuid primary key default gen_random_uuid(), user_id uuid not null,
 storage_paths jsonb not null, status text not null default 'pending' check(status in ('pending','completed')),
 created_at timestamptz not null default now(), completed_at timestamptz
);
alter table private.media_deletion_jobs enable row level security;
grant select,update on private.media_deletion_jobs to service_role;

create function private.delete_own_account() returns void language plpgsql security definer set search_path='' as $$
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
 update auth.users set banned_until='infinity'::timestamptz where id=target;
 insert into public.audit_events(actor_id,action,entity_type,entity_id) values(target,'account.deleted','profile',target);
end $$;
create function public.delete_own_account() returns void language sql security invoker set search_path='' as $$ select private.delete_own_account() $$;

-- Deliberate grants plus RLS on every public table. Roles and entitlements are read-only.
do $$ declare t text; begin
 foreach t in array array['profiles','preferences','consents','user_roles','entitlements','content','content_versions','media_assets','content_tags','reflections','bookmarks','playback_progress','pathways','pathway_items','pathway_progress','studio_ideas','reviews','publications','audit_events','ai_tasks','feature_flags','rate_counters'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon, authenticated',t);
  execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
grant select on public.profiles,public.preferences,public.consents,public.user_roles,public.entitlements to authenticated;
grant update(display_name,onboarding_completed_at) on public.profiles to authenticated;
grant insert(user_id,theme,ai_enabled),update(theme,ai_enabled) on public.preferences to authenticated;
grant insert(user_id,purpose,granted),update(granted) on public.consents to authenticated;
grant select on public.content,public.content_tags,public.pathways,public.pathway_items,public.feature_flags to anon,authenticated;
grant select,insert on public.content to authenticated;
grant update(slug,title,body,kind,audience,provenance,rights_verified) on public.content to authenticated;
grant select on public.content_versions,public.reviews,public.publications,public.audit_events to authenticated;
grant select,insert,delete on public.media_assets to authenticated;
grant select on public.media_assets to anon;
grant update(content_id,rights_status,rights_notes,transcript,chapters,restricted) on public.media_assets to authenticated;
grant insert,update,delete on public.content_tags,public.pathways,public.pathway_items to authenticated;
grant select,insert,update,delete on public.reflections,public.bookmarks,public.playback_progress,public.pathway_progress,public.studio_ideas to authenticated;
grant select,insert on public.ai_tasks to authenticated;
grant update(status,provider) on public.ai_tasks to authenticated;
create policy profiles_owner_read on public.profiles for select to authenticated using(id=(select auth.uid()) and (select private.active_user()));
create policy profiles_owner_update on public.profiles for update to authenticated using(id=(select auth.uid()) and (select private.active_user())) with check(id=(select auth.uid()) and deleted_at is null and (select private.active_user()));
do $$ declare t text; begin
 foreach t in array array['preferences','consents','reflections','bookmarks','playback_progress','pathway_progress'] loop
  execute format('create policy owner_access on public.%I for all to authenticated using(user_id=(select auth.uid()) and (select private.active_user())) with check(user_id=(select auth.uid()) and (select private.active_user()))',t);
 end loop;
 foreach t in array array['preferences','consents','reflections','playback_progress','studio_ideas'] loop
  execute format('create trigger touch_updated_at before update on public.%I for each row execute function private.touch_updated_at()',t);
 end loop;
end $$;
create policy roles_own_read on public.user_roles for select to authenticated using(user_id=(select auth.uid()) and (select private.active_user()));
create policy entitlements_own_read on public.entitlements for select to authenticated using(user_id=(select auth.uid()) and (select private.active_user()));
create policy content_authorized_read on public.content for select to anon,authenticated using(private.can_read_content(id));
create policy content_staff_insert on public.content for insert to authenticated with check((select private.has_role(array['founder','editor'])) and created_by=(select auth.uid()) and state='draft' and not founder_approved and version=1);
create policy content_staff_update on public.content for update to authenticated using((select private.has_role(array['founder','editor']))) with check((select private.has_role(array['founder','editor'])));
create policy versions_staff_read on public.content_versions for select to authenticated using((select private.has_role(array['founder','editor'])));
create policy media_authorized_read on public.media_assets for select to authenticated using(private.can_manage_media(id) or (owner_id=(select auth.uid()) and (select private.active_user())) or private.can_read_media(id));
create policy media_public_read on public.media_assets for select to anon using(private.can_read_media(id));
create policy media_staff_insert on public.media_assets for insert to authenticated with check((select private.has_role(array['founder','editor'])) and owner_id=(select auth.uid()) and rights_status='pending' and scan_status='pending');
create policy media_staff_update on public.media_assets for update to authenticated using(private.can_manage_media(id)) with check(private.can_manage_media(id));
create policy media_staff_delete on public.media_assets for delete to authenticated using(private.can_manage_media(id));
create policy media_owner_delete on public.media_assets for delete to authenticated using(owner_id=(select auth.uid()) and content_id is null and (select private.active_user()));
create policy tags_read on public.content_tags for select to anon,authenticated using(private.can_read_content(content_id));
create policy tags_write on public.content_tags for all to authenticated using((select private.has_role(array['founder','editor']))) with check((select private.has_role(array['founder','editor'])));
create policy pathways_read on public.pathways for select to anon,authenticated using((select private.has_role(array['founder','editor'])) or (published and ((select auth.uid()) is null or (select private.active_user()))));
-- Pathways are review-gated: only founder may set published=true.
create policy pathways_write on public.pathways for all to authenticated using((select private.has_role(array['founder','editor']))) with check((select private.has_role(array['founder'])) or ((select private.has_role(array['editor'])) and not published));
create policy pathway_items_read on public.pathway_items for select to anon,authenticated using(private.can_read_content(content_id) and exists(select 1 from public.pathways where id=pathway_id));
create policy pathway_items_write on public.pathway_items for all to authenticated using((select private.has_role(array['founder','editor']))) with check((select private.has_role(array['founder','editor'])));
create policy ideas_staff_owner on public.studio_ideas for all to authenticated using(user_id=(select auth.uid()) and (select private.has_role(array['founder','editor']))) with check(user_id=(select auth.uid()) and (select private.has_role(array['founder','editor'])));
create policy reviews_staff_read on public.reviews for select to authenticated using((select private.has_role(array['founder','editor'])));
create policy publications_staff_read on public.publications for select to authenticated using((select private.has_role(array['founder','editor'])));
create policy audit_staff_read on public.audit_events for select to authenticated using((select private.has_role(array['founder','editor'])));
create policy ai_tasks_owner_read on public.ai_tasks for select to authenticated using(user_id=(select auth.uid()) and (select private.active_user()));
create policy ai_tasks_owner_insert on public.ai_tasks for insert to authenticated with check(user_id=(select auth.uid()) and (select private.active_user()) and status='pending' and exists(select 1 from public.consents where user_id=(select auth.uid()) and purpose='ai_processing' and granted));
create policy ai_tasks_owner_update on public.ai_tasks for update to authenticated using(user_id=(select auth.uid()) and (select private.active_user())) with check(user_id=(select auth.uid()) and (select private.active_user()));
create policy feature_flags_read on public.feature_flags for select to anon,authenticated using(true);
-- rate_counters intentionally has no direct client policies/grants; atomic RPC only.

-- Referenced content must also be accessible when saving progress/bookmarks.
create policy bookmark_content_gate on public.bookmarks as restrictive for insert to authenticated with check(private.can_read_content(content_id));
create policy playback_content_gate on public.playback_progress as restrictive for all to authenticated using(private.can_read_content(content_id)) with check(private.can_read_content(content_id));
create policy progress_content_gate on public.pathway_progress as restrictive for all to authenticated using(private.can_read_content(content_id) and exists(select 1 from public.pathways where id=pathway_id)) with check(private.can_read_content(content_id) and exists(select 1 from public.pathways where id=pathway_id));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('recordings','recordings',false,52428800,array['audio/mpeg','audio/mp4','audio/wav','audio/x-wav','audio/ogg','audio/webm'])
 on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy adequate_recordings_upload on storage.objects for insert to authenticated with check(
 bucket_id='recordings' and (select private.has_role(array['founder','editor']))
 and exists(select 1 from public.media_assets m where m.storage_path=name and m.owner_id=(select auth.uid()) and m.scan_status='pending' and m.rights_status='pending')
);
create policy adequate_recordings_access on storage.objects for select to anon,authenticated using(
 bucket_id='recordings' and exists(select 1 from public.media_assets m where m.storage_path=name and private.can_read_media(m.id))
);
-- No client upsert/update: a replacement requires a new asset and fresh scan/rights.
create policy adequate_recordings_delete on storage.objects for delete to authenticated using(
 bucket_id='recordings' and exists(select 1 from public.media_assets m where m.storage_path=name and (
  (m.owner_id=(select auth.uid()) and m.content_id is null and (select private.active_user())) or
  ((select private.has_role(array['founder'])) and (m.content_id is null or exists(select 1 from public.content c where c.id=m.content_id and c.state not in ('published','scheduled'))))
 ))
);

revoke execute on all functions in schema private from public;
revoke execute on all functions in schema public from public;
grant execute on function private.active_user(),private.has_role(text[]),private.has_membership(),private.can_read_content(uuid),private.can_manage_media(uuid),private.can_read_media(uuid) to anon,authenticated;
grant execute on function public.active_account() to authenticated;
grant execute on function private.transition_content(uuid,text,timestamptz),private.rollback_content(uuid,integer),private.consume_rate_limit(text,integer,integer),private.delete_own_account() to authenticated;
grant execute on function public.transition_content(uuid,text,timestamptz),public.rollback_content(uuid,integer),public.consume_rate_limit(text,integer,integer),public.delete_own_account() to authenticated;
grant execute on function private.consume_auth_rate_limit(text,integer,integer),public.consume_auth_rate_limit(text,integer,integer) to service_role;
grant execute on function private.publish_due_content(),public.publish_due_content() to service_role;
grant usage,select on all sequences in schema public to service_role;
commit;
