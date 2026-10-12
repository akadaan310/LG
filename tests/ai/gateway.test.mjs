import test from 'node:test';
import assert from 'node:assert/strict';
import { createGateway, createRuntimeAdapter } from '../../infrastructure/oracle/gateway.mjs';
const token='test-service-token';
const body={task:'reflection.structure',input:{text:'A private thought'},sources:[]};
async function started(options={}) {const gateway=createGateway({token,...options});await new Promise(resolve=>gateway.server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${gateway.server.address().port}`;return {gateway,base,close:()=>gateway.shutdown()};}
const post=(base,payload=body,signal)=>fetch(`${base}/v1/tasks`,{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify(payload),signal});

test('local gateway separates liveness and readiness and authenticates inference and metrics',async()=>{
 const app=await started();try{
  assert.equal((await fetch(`${app.base}/health/live`)).status,200);assert.equal((await fetch(`${app.base}/health/ready`)).status,200);
  assert.equal((await fetch(`${app.base}/metrics`)).status,401);assert.equal((await fetch(`${app.base}/v1/tasks`,{method:'POST'})).status,401);
  const response=await post(app.base);assert.equal(response.status,200);const result=await response.json();assert.equal(result.source,'mock');assert.equal(result.output.sections[0].text,body.input.text);
 }finally{await app.close();}
});

test('gateway bounds requests and validates model JSON without exposing private failures',async()=>{
 const app=await started({runtime:{async ready(){return true},async generate(){throw new Error('SECRET PRIVATE THOUGHT');}}});try{
  assert.equal((await post(app.base,{...body,task:'arbitrary.tool'})).status,400);
  assert.equal((await post(app.base,{...body,input:{text:'x'.repeat(20001)}})).status,400);
  const response=await post(app.base);assert.equal(response.status,503);assert.doesNotMatch(await response.text(),/SECRET|PRIVATE/);
 }finally{await app.close();}
});

test('gateway returns unavailable readiness independently of liveness',async()=>{
 const app=await started({runtime:{async ready(){return false},async generate(){throw new Error('unavailable')}}});try{
  assert.equal((await fetch(`${app.base}/health/live`)).status,200);assert.equal((await fetch(`${app.base}/health/ready`)).status,503);
 }finally{await app.close();}
});

test('gateway enforces bounded queue and deadline cancellation',async()=>{
 let cancelled=false,startedRuntime;const began=new Promise(resolve=>startedRuntime=resolve);
 const app=await started({maxConcurrent:1,maxQueued:0,deadlineMs:100,runtime:{async ready(){return true},async generate(_,signal){startedRuntime();await new Promise(resolve=>signal.addEventListener('abort',()=>{cancelled=true;resolve()},{once:true}));throw new Error('cancelled')}}});try{
  const first=post(app.base);await began;assert.equal((await post(app.base)).status,429);assert.equal((await first).status,504);assert.equal(cancelled,true);
 }finally{await app.close();}
});

test('disconnect cancels running inference and graceful shutdown stops readiness',async()=>{
 let cancelled=false,startedRuntime;const began=new Promise(resolve=>startedRuntime=resolve);
 const app=await started({deadlineMs:300,runtime:{async ready(){return true},async generate(_,signal){startedRuntime();await new Promise(resolve=>signal.addEventListener('abort',()=>{cancelled=true;resolve()},{once:true}));throw new Error('cancelled')}}});
 const controller=new AbortController();const pending=post(app.base,body,controller.signal);await began;controller.abort();await assert.rejects(pending);await app.close();assert.equal(cancelled,true);
});

test('runtime adapter restricts runtime URL to a loopback service and rejects malformed output',async()=>{
 assert.throws(()=>createRuntimeAdapter({runtime:'ollama',runtimeUrl:'http://example.test:11434',model:'test'}),/loopback/);
 const runtime=createRuntimeAdapter({runtime:'ollama',runtimeUrl:'http://127.0.0.1:11434',model:'test',fetch:async()=>new Response(JSON.stringify({message:{content:'not JSON'}}))});
 await assert.rejects(()=>runtime.generate(body,new AbortController().signal));
});

test('request deadline bounds an incomplete body before it reaches the runtime',async()=>{
 const {request}=await import('node:http');
 const app=await started({deadlineMs:30});
 try{
  const status=await new Promise((resolve,reject)=>{
   const req=request(`${app.base}/v1/tasks`,{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json','content-length':'100'}},response=>{response.resume();resolve(response.statusCode);});
   req.on('error',reject);req.write('{');
   const limit=setTimeout(()=>{req.destroy();reject(new Error('incomplete body escaped deadline'));},500);limit.unref();
  });assert.equal(status,504);
 }finally{await app.close();}
});

test('gateway opens circuit after failed inference while liveness stays available',async()=>{
 const app=await started({failureThreshold:1,runtime:{async ready(){return true},async generate(){throw new Error('unavailable')}}});try{
  assert.equal((await post(app.base)).status,503);assert.equal((await fetch(`${app.base}/health/ready`)).status,503);assert.equal((await fetch(`${app.base}/health/live`)).status,200);
  const next=await post(app.base);assert.equal((await next.json()).error.code,'CIRCUIT_OPEN');
 }finally{await app.close();}
});

test('CLI refuses real runtime activation without a pinned, matching approved registry entry',async()=>{
 const {mkdtemp,writeFile,rm}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const {join}=await import('node:path');const {execFile}=await import('node:child_process');const {promisify}=await import('node:util');
 const dir=await mkdtemp(join(tmpdir(),'adequate-registry-'));
 try{
  const registry=join(dir,'registry.json');const models=[{id:'candidate',version:'v1',runtime:'llama.cpp',model:'approved',license:{approved:true},runtime_config:{url:'http://127.0.0.1:8080',model:'approved'}}];
  await writeFile(registry,JSON.stringify({schema_version:1,active:'candidate',models}));
  const invocation=promisify(execFile);
  await assert.rejects(()=>invocation(process.execPath,['infrastructure/oracle/gateway.mjs'],{cwd:new URL('../../',import.meta.url),timeout:10000,killSignal:'SIGKILL',env:{...process.env,REGISTRY_FILE:registry,RUNTIME:'ollama',MODEL:'different-model',GATEWAY_TOKEN:token}}),error=>error.code===1);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('gateway rejects administrative output fields and logs only request metadata',async()=>{
 const logs=[];
 const app=await started({log:entry=>logs.push(entry),runtime:{async ready(){return true},async generate(){return {output:{title:'SECRET TITLE',sections:[{heading:'h',text:'PRIVATE TEXT'}],publish:true},source:'oracle'}}}});
 try{
  const response=await post(app.base);assert.equal(response.status,502);assert.equal((await response.json()).error.code,'INVALID_OUTPUT');
  assert.equal(logs.length,1);assert.doesNotMatch(JSON.stringify(logs),/SECRET|PRIVATE|private thought/);assert.equal(logs[0].code,'INVALID_OUTPUT');
 }finally{await app.close();}
});
