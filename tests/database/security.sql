-- Local-only fixtures. Never apply this file to a shared environment.
\set ON_ERROR_STOP on
begin;
create schema test_support;
create function test_support.assert(ok boolean, label text) returns void language plpgsql as $$
begin if ok is not true then raise exception 'FAIL: %', label; end if; raise notice 'PASS: %', label; end $$;
create function test_support.denied(statement text, label text) returns void language plpgsql as $$
begin
  begin execute statement; exception when insufficient_privilege or check_violation or raise_exception then
    raise notice 'PASS: %', label; return;
  end;
  raise exception 'FAIL: % was allowed', label;
end $$;
grant usage on schema test_support to anon, authenticated;
grant execute on all functions in schema test_support to anon, authenticated;
select test_support.assert(to_regclass('public.reflections') is not null, 'member persistence exists');

insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data,email_confirmed_at,created_at,updated_at) values
 ('00000000-0000-0000-0000-000000000001','fixture-a@example.invalid','{"role":"founder","display_name":"Fixture A"}','{}',now(),now(),now()),
 ('00000000-0000-0000-0000-000000000002','fixture-b@example.invalid','{}','{}',now(),now(),now()),
 ('00000000-0000-0000-0000-000000000003','fixture-founder@example.invalid','{}','{}',now(),now(),now()),
 ('00000000-0000-0000-0000-000000000004','fixture-editor@example.invalid','{}','{}',now(),now(),now());
insert into auth.identities(user_id,provider_id,provider,identity_data,created_at,updated_at) values('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','email','{"sub":"00000000-0000-0000-0000-000000000001","email":"fixture-a@example.invalid"}',now(),now());
insert into auth.sessions(id,user_id,created_at,updated_at) values
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001',now(),now()),
 ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002',now(),now()),
 ('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000003',now(),now()),
 ('10000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000004',now(),now());
update public.user_roles set role='founder' where user_id='00000000-0000-0000-0000-000000000003';
update public.user_roles set role='editor' where user_id='00000000-0000-0000-0000-000000000004';
update public.entitlements set tier='member' where user_id='00000000-0000-0000-0000-000000000001';
insert into public.content(id,slug,title,body,kind,created_by,provenance) values
 ('20000000-0000-0000-0000-000000000001','fixture-draft','Fixture draft','Local fixture only','essay','00000000-0000-0000-0000-000000000003','user_authored');
insert into public.content(id,slug,title,body,kind,state,created_by,provenance,rights_verified,founder_approved,audience) values
 ('20000000-0000-0000-0000-000000000002','fixture-public','Fixture public','Local fixture only','essay','published','00000000-0000-0000-0000-000000000003','user_authored',true,true,'public'),
 ('20000000-0000-0000-0000-000000000003','fixture-member','Fixture member','Local fixture only','essay','published','00000000-0000-0000-0000-000000000003','user_authored',true,true,'member');
insert into public.reflections(id,user_id,body) values
 ('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Private fixture A'),
 ('30000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','Private fixture B');
insert into public.media_assets(id,owner_id,storage_path,mime_type,byte_size,scan_status) values
 ('40000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001/private.wav','audio/wav',100,'clean');
insert into public.media_assets(id,owner_id,content_id,storage_path,mime_type,byte_size) values
 ('40000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003/quarantine.wav','audio/wav',100);
update public.content set state='draft' where id='20000000-0000-0000-0000-000000000002';
insert into public.media_assets(id,owner_id,content_id,storage_path,mime_type,byte_size,scan_status,rights_status,restricted) values
 ('40000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003/public.wav','audio/wav',100,'clean','verified',false);
update public.content set state='published',founder_approved=true where id='20000000-0000-0000-0000-000000000002';
insert into storage.objects(bucket_id,name,owner_id,metadata) values
 ('recordings','00000000-0000-0000-0000-000000000003/public.wav','00000000-0000-0000-0000-000000000003','{"mimetype":"audio/wav","size":100}'),
 ('recordings','00000000-0000-0000-0000-000000000001/private.wav','00000000-0000-0000-0000-000000000001','{"mimetype":"audio/wav","size":100}'),
 ('recordings','00000000-0000-0000-0000-000000000003/quarantine.wav','00000000-0000-0000-0000-000000000003','{"mimetype":"audio/wav","size":100}');
-- SECURITY INVOKER trigger plans still require helper EXECUTE privilege for the
-- service caller, including helper expressions behind privileged exemptions.
select set_config('request.jwt.claims','{"role":"service_role"}',true);
set local role service_role;
select private.has_role(array['founder']) as service_founder_role \gset
with inserted as (insert into public.media_assets(id,owner_id,storage_path,mime_type,byte_size,restricted,scan_status,rights_status)
 select id,owner_id,storage_path,mime_type,byte_size,restricted,scan_status,rights_status from json_to_record('{"id":"40000000-0000-0000-0000-000000000005","owner_id":"00000000-0000-0000-0000-000000000003","storage_path":"00000000-0000-0000-0000-000000000003/service-fixture.wav","mime_type":"audio/wav","byte_size":100,"restricted":false,"scan_status":"clean","rights_status":"verified"}') as payload(id uuid,owner_id uuid,storage_path text,mime_type text,byte_size bigint,restricted boolean,scan_status text,rights_status text) returning id)
 select count(*) as service_insert_count from inserted \gset
reset role;
select test_support.assert(not :'service_founder_role'::boolean,'service helper execution does not confer founder identity');
select test_support.assert(:service_insert_count=1,'service can insert trusted media fixture with RETURNING');
select test_support.assert((select role='member' from public.user_roles where user_id='00000000-0000-0000-0000-000000000001'),'user_metadata cannot grant founder');
select test_support.assert(not exists(select 1 from pg_tables t where t.schemaname='public' and not t.rowsecurity),'all public tables enforce RLS');
select test_support.assert((select not public from storage.buckets where id='recordings'),'recordings bucket private');
select test_support.assert((select file_size_limit=52428800 from storage.buckets where id='recordings'),'storage size cap');

set local role anon;
select test_support.assert((select count(*)=1 from public.media_assets where id::text like '40000000-%'),'anonymous reads only published nonrestricted clean media');
select test_support.assert((select count(*)=1 from storage.objects where name like '00000000-%'),'anonymous can sign authorized public recording');
select test_support.assert((select count(*)=1 from public.content where id::text like '20000000-%'),'anonymous sees only published public content');
select test_support.denied($q$select * from public.reflections$q$,'anonymous private reflections denied');
select test_support.denied($q$select * from public.content_versions$q$,'anonymous versions denied');
select test_support.denied($q$select public.transition_content('20000000-0000-0000-0000-000000000001','published')$q$,'anonymous publish denied');
reset role;

select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated","session_id":"10000000-0000-0000-0000-000000000002"}',true);
set local role authenticated;
select test_support.assert(public.active_account(),'member B session active');
select test_support.assert((select count(*)=1 from public.reflections),'B cannot read A reflection');
select test_support.assert((select count(*)=1 from public.profiles),'B cannot read A profile');
select test_support.assert((select count(*)=1 from public.content where id::text like '20000000-%'),'free member cannot read paid content or draft');
select test_support.assert((select count(*)=1 from public.media_assets where id::text like '40000000-%'),'B cannot read A private media metadata');
select test_support.assert((select count(*)=1 from storage.objects where bucket_id='recordings' and name like '00000000-%'),'B cannot sign A private recording');
select test_support.denied($q$insert into public.reflections(user_id,body) values('00000000-0000-0000-0000-000000000001','intrusion')$q$,'B cannot insert A reflection');
select test_support.denied($q$update public.reflections set user_id='00000000-0000-0000-0000-000000000001' where id='30000000-0000-0000-0000-000000000002'$q$,'owner reassignment denied');
update public.reflections set body='intrusion' where id='30000000-0000-0000-0000-000000000001';
delete from public.reflections where id='30000000-0000-0000-0000-000000000001';
select test_support.denied($q$update public.user_roles set role='founder'$q$,'self role escalation denied');
select test_support.denied($q$update public.entitlements set tier='patron'$q$,'self entitlement escalation denied');
select test_support.denied($q$update public.profiles set deleted_at=null$q$,'client cannot resurrect account');
select test_support.denied($q$insert into public.bookmarks(content_id) values('20000000-0000-0000-0000-000000000001')$q$,'bookmark guessed draft denied');
select test_support.denied($q$select public.claim_media_deletions()$q$,'member cannot claim storage cleanup jobs');
select test_support.denied($q$select public.consume_auth_rate_limit(repeat('a',64),2,60)$q$,'member cannot call anonymous server rate RPC');
select test_support.denied($q$insert into public.ai_tasks(task) values('reflection.structure')$q$,'AI task requires recorded consent');
insert into public.consents(user_id,purpose,granted) values(auth.uid(),'ai_processing',true);
insert into public.ai_tasks(task) values('reflection.structure');
update public.ai_tasks set status='completed',provider='mock';
select test_support.assert((select count(*)=1 from public.ai_tasks where status='completed'),'consented task metadata recorded');
select test_support.assert(public.consume_rate_limit('fixture',2,60),'durable counter first request');
select test_support.assert(public.consume_rate_limit('fixture',2,60),'durable counter second request');
select test_support.assert(not public.consume_rate_limit('fixture',2,60),'durable counter rejects third request');
reset role;
select test_support.assert((select body='Private fixture A' from public.reflections where id='30000000-0000-0000-0000-000000000001'),'B cannot change or delete A reflection');

select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated","session_id":"10000000-0000-0000-0000-000000000001"}',true);
set local role authenticated;
select test_support.assert((select count(*)=2 from public.content where id::text like '20000000-%'),'entitled member reads paid and public content');
select test_support.assert((select count(*)=2 from storage.objects where bucket_id='recordings' and name like '00000000-%'),'A sees own clean recording');
select test_support.denied($q$update public.media_assets set owner_id='00000000-0000-0000-0000-000000000002'$q$,'media owner cannot be reassigned');
insert into public.bookmarks(content_id) values('20000000-0000-0000-0000-000000000002');
insert into public.playback_progress(content_id,position_seconds) values('20000000-0000-0000-0000-000000000002',25);
select test_support.assert((select position_seconds=25 from public.playback_progress),'playback progress persists');
reset role;

select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000004","role":"authenticated","session_id":"10000000-0000-0000-0000-000000000004"}',true);
set local role authenticated;
select test_support.assert((select count(*)=3 from public.content where id::text like '20000000-%'),'editor sees editorial drafts');
select test_support.assert((select count(*)=0 from public.media_assets where id='40000000-0000-0000-0000-000000000001'),'editor cannot read member private media');
select test_support.assert((select count(*)=0 from public.reflections),'editor cannot read member reflections');
select test_support.denied($q$update public.content set rights_verified=true where id='20000000-0000-0000-0000-000000000001'$q$,'editor cannot verify content rights');
select test_support.denied($q$update public.media_assets set rights_status='verified' where id='40000000-0000-0000-0000-000000000002'$q$,'editor cannot verify media rights');
select test_support.denied($q$update public.media_assets set restricted=false where id='40000000-0000-0000-0000-000000000002'$q$,'editor cannot lower media restriction');
select test_support.denied($q$insert into public.media_assets(owner_id,storage_path,mime_type,byte_size,restricted) values(auth.uid(),'00000000-0000-0000-0000-000000000004/editor-public.wav','audio/wav',100,false)$q$,'editor cannot create unrestricted media');
insert into public.media_assets(id,owner_id,storage_path,mime_type,byte_size,restricted) values('40000000-0000-0000-0000-000000000004',auth.uid(),'00000000-0000-0000-0000-000000000004/editor-private.wav','audio/wav',100,true);
select test_support.assert((select restricted and scan_status='pending' and rights_status='pending' from public.media_assets where id='40000000-0000-0000-0000-000000000004'),'editor can create restricted quarantined media');
select test_support.denied($q$update public.media_assets set scan_status='clean' where id='40000000-0000-0000-0000-000000000002'$q$,'editor cannot clear scan quarantine');
select test_support.denied($q$select public.publish_due_content()$q$,'editor cannot invoke service scheduler');
select test_support.denied($q$update public.content set state='published' where id='20000000-0000-0000-0000-000000000001'$q$,'direct workflow bypass denied');
select test_support.denied($q$select public.rollback_content('20000000-0000-0000-0000-000000000001',1)$q$,'editor rollback denied');
select public.transition_content('20000000-0000-0000-0000-000000000001','review');
select test_support.denied($q$select public.transition_content('20000000-0000-0000-0000-000000000001','approved')$q$,'editor approval denied');
select test_support.assert((select count(*)=0 from storage.objects where name like '%quarantine%'),'editor cannot read quarantine bytes');
reset role;

select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000003","role":"authenticated","session_id":"10000000-0000-0000-0000-000000000003"}',true);
set local role authenticated;
select test_support.denied($q$select public.transition_content('20000000-0000-0000-0000-000000000001','approved')$q$,'approval without content rights denied');
update public.content set rights_verified=true where id='20000000-0000-0000-0000-000000000001';
select public.transition_content('20000000-0000-0000-0000-000000000001','review');
select test_support.denied($q$select public.transition_content('20000000-0000-0000-0000-000000000001','approved')$q$,'approval with quarantined media denied');
update public.media_assets set rights_status='verified' where id='40000000-0000-0000-0000-000000000002';
reset role;
update public.media_assets set scan_status='clean' where id='40000000-0000-0000-0000-000000000002';
set local role authenticated;
with inserted as (insert into public.content(slug,title,body,kind,provenance) values('fixture-returning','Fixture returning','Local fixture','essay','user_authored') returning id)
 select test_support.assert(count(*)=1,'founder INSERT RETURNING can see new draft') from inserted;
update public.media_assets set transcript='Fixture transcript one' where id='40000000-0000-0000-0000-000000000002';
select version as transcript_version from public.content where id='20000000-0000-0000-0000-000000000001' \gset
update public.media_assets set transcript='Fixture transcript two' where id='40000000-0000-0000-0000-000000000002';
select test_support.assert((select snapshot->'media_assets'->0->>'transcript'='Fixture transcript one' from public.content_versions where content_id='20000000-0000-0000-0000-000000000001' and version=:transcript_version),'older immutable media transcript preserved');
select test_support.assert((select version=:transcript_version+1 from public.content where id='20000000-0000-0000-0000-000000000001'),'media edit advances approval revision');
select public.transition_content('20000000-0000-0000-0000-000000000001','review');
select public.transition_content('20000000-0000-0000-0000-000000000001','approved');
select test_support.assert((select founder_approved from public.content where id='20000000-0000-0000-0000-000000000001'),'founder atomic approval recorded');
select test_support.denied($q$select public.transition_content('20000000-0000-0000-0000-000000000001','scheduled',now()-interval '1 minute')$q$,'schedule in past denied');
select version as before_edit from public.content where id='20000000-0000-0000-0000-000000000001' \gset
update public.content set title='Edited fixture' where id='20000000-0000-0000-0000-000000000001';
select test_support.assert((select state='draft' and not founder_approved and version=:before_edit+1 from public.content where id='20000000-0000-0000-0000-000000000001'),'editing invalidates stale approval and increments version');
select test_support.denied($q$select public.transition_content('20000000-0000-0000-0000-000000000001','published')$q$,'stale approval cannot publish');
select public.transition_content('20000000-0000-0000-0000-000000000001','review');
select public.transition_content('20000000-0000-0000-0000-000000000001','approved');
select public.transition_content('20000000-0000-0000-0000-000000000001','published');
select test_support.assert((select state='published' and published_at is not null from public.content where id='20000000-0000-0000-0000-000000000001'),'founder publish persists');
select test_support.denied($q$update public.content set body='unsafe edit' where id='20000000-0000-0000-0000-000000000001'$q$,'published content cannot be edited');
select test_support.denied($q$update public.media_assets set transcript='unsafe edit' where id='40000000-0000-0000-0000-000000000002'$q$,'published media cannot be changed');
select test_support.denied($q$delete from public.media_assets where id='40000000-0000-0000-0000-000000000002'$q$,'published media cannot be removed');
select test_support.denied($q$update public.media_assets set content_id=null where id='40000000-0000-0000-0000-000000000002'$q$,'published media cannot be detached');
select test_support.denied($q$update public.content_versions set snapshot='{}'$q$,'client cannot rewrite history');
select test_support.denied($q$delete from public.audit_events$q$,'client cannot delete audit');
select public.transition_content('20000000-0000-0000-0000-000000000001','draft');
select version as before_rollback from public.content where id='20000000-0000-0000-0000-000000000001' \gset
select public.rollback_content('20000000-0000-0000-0000-000000000001',1);
select test_support.assert((select state='draft' and not founder_approved and not rights_verified and title='Fixture draft' and version=:before_rollback+1 from public.content where id='20000000-0000-0000-0000-000000000001'),'rollback restores draft and creates unapproved new version');
select test_support.assert((select count(*)=:before_rollback+1 from public.content_versions where content_id='20000000-0000-0000-0000-000000000001'),'immutable versions survive rollback');
select test_support.assert((select count(*)>=10 from public.audit_events where entity_id='20000000-0000-0000-0000-000000000001'),'workflow audit survives rollback');
reset role;
select test_support.denied($q$update public.content_versions set snapshot='{}'$q$,'admin cannot casually rewrite history');
select test_support.denied($q$delete from public.audit_events$q$,'admin cannot casually delete audit');

-- Only trusted service may consume hashed anonymous counters and publish due rows.
insert into public.content(id,slug,title,body,kind,state,provenance,rights_verified,founder_approved,scheduled_at) values
 ('20000000-0000-0000-0000-000000000004','fixture-due','Fixture due','Fixture only','essay','scheduled','user_authored',true,true,now()-interval '1 minute'),
 ('20000000-0000-0000-0000-000000000005','fixture-blocked','Fixture blocked','Fixture only','essay','scheduled','placeholder',false,false,now()-interval '1 minute');
select set_config('request.jwt.claims','{"role":"service_role"}',true);
set local role service_role;
select public.publish_due_content();
select public.consume_auth_rate_limit(repeat('a',64),1,60);
select public.consume_auth_rate_limit(repeat('a',64),1,60);
reset role;
select test_support.assert((select state='published' from public.content where id='20000000-0000-0000-0000-000000000004'),'service scheduler publishes due approved content');
select test_support.assert((select state='scheduled' from public.content where id='20000000-0000-0000-0000-000000000005'),'service scheduler cannot approve blocked content');
select test_support.assert((select count=2 from private.auth_rate_counters where key=repeat('a',64)),'anonymous auth counter durable');

-- Same access token becomes invalid immediately when its session disappears.
delete from auth.sessions where user_id='00000000-0000-0000-0000-000000000002';
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated","session_id":"10000000-0000-0000-0000-000000000002"}',true);
set local role authenticated;
select test_support.assert(not public.active_account(),'revoked token fails account guard');
select test_support.assert((select count(*)=0 from public.reflections),'revoked token cannot read private data');
select test_support.denied($q$insert into public.reflections(body) values('stale session')$q$,'revoked token cannot write private data');
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated","session_id":"10000000-0000-0000-0000-000000000001"}',true);
set local role authenticated;
select public.delete_own_account();
select test_support.assert(not public.active_account(),'deleted account invalidates existing token');
select test_support.assert((select count(*)=0 from public.reflections),'deleted account cannot read data');
select test_support.assert((select count(*)=0 from storage.objects where name like '00000000-%'),'deleted account cannot sign private recordings');
select test_support.denied($q$insert into public.reflections(body) values('resurrect')$q$,'deleted token cannot write');
reset role;
select test_support.assert(not exists(select 1 from auth.identities where user_id='00000000-0000-0000-0000-000000000001'),'deleted Auth provider identity purged');
select test_support.assert((select email is null and phone is null and encrypted_password is null and raw_user_meta_data='{}'::jsonb from auth.users where id='00000000-0000-0000-0000-000000000001'),'deleted Auth identity anonymized');
select test_support.assert((select deleted_at is not null from public.profiles where id='00000000-0000-0000-0000-000000000001'),'deletion tombstone persists');
select test_support.assert(not exists(select 1 from public.reflections where user_id='00000000-0000-0000-0000-000000000001'),'deletion purges reflections');
select test_support.assert((select count(*)=1 from private.media_deletion_jobs where user_id='00000000-0000-0000-0000-000000000001' and status='pending'),'storage deletion queued durably');
select test_support.assert(not exists(select 1 from auth.sessions where user_id='00000000-0000-0000-0000-000000000001'),'deletion revokes all sessions');

select set_config('request.jwt.claims','{"role":"service_role"}',true);
set local role service_role;
select id as deletion_job from public.claim_media_deletions() where user_id='00000000-0000-0000-0000-000000000001' \gset
select public.complete_media_deletion(:'deletion_job','fixture retry');
select id from public.claim_media_deletions() where user_id='00000000-0000-0000-0000-000000000001';
select public.complete_media_deletion(:'deletion_job');
reset role;
select test_support.assert((select status='completed' and attempts=2 from private.media_deletion_jobs where id=:'deletion_job'),'media cleanup durable retry completes');
select test_support.assert(not exists(select 1 from public.media_assets where owner_id='00000000-0000-0000-0000-000000000001'),'completed storage cleanup purges private metadata');

insert into private.media_deletion_jobs(user_id,storage_paths) values('00000000-0000-0000-0000-000000000003','["00000000-0000-0000-0000-000000000003/public.wav"]');
set local role service_role;
select status as editorial_status,storage_paths as editorial_paths from public.claim_media_deletions() where user_id='00000000-0000-0000-0000-000000000003' \gset
reset role;
select test_support.assert(:'editorial_status'='blocked_review' and :'editorial_paths'::jsonb='[]'::jsonb,'linked editorial bytes require retention review before cleanup');
rollback;
