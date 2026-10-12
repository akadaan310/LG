import test from 'node:test';
import assert from 'node:assert/strict';
import {createApiHandler} from '../../apps/platform/src/lib/api';
import {serviceConfiguration} from '../../apps/platform/src/lib/supabase';

test('session exposes service and owner gates when unconfigured',async()=>{
  const response=await createApiHandler({environment:{}})(new Request('https://adequate.example/api/session'));
  assert.equal(response.status,200);
  const body=await response.json();
  assert.equal(body.data.configured,false);assert.equal(body.data.user,null);assert.equal(body.data.signup_enabled,false);assert.equal(body.data.features.pathways,false);
});
test('service configuration rejects privileged keys and accepts public-only credentials',()=>{
  const env={NEXT_PUBLIC_SUPABASE_URL:'https://test.supabase.co'};
  const legacy=(role:string)=>`eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({role})).toString('base64url')}.test`;
  for(const key of ['sb_secret_test',legacy('service_role'),'not-a-key'])assert.equal(serviceConfiguration({...env,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:key}),null);
  assert.notEqual(serviceConfiguration({...env,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'}),null);
  assert.notEqual(serviceConfiguration({...env,NEXT_PUBLIC_SUPABASE_ANON_KEY:legacy('anon')}),null);
});
test('unconfigured member requests fail with an envelope and private cache protection',async()=>{
  const response=await createApiHandler({environment:{}})(new Request('https://adequate.example/api/reflections'));
  assert.equal(response.status,503);assert.equal(response.headers.get('cache-control'),'private, no-store');
  const body=await response.json();assert.equal(body.error.code,'SERVICE_UNAVAILABLE');assert.match(body.traceId,/^[0-9a-f-]{36}$/);
});
test('cookie mutation origin is checked before service access',async()=>{
  const response=await createApiHandler({environment:{}})(new Request('https://adequate.example/api/reflections',{method:'POST',headers:{'content-type':'application/json'},body:'{"body":"Private"}'}));
  assert.equal(response.status,403);assert.equal((await response.json()).error.code,'CSRF_REJECTED');
});
test('deleted or revoked accounts cannot read private records with valid tokens',async()=>{
  const client={auth:{getUser:async()=>({data:{user:{id:'00000000-0000-4000-a000-000000000001',user_metadata:{role:'founder'}}},error:null})},rpc:async(name:string)=>({data:name==='active_account'?false:true,error:null})};
  const handler=createApiHandler({environment:{NEXT_PUBLIC_SUPABASE_URL:'https://test.supabase.co',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'},clientFactory:()=>client as never});
  const response=await handler(new Request('https://adequate.example/api/reflections',{headers:{authorization:'Bearer a.b.c'}}));
  assert.equal(response.status,401);assert.equal((await response.json()).error.code,'ACCOUNT_INACTIVE');
});
test('user editable founder metadata never grants Studio access',async()=>{
  const client={auth:{getUser:async()=>({data:{user:{id:'00000000-0000-4000-a000-000000000001',user_metadata:{role:'founder'}}},error:null})},rpc:async()=>({data:true,error:null}),from:()=>({select:()=>({eq:async()=>({data:[],error:null})})})};
  const handler=createApiHandler({environment:{NEXT_PUBLIC_SUPABASE_URL:'https://test.supabase.co',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'},clientFactory:()=>client as never});
  const response=await handler(new Request('https://adequate.example/api/studio/content',{headers:{authorization:'Bearer a.b.c'}}));
  assert.equal(response.status,403);assert.equal((await response.json()).error.code,'ROLE_REQUIRED');
});

test('staff detail includes authorized drafts and quarantined media metadata',async()=>{
  const contentId='00000000-0000-4000-a000-000000000002';
  class Query {
    constructor(private rows:Record<string,unknown>[]){ }
    select(){return this;} eq(key:string,value:unknown){this.rows=this.rows.filter(row=>row[key]===value);return this;} neq(key:string,value:unknown){this.rows=this.rows.filter(row=>row[key]!==value);return this;}
    order(){return this;} async limit(){return {data:this.rows,error:null};}
    then(resolve:(value:unknown)=>unknown){return Promise.resolve({data:this.rows,error:null}).then(resolve);}
  }
  const client={auth:{getUser:async()=>({data:{user:{id:'00000000-0000-4000-a000-000000000001'}},error:null})},rpc:async()=>({data:true,error:null}),from:(name:string)=>new Query(name==='user_roles'?[{user_id:'00000000-0000-4000-a000-000000000001',role:'editor'}]:name==='content'?[{id:contentId,state:'draft',founder_approved:false,rights_verified:false,provenance:'placeholder'}]:[{id:'00000000-0000-4000-a000-000000000003',content_id:contentId,scan_status:'pending',rights_status:'pending'}])};
  const handler=createApiHandler({environment:{NEXT_PUBLIC_SUPABASE_URL:'https://test.supabase.co',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'},clientFactory:()=>client as never});
  const response=await handler(new Request(`https://adequate.example/api/content/${contentId}`,{headers:{authorization:'Bearer a.b.c'}}));
  assert.equal(response.status,200);const body=await response.json();assert.equal(body.data.state,'draft');assert.equal(body.data.media[0].scan_status,'pending');
});
