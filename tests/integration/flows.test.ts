import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createClient} from '@supabase/supabase-js';
import {parseLocalEnvironment} from '../../scripts/read-local-env.mjs';
const app=process.env.ADEQUATE_TEST_URL||'http://127.0.0.1:3100';
const local=parseLocalEnvironment(readFileSync(process.env.ADEQUATE_LOCAL_CREDENTIALS||'/tmp/adequate-local.env','utf8'));
const dburl='http://127.0.0.1:54321';
const admin=createClient(dburl,local.SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const password='Isolated-local-fixture-42!';
const runId=Date.now().toString(36);
function sql(source:string){execFileSync('docker',['exec','-i',process.env.ADEQUATE_DB_CONTAINER||'adequate_db','psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],{input:source,stdio:['pipe','pipe','pipe']});}
async function member(label:string,role='member'){
 const email=`adequate-${runId}-${label}@example.test`;
 const result=await admin.auth.admin.createUser({email,password,email_confirm:true});assert.ifError(result.error);const id=result.data.user!.id;
 if(role!=='member')sql(`update public.user_roles set role='${role}' where user_id='${id}';`);
 const client=createClient(dburl,local.ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const signed=await client.auth.signInWithPassword({email,password});assert.ifError(signed.error);
 return {id,email,token:signed.data.session!.access_token,client};
}
async function call(path:string,method='GET',body?:unknown,token?:string){
 const response=await fetch(app+path,{method,headers:{...(token?{authorization:`Bearer ${token}`}:{origin:new URL(app).origin}),...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,redirect:'manual'});
 const json=await response.json().catch(()=>null);return {status:response.status,json,response};
}
function success(result:Awaited<ReturnType<typeof call>>,status=200){assert.equal(result.status,status,JSON.stringify(result.json));return result.json.data;}

test('real Auth verification, persisted member CRUD, isolation, consent, revocation and deletion',async()=>{
 const email=`adequate-${runId}-signup@example.test`;
 const signup=success(await call('/api/auth/signup','POST',{email,password}),201);assert.equal(signup.verification_required,true);
 const link=await admin.auth.admin.generateLink({type:'signup',email,password});assert.ifError(link.error);
 const verify=await fetch(`${app}/api/auth/callback?token_hash=${encodeURIComponent(link.data.properties!.hashed_token)}&type=signup&next=/today`,{redirect:'manual'});assert.equal(verify.status,303);assert.ok(verify.headers.getSetCookie().length>0);
 const login=await call('/api/auth/login','POST',{email,password});success(login);assert.ok(login.response.headers.getSetCookie().length>0);
 const aclient=createClient(dburl,local.ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});const asigned=await aclient.auth.signInWithPassword({email,password});assert.ifError(asigned.error);const a={id:asigned.data.user!.id,token:asigned.data.session!.access_token,client:aclient};
 const b=await member('second');
 success(await call('/api/profile','PATCH',{display_name:'Synthetic acceptance member',onboarding_completed:true},a.token));
 const reflection=success(await call('/api/reflections','POST',{body:'Private acceptance fixture; never founder material.'},a.token),201);
 assert.ok(success(await call('/api/reflections','GET',undefined,a.token)).some((r:any)=>r.id===reflection.id));
 assert.equal(success(await call('/api/reflections','GET',undefined,b.token)).some((r:any)=>r.id===reflection.id),false);
 const guessed=await call('/api/reflections/'+reflection.id,'PATCH',{body:'Unauthorized edit'},b.token);assert.ok([403,404].includes(guessed.status),JSON.stringify(guessed.json));
 success(await call('/api/reflections/'+reflection.id,'PATCH',{body:'Edited private fixture.'},a.token));
 const exported=success(await call('/api/export','GET',undefined,a.token));assert.ok(JSON.stringify(exported).includes('Edited private fixture.'));
 const deniedAI=await call('/api/ai','POST',{task:'reflection.structure',input:{text:'A private fixture'}},a.token);assert.equal(deniedAI.status,403);
 success(await call('/api/preferences','PUT',{theme:'light',ai_enabled:true},a.token));success(await call('/api/consents','PUT',{purpose:'ai_processing',granted:true},a.token));
 const ai=success(await call('/api/ai','POST',{task:'reflection.structure',input:{text:'A private fixture'}},a.token));assert.equal(ai.source,'mock');assert.equal(ai.ok,true);assert.match(ai.label,/unapproved|not LG-approved/);
 success(await call('/api/reflections/'+reflection.id,'DELETE',undefined,a.token));assert.equal(success(await call('/api/reflections','GET',undefined,a.token)).some((r:any)=>r.id===reflection.id),false);
 success(await call('/api/auth/logout','POST',undefined,a.token));assert.equal((await call('/api/reflections','GET',undefined,a.token)).status,401);
 const reLogin=await aclient.auth.signInWithPassword({email,password});assert.ifError(reLogin.error);a.token=reLogin.data.session!.access_token;
 assert.equal(success(await call('/api/preferences','GET',undefined,a.token)).theme,'light');
 success(await call('/api/account','DELETE',{confirmation:'DELETE'},b.token));assert.equal((await call('/api/reflections','GET',undefined,b.token)).status,401);
});

test('founder versioned draft publication, restricted media, bookmarks and playback resume',async()=>{
 const founder=await member('founder','founder');const editor=await member('editor','editor');const reader=await member('reader');
 const draft={title:'Synthetic publication fixture',slug:`fixture-${runId}`,body:'Synthetic testing material, not LG words.',kind:'essay',audience:'public',provenance:'user_authored'};
 const content=success(await call('/api/studio/content','POST',draft,founder.token),201);
 assert.equal((await call('/api/studio/content','GET',undefined,reader.token)).status,403);
 assert.equal(success(await call('/api/content','GET')).some((r:any)=>r.id===content.id),false);
 assert.equal((await call(`/api/studio/content/${content.id}/transition`,'POST',{state:'published'},founder.token)).status,400);
 success(await call(`/api/studio/content/${content.id}`,'PATCH',{rights_verified:true},founder.token));
 success(await call(`/api/studio/content/${content.id}/transition`,'POST',{state:'review'},founder.token));
 assert.equal((await call(`/api/studio/content/${content.id}/transition`,'POST',{state:'approved'},editor.token)).status,403);
 success(await call(`/api/studio/content/${content.id}/transition`,'POST',{state:'approved'},founder.token));
 success(await call(`/api/studio/content/${content.id}/transition`,'POST',{state:'published'},founder.token));
 assert.ok(success(await call('/api/content','GET')).some((r:any)=>r.id===content.id));
 success(await call('/api/bookmarks','POST',{content_id:content.id},reader.token),201);
 success(await call('/api/playback','PUT',{content_id:content.id,position_seconds:12.5},reader.token));
 assert.ok(JSON.stringify(success(await call('/api/bookmarks','GET',undefined,reader.token))).includes(content.id));
 assert.ok(JSON.stringify(success(await call('/api/playback','GET',undefined,reader.token))).includes('12.5'));
 success(await call(`/api/studio/content/${content.id}/transition`,'POST',{state:'draft'},founder.token));
 success(await call(`/api/studio/content/${content.id}`,'PATCH',{body:'Edited synthetic test words.'},founder.token));
 const versions=success(await call(`/api/studio/content/${content.id}/versions`,'GET',undefined,founder.token));assert.ok(versions.length>=3);
 const rolled=success(await call(`/api/studio/content/${content.id}/rollback`,'POST',{version:1},founder.token));assert.equal(rolled.state,'draft');assert.equal(rolled.founder_approved,false);
 assert.equal(success(await call('/api/content','GET')).some((r:any)=>r.id===content.id),false);
 assert.ok(success(await call('/api/studio/audit','GET',undefined,founder.token)).some((e:any)=>e.action==='content.rollback'&&e.entity_id===content.id));
 // A real private Storage object is created only inside the isolated test stack.
 const assetId=crypto.randomUUID(),path=`${founder.id}/${assetId}.wav`;
 const media=await admin.from('media_assets').insert({id:assetId,owner_id:founder.id,content_id:content.id,storage_path:path,mime_type:'audio/wav',byte_size:44,rights_status:'verified',scan_status:'clean',rights_notes:'Synthetic fixture only',restricted:true});assert.ifError(media.error);
 const wav=new Uint8Array(44);wav.set([82,73,70,70],0);wav.set([87,65,86,69],8);
 const stored=await admin.storage.from('recordings').upload(path,wav,{contentType:'audio/wav'});assert.ifError(stored.error);
 const denied=await call(`/api/media/${assetId}/access`,'GET',undefined,reader.token);assert.ok([403,404].includes(denied.status),JSON.stringify(denied.json));
 const access=success(await call(`/api/media/${assetId}/access`,'GET',undefined,founder.token));assert.ok(access.url||access.signed_url||access.signedUrl);
});

test('actual quarantined upload, rights approval and playable public synthetic audio',async()=>{
 const founder=await member('audio-founder','founder');
 const row=success(await call('/api/studio/content','POST',{title:'Synthetic audio fixture (not LG)',slug:`audio-${runId}`,body:'Synthetic technical fixture, not a founder recording.',kind:'audio',audience:'public',provenance:'user_authored'},founder.token),201);
 const sampleRate=8000,samples=8000,wav=Buffer.alloc(44+samples*2);
 wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVE',8);wav.write('fmt ',12);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(sampleRate,24);wav.writeUInt32LE(sampleRate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(samples*2,40);
 for(let i=0;i<samples;i++)wav.writeInt16LE(Math.round(1000*Math.sin(2*Math.PI*220*i/sampleRate)),44+i*2);
 const form=new FormData();form.set('file',new File([wav],'synthetic-test.wav',{type:'audio/wav'}));form.set('content_id',row.id);form.set('rights_notes','Locally generated synthetic test tone; not LG audio.');
 const uploaded=await fetch(app+'/api/media/upload',{method:'POST',headers:{authorization:`Bearer ${founder.token}`},body:form});const body=await uploaded.json();assert.equal(uploaded.status,201,JSON.stringify(body));const asset=body.data;
 assert.equal((await call(`/api/media/${asset.id}/access`,'GET',undefined,founder.token)).status,403);
 success(await call(`/api/media/${asset.id}`,'PATCH',{rights_status:'verified',restricted:false,transcript:'Synthetic test tone only; no speech.',chapters:[{title:'Test tone',start_seconds:0}]},founder.token));
 // Isolated fixture scanner attestation; this does not claim an antivirus engine was installed.
 sql(`update public.media_assets set scan_status='clean' where id='${asset.id}';`);
 success(await call(`/api/studio/content/${row.id}`,'PATCH',{rights_verified:true},founder.token));
 for(const state of ['review','approved','published'])success(await call(`/api/studio/content/${row.id}/transition`,'POST',{state},founder.token));
 const access=success(await call(`/api/media/${asset.id}/access`,'GET'));const url=access.url||access.signed_url||access.signedUrl;assert.ok(url);
 const sound=await fetch(url,{headers:{Range:'bytes=0-43'}});assert.ok([200,206].includes(sound.status));assert.equal(Buffer.from(await sound.arrayBuffer()).subarray(0,4).toString(),'RIFF');
 const detail=success(await call(`/api/content/${row.id}`,'GET'));assert.equal(detail.media[0].transcript,'Synthetic test tone only; no speech.');
 const versions=success(await call(`/api/studio/content/${row.id}/versions`,'GET',undefined,founder.token));assert.ok(versions.some((v:any)=>v.snapshot.media_assets?.some((m:any)=>m.transcript==='Synthetic test tone only; no speech.')));
 // Unpublish after the test so public empty-media browser checks remain meaningful.
 success(await call(`/api/studio/content/${row.id}/transition`,'POST',{state:'draft'},founder.token));
});

test('direct deletion RPC queues private blobs and executable worker removes them',async()=>{
 const subject=await member('deletion-worker');const mediaId=crypto.randomUUID(),path=`${subject.id}/${mediaId}.wav`;
 const created=await admin.from('media_assets').insert({id:mediaId,owner_id:subject.id,storage_path:path,mime_type:'audio/wav',byte_size:12,scan_status:'clean',rights_status:'verified',rights_notes:'Synthetic deletion fixture',restricted:true});assert.ifError(created.error);
 const stored=await admin.storage.from('recordings').upload(path,new Uint8Array([82,73,70,70,1,0,0,0,87,65,86,69]),{contentType:'audio/wav'});assert.ifError(stored.error);
 const signed=await admin.storage.from('recordings').createSignedUrl(path,120);assert.ifError(signed.error);
 const deletion=await subject.client.rpc('delete_own_account');assert.ifError(deletion.error);
 const {processMediaDeletions}=await import('../../scripts/delete-private-media.mjs');
 const cleanup=await processMediaDeletions(admin);assert.ok(cleanup.completed>=1);assert.equal(cleanup.failed,0);
 assert.equal((await admin.from('media_assets').select('id').eq('id',mediaId)).data?.length,0);
 assert.ok((await fetch(signed.data!.signedUrl)).status>=400);
 const profile=await admin.auth.admin.getUserById(subject.id);assert.ok(!profile.data.user?.email);
});

test('native anonymous login without browser Origin issues a usable session and revokes it',async()=>{
 const user=await member('native-auth');
 const login=await fetch(app+'/api/auth/login',{method:'POST',headers:{'content-type':'application/json','x-client-platform':'native'},body:JSON.stringify({email:user.email,password})});
 const payload=await login.json();assert.equal(login.status,200,JSON.stringify(payload));const token=payload.data.session.access_token;assert.ok(token);
 success(await call('/api/reflections','POST',{body:'Synthetic native API fixture.'},token),201);
 success(await call('/api/auth/logout','POST',undefined,token));assert.equal((await call('/api/reflections','GET',undefined,token)).status,401);
});
