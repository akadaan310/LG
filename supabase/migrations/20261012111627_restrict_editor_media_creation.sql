-- Prevent INSERT from bypassing founder-only media audience control.
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
  if current_user not in ('postgres','supabase_admin','service_role') and not new.restricted and not private.has_role(array['founder']) then
   raise exception 'Founder controls unrestricted media' using errcode='42501';
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
commit;
