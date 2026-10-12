import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {createApiHandler} from '../../apps/platform/src/lib/api';

test('real local native HTTP login without Origin returns tokens and bearer logout revokes access',async()=>{
  const raw=await readFile(process.env.ADEQUATE_LOCAL_ENV_FILE??'apps/platform/.env.local','utf8');
  const env:Record<string,string>={};
  for(const line of raw.split('\n')){const match=/^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line);if(match)env[match[1]]=match[2].replace(/^"|"$/g,'');}
  const provider=new URL(env.NEXT_PUBLIC_SUPABASE_URL);
  assert.ok(provider.protocol==='http:'&&['127.0.0.1','localhost'].includes(provider.hostname),'This integration check requires the isolated loopback Supabase instance.');
  assert.ok(env.SUPABASE_SERVICE_ROLE_KEY&&env.AUTH_RATE_LIMIT_SALT,'Local fixture credentials and durable auth rate salt are required.');
  const admin=createClient(provider.href,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const password=`Aa9!${randomUUID()}`;
  const created=await admin.auth.admin.createUser({email:`native-api-${randomUUID()}@example.test`,password,email_confirm:true});
  assert.equal(created.error,null,'Local test account could not be created.');
  const user=created.data.user!;
  const handler=createApiHandler({environment:env});
  const server=createServer(async(incoming,outgoing)=>{
    try{
      const headers=new Headers();for(const [name,value] of Object.entries(incoming.headers)){if(Array.isArray(value))for(const item of value)headers.append(name,item);else if(value!==undefined)headers.set(name,value);}
      const chunks:Buffer[]=[];for await(const chunk of incoming)chunks.push(Buffer.from(chunk));
      const bytes=Buffer.concat(chunks);const method=incoming.method??'GET';
      const request=new Request(`http://127.0.0.1:${(server.address() as {port:number}).port}${incoming.url}`,{method,headers,...(!['GET','HEAD'].includes(method)?{body:bytes}:{})});
      const response=await handler(request);outgoing.writeHead(response.status,Object.fromEntries(response.headers));outgoing.end(await response.text());
    }catch{outgoing.writeHead(500);outgoing.end('Local check failed.');}
  });
  try{
    await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
    const base=`http://127.0.0.1:${(server.address() as {port:number}).port}`;
    const headers={'content-type':'application/json','x-client-platform':'native'};
    const body=JSON.stringify({email:user.email,password});
    assert.equal((await fetch(`${base}/api/auth/login`,{method:'POST',headers:{...headers,origin:'https://attacker.example'},body})).status,403);
    assert.equal((await fetch(`${base}/api/auth/login`,{method:'POST',headers:{...headers,cookie:'session=private'},body})).status,403);
    const login=await fetch(`${base}/api/auth/login`,{method:'POST',headers,body});
    assert.equal(login.status,200,'Stateless native login failed.');
    const envelope=await login.json();assert.ok(envelope.data.session.access_token&&envelope.data.session.refresh_token,'Native login did not return a session.');
    assert.equal(login.headers.get('set-cookie'),null,'Native authentication must stay stateless.');
    const bearer={authorization:`Bearer ${envelope.data.session.access_token}`};
    assert.equal((await fetch(`${base}/api/reflections`,{headers:bearer})).status,200);
    const logout=await fetch(`${base}/api/auth/logout`,{method:'POST',headers:bearer});assert.equal(logout.status,200,'Bearer logout failed.');
    assert.equal((await logout.json()).data.signed_out,true);
    assert.equal((await fetch(`${base}/api/reflections`,{headers:bearer})).status,401,'A revoked native token retained private API access.');
  }finally{
    await new Promise<void>(resolve=>server.close(()=>resolve()));
    const removed=await admin.auth.admin.deleteUser(user.id);assert.equal(removed.error,null,'Local fixture cleanup failed.');
  }
});
