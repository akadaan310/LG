import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
const container = process.env.ADEQUATE_DB_CONTAINER ?? 'supabase_db_LG';
const database = 'adequate_policy_concurrency';
const psqlArgs = ['exec','-i',container,'psql','-U','postgres','-v','ON_ERROR_STOP=1','-At'];
function sql(statement, db=database) {
 return execFileSync('docker',[...psqlArgs,'-d',db],{input:statement,encoding:'utf8',stdio:['pipe','pipe','pipe']});
}
function session(statement, onOutput) {
 const child=spawn('docker',[...psqlArgs,'-d',database],{stdio:['pipe','pipe','pipe']});
 let stdout='', stderr='';
 child.stdout.on('data',chunk=>{stdout+=chunk;onOutput?.(stdout);});
 child.stderr.on('data',chunk=>{stderr+=chunk;});
 child.stdin.end(statement);
 return new Promise(resolve=>child.on('close',code=>resolve({code,stdout,stderr})));
}
const claims = `select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000003","role":"authenticated","session_id":"10000000-0000-0000-0000-000000000003"}',true); set local role authenticated;`;
const target='20000000-0000-0000-0000-000000000001';
sql(`create database ${database};`,'postgres');
try {
 const schema=execFileSync('docker',['exec',container,'pg_dump','-U','postgres','-d','postgres','--schema-only'],{encoding:'utf8',maxBuffer:10*1024*1024});
 sql(schema);
 sql(`insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data,email_confirmed_at) values('00000000-0000-0000-0000-000000000003','race@example.invalid','{}','{}',now());
 insert into auth.sessions(id,user_id) values('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000003');
 update public.user_roles set role='founder' where user_id='00000000-0000-0000-0000-000000000003';
 insert into public.content(id,slug,title,body,kind,state,created_by,provenance,rights_verified,founder_approved) values('${target}','race-content','Race fixture','Local fixture','essay','approved','00000000-0000-0000-0000-000000000003','user_authored',true,true);
 insert into public.media_assets(id,owner_id,storage_path,mime_type,byte_size) values('40000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000003/reattach.wav','audio/wav',100);`);
 for(const [label,mutation] of [
  ['INSERT',`insert into public.media_assets(owner_id,content_id,storage_path,mime_type,byte_size) values(auth.uid(),'${target}','00000000-0000-0000-0000-000000000003/new.wav','audio/wav',100);`],
  ['reattach',`update public.media_assets set content_id='${target}' where id='40000000-0000-0000-0000-000000000002';`]
 ]) {
  sql(`update public.content set state='approved',founder_approved=true where id='${target}';`);
  let release;
  const locked=new Promise(resolve=>{release=resolve;});
  const publishing=session(`begin; ${claims} select id from public.content where id='${target}' for update; select 'LOCK_HELD'; select pg_sleep(1); select public.transition_content('${target}','published'); commit;`,text=>{if(text.includes('LOCK_HELD'))release();});
  await locked;
  const mutationResult=await session(`begin; ${claims} ${mutation} commit;`);
  const publishResult=await publishing;
  assert.equal(publishResult.code,0,publishResult.stderr);
  assert.notEqual(mutationResult.code,0,`Concurrent ${label} committed after publication`);
  assert.match(mutationResult.stderr,/Unpublish before changing media/);
  assert.equal(sql(`select count(*) from public.media_assets where content_id='${target}';`).trim(),'0');
  console.log(`PASS: concurrent ${label} waits for publication and cannot attach pending media`);
 }
} finally {
 sql(`drop database ${database} with (force);`,'postgres');
}
