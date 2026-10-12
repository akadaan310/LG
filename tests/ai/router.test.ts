import test from 'node:test';
import assert from 'node:assert/strict';
import { createTaskRouter, createRemoteAdapter } from '../../packages/ai/src/index.ts';

const context = { requesterId: 'member-a', roles: ['member'] as const, consent: true, authorizedSources: [] };
const call = (router: ReturnType<typeof createTaskRouter>, input: unknown = {text:'I want to preserve a thought.'}, overrides = {}) => router.runTask({task:'reflection.structure', input, context:{...context,...overrides}});

test('mock default returns validated reflection output visibly marked unapproved', async () => {
 const result = await call(createTaskRouter());
 assert.equal(result.ok, true);
 if (result.ok) { assert.equal(result.source, 'mock'); assert.match(result.label, /mock/); assert.match(result.label, /not LG-approved/); assert.equal(result.output.sections[0].text, 'I want to preserve a thought.'); }
});

test('consent, editor authorization, input bounds and private source owner are enforced before adapter work', async () => {
 let invoked = 0;
 const router = createTaskRouter({adapter:{kind:'mock', async generate(){invoked++; return {output:{title:'x',sections:[]},source:'mock'};}}});
 assert.equal((await call(router, undefined, {consent:false})).error?.code, 'CONSENT_REQUIRED');
 assert.equal((await router.runTask({task:'founder.draft',input:{brief:'proposal'},context})).error?.code, 'ROLE_REQUIRED');
 assert.equal((await call(router,{text:' '})).error?.code, 'INVALID_INPUT');
 assert.equal((await call(router,{text:'x'.repeat(20001)})).error?.code, 'INVALID_INPUT');
 assert.equal((await call(router, undefined, {authorizedSources:[{id:'private-b',visibility:'private',ownerId:'member-b',text:'private'}]})).error?.code,'SOURCE_FORBIDDEN');
 assert.equal(invoked,0);
});

test('all seven task contracts produce schema-valid mock or deterministic results', async () => {
 const router = createTaskRouter();
 const editorContext = {...context,roles:['editor'],authorizedSources:[{id:'published-1',visibility:'published',title:'A source',text:'A published source about practice.'}]};
 for (const [task,input] of [
  ['reflection.structure',{text:'A reflection'}],['idea.organize',{text:'An idea'}],['content.discover',{query:'practice'}],
  ['founder.draft',{brief:'A reviewable proposal'}],['copy.adapt',{text:'An editable proposal',format:'plain'}],
  ['transcript.summarize',{transcript:'An authorized transcript.'}],['recommendation.explain',{contentIds:['published-1']}]
 ] as const) { const result = await router.runTask({task,input,context:editorContext}); assert.equal(result.ok,true,task); }
});

test('discovery uses only authorized sources and bypasses model generation', async () => {
 const router = createTaskRouter({adapter:{kind:'mock',async generate(){throw new Error('must not call model');}}});
 const result = await router.runTask({task:'content.discover',input:{query:'practice',limit:1},context:{...context,authorizedSources:[{id:'approved',visibility:'published',title:'Practice',text:'Practice deliberately'},{id:'other',visibility:'published',title:'Other',text:'Something else'}]}});
 assert.equal(result.ok,true); if(result.ok){assert.equal(result.source,'deterministic');assert.deepEqual(result.output.items.map(item=>item.id),['approved']);}
});

test('malformed and unauthorized model references fail without mutating input', async () => {
 const input={text:'my original reflection'};
 const router=createTaskRouter({adapter:{kind:'oracle',async generate(){return {output:{title:'x',sections:[{heading:'h',text:'x'}],publish:true},source:'oracle'};}}});
 const result=await call(router,input);
 assert.equal(result.error?.code,'INVALID_OUTPUT'); assert.deepEqual(input,{text:'my original reflection'}); assert.equal(result.manualFallback,true);
 const references = createTaskRouter({adapter:{kind:'oracle',async generate(){return {output:{explanation:'read this',sourceIds:['private-other']},source:'oracle'};}}});
 assert.equal((await references.runTask({task:'recommendation.explain',input:{contentIds:['allowed']},context:{...context,authorizedSources:[{id:'allowed',visibility:'published',text:'allowed'}]}})).error?.code,'INVALID_OUTPUT');
});

test('deadline cancels generation and circuit rejects repeated unavailable inference', async () => {
 let aborted=false,called=0;
 const router=createTaskRouter({timeoutMs:15,failureThreshold:1,resetAfterMs:1000,adapter:{kind:'oracle',async generate(_,signal){called++;await new Promise<void>(resolve=>signal.addEventListener('abort',()=>{aborted=true;resolve();},{once:true}));throw new Error('cancelled');}}});
 assert.equal((await call(router)).error?.code,'TIMEOUT'); assert.equal(aborted,true);
 assert.equal((await call(router)).error?.code,'CIRCUIT_OPEN'); assert.equal(called,1);
});

test('caller cancellation and bounded queue return manual fallback', async () => {
 let release:()=>void=()=>{};
 const router=createTaskRouter({timeoutMs:1000,maxConcurrent:1,maxQueued:0,adapter:{kind:'oracle',async generate(_,signal){await new Promise<void>((resolve)=>{release=resolve;signal.addEventListener('abort',()=>resolve(),{once:true});});return {output:{title:'x',sections:[{heading:'h',text:'x'}]},source:'oracle'};}}});
 const controller=new AbortController();
 const first=router.runTask({task:'reflection.structure',input:{text:'x'},context,signal:controller.signal});
 assert.equal((await call(router)).error?.code,'BUSY'); controller.abort(); assert.equal((await first).error?.code,'CANCELLED'); release();
});

test('remote adapter accepts one configured HTTPS endpoint and never redirects', async () => {
 assert.throws(()=>createRemoteAdapter({endpoint:'http://localhost:8787/v1/tasks',token:'secret'}),/HTTPS/);
 assert.throws(()=>createRemoteAdapter({endpoint:'https://user:pass@example.test/v1/tasks',token:'secret'}),/credentials/);
 const requests: RequestInit[]=[];
 const adapter=createRemoteAdapter({endpoint:'https://gateway.example.test/v1/tasks',token:'service-secret',fetch:async(url,options)=>{assert.equal(String(url),'https://gateway.example.test/v1/tasks');requests.push(options!);return new Response(JSON.stringify({output:{title:'x',sections:[{heading:'h',text:'x'}]},source:'mock',modelVersion:'local-mock-v1'}));}});
 const result=await call(createTaskRouter({adapter})); assert.equal(result.ok,true);if(result.ok)assert.equal(result.source,'mock');assert.equal(requests[0].redirect,'error');assert.equal(new Headers(requests[0].headers).get('authorization'),'Bearer service-secret');
});

test('unrecognized task names, including object prototype names, return typed input failure',async()=>{
 const router=createTaskRouter();
 for(const task of ['unknown.task','__proto__','constructor'])assert.equal((await router.runTask({task:task as never,input:{},context})).error?.code,'INVALID_INPUT');
});
