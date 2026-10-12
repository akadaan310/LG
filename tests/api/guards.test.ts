import test from 'node:test';
import assert from 'node:assert/strict';
import {ApiError, assertMutationOrigin, readBoundedJson, safeRedirect, verifyUpload} from '../../apps/platform/src/lib/guards';

test('cookie mutations reject absent and cross-site origins', () => {
  for (const headers of [{}, {origin:'https://attacker.example'}, {origin:'null'}]) {
    assert.throws(() => assertMutationOrigin(new Request('https://adequate.example/api/reflections', {method:'POST',headers})), (e: unknown) => e instanceof ApiError && e.code==='CSRF_REJECTED');
  }
  assert.doesNotThrow(() => assertMutationOrigin(new Request('https://adequate.example/api/reflections', {method:'POST',headers:{origin:'https://adequate.example'}})));
});

test('canonical origin supports proxy-rewritten request URLs',()=>{
  const request=new Request('http://localhost:3100/api/reflections',{method:'POST',headers:{origin:'http://127.0.0.1:3100'}});
  assert.doesNotThrow(()=>assertMutationOrigin(request,'http://127.0.0.1:3100'));
  assert.throws(()=>assertMutationOrigin(new Request('http://localhost:3100/api/reflections',{method:'POST',headers:{origin:'https://attacker.example'}}),'http://127.0.0.1:3100'),(e:unknown)=>e instanceof ApiError&&e.code==='CSRF_REJECTED');
});

test('native token requests bypass origin guard only for well formed bearer headers', () => {
  assert.doesNotThrow(() => assertMutationOrigin(new Request('https://adequate.example/api/reflections', {method:'POST',headers:{authorization:'Bearer a.b.c'}})));
  assert.throws(() => assertMutationOrigin(new Request('https://adequate.example/api/reflections', {method:'POST',headers:{authorization:'Basic a.b.c'}})), (e: unknown) => e instanceof ApiError && e.code==='INVALID_AUTHORIZATION');
  assert.throws(() => assertMutationOrigin(new Request('https://adequate.example/api/reflections', {method:'POST',headers:{authorization:'Bearer '}})), (e: unknown) => e instanceof ApiError && e.code==='INVALID_AUTHORIZATION');
});

test('stateless native initial auth permits JSON without browser origin or cookies',()=>{
  for(const action of ['login','signup','recover'])assert.doesNotThrow(()=>assertMutationOrigin(new Request(`https://adequate.example/api/auth/${action}`,{method:'POST',headers:{'x-client-platform':'native','content-type':'application/json'},body:'{}'})));
});

test('native header cannot bypass cookie, browser-origin or non-auth mutation protection',()=>{
  const headers={'x-client-platform':'native','content-type':'application/json'};
  const denied=[
    new Request('https://adequate.example/api/auth/login',{method:'POST',headers:{...headers,cookie:'session=private'},body:'{}'}),
    new Request('https://adequate.example/api/auth/login',{method:'POST',headers:{...headers,cookie:''},body:'{}'}),
    new Request('https://adequate.example/api/auth/login',{method:'POST',headers:{...headers,origin:'https://attacker.example'},body:'{}'}),
    new Request('https://adequate.example/api/auth/login',{method:'POST',headers:{...headers,'sec-fetch-site':'cross-site'},body:'{}'}),
    new Request('https://adequate.example/api/reflections',{method:'POST',headers,body:'{}'}),
    new Request('https://adequate.example/api/auth/password',{method:'POST',headers,body:'{}'}),
    new Request('https://adequate.example/api/auth/logout',{method:'POST',headers,body:'{}'}),
    new Request('https://adequate.example/api/auth/login',{method:'POST',headers:{'x-client-platform':'native','content-type':'text/plain'},body:'{}'}),
  ];
  for(const request of denied)assert.throws(()=>assertMutationOrigin(request),(e:unknown)=>e instanceof ApiError&&e.code==='CSRF_REJECTED');
});

test('JSON reader rejects actual oversized bodies without trusting content-length', async () => {
  await assert.rejects(readBoundedJson(new Request('https://adequate.example/api/reflections', {method:'POST',headers:{'content-type':'application/json','content-length':'2'},body:JSON.stringify({body:'x'.repeat(1024)})}),100), (e: unknown) => e instanceof ApiError && e.code==='BODY_TOO_LARGE');
});

test('JSON reader requires JSON and reports malformed payloads', async () => {
  await assert.rejects(readBoundedJson(new Request('https://adequate.example/api/reflections',{method:'POST',body:'{}'})), (e: unknown)=>e instanceof ApiError && e.code==='UNSUPPORTED_MEDIA_TYPE');
  await assert.rejects(readBoundedJson(new Request('https://adequate.example/api/reflections',{method:'POST',headers:{'content-type':'application/json'},body:'{'})), (e: unknown)=>e instanceof ApiError && e.code==='INVALID_JSON');
  assert.deepEqual(await readBoundedJson(new Request('https://adequate.example/api/reflections',{method:'POST',headers:{'content-type':'application/json'},body:'{"body":"private"}'})),{body:'private'});
});

test('recovery redirects cannot escape the app', () => {
  for (const candidate of ['https://attacker.example','//attacker.example','/\\attacker.example','/api/auth/callback','/%2f%2fattacker.example']) assert.equal(safeRedirect(candidate),'/today');
  assert.equal(safeRedirect('/auth?recovery=1'),'/auth?recovery=1');
});

test('media upload rejects spoofed signatures, non-audio and over-limit files', () => {
  assert.throws(()=>verifyUpload(new TextEncoder().encode('<svg>'), 'audio/mpeg', 5),(e:unknown)=>e instanceof ApiError && e.code==='UNSUPPORTED_MEDIA_TYPE');
  assert.throws(()=>verifyUpload(new Uint8Array([0x49,0x44,0x33]),'audio/mpeg',25*1024*1024+1),(e:unknown)=>e instanceof ApiError && e.code==='BODY_TOO_LARGE');
  assert.deepEqual(verifyUpload(new Uint8Array([0x49,0x44,0x33,4,0,0,0,0,0,0]),'audio/mpeg',10),{extension:'mp3',mime:'audio/mpeg'});
  const wav=new Uint8Array([82,73,70,70,1,0,0,0,87,65,86,69]);
  assert.deepEqual(verifyUpload(wav,'audio/wav',12),{extension:'wav',mime:'audio/wav'});
});
