import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';import {tmpdir} from 'node:os';
import {scanWithClamAV} from '../../scripts/scan-recordings.mjs';

test('scanner exit protocol never treats missing or failed scanning as clean',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'adequate-scanner-test-'));
 try{
  for(const [exit,status] of [[0,'clean'],[1,'rejected'],[2,'pending']]){
   const command=join(dir,'scanner-'+exit);await writeFile(command,`#!/bin/sh\nexit ${exit}\n`,{mode:0o700});assert.equal(await scanWithClamAV(join(dir,'fixture'),command),status);
  }
  assert.equal(await scanWithClamAV(join(dir,'fixture'),join(dir,'not-installed')),'pending');
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('local credentials parser accepts Supabase CLI quoted output without exposing values',async()=>{
 const {parseLocalEnvironment}=await import('../../scripts/read-local-env.mjs');
 assert.deepEqual(parseLocalEnvironment('# local fixture\nANON_KEY="test.anon.value"\nSERVICE_ROLE_KEY=\'test.service.value\'\nURL=http://127.0.0.1:54321\n'),{ANON_KEY:'test.anon.value',SERVICE_ROLE_KEY:'test.service.value',URL:'http://127.0.0.1:54321'});
});
